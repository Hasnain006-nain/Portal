import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { coursesApi } from '../../lib/apiClient';
import { Users, Plus, Edit, Trash2, Loader2, GraduationCap, ArrowLeft, X, Search, Filter, BookOpen, Clock, User } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface CoursesProps {
  onTabChange?: (tab: string) => void;
}

interface Course {
  id: string;
  course_code: string;
  name: string;
  description?: string;
  credits: number;
  department: string;
  instructor: string;
  semester?: string;
  created_at: string;
}

interface FormData {
  course_code: string;
  name: string;
  description: string;
  credits: string;
  department: string;
  instructor: string;
  semester: string;
}

const departments = [
  'Computer Science',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Economics',
  'Business Administration',
  'Literature',
  'Psychology',
  'Engineering'
];

const semesters = [
  'Fall 2024',
  'Spring 2025',
  'Summer 2025',
  'Fall 2025'
];

export function Courses({ onTabChange }: CoursesProps = {}) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterSemester, setFilterSemester] = useState('');

  const [formData, setFormData] = useState<FormData>({
    course_code: '',
    name: '',
    description: '',
    credits: '3',
    department: '',
    instructor: '',
    semester: ''
  });

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const isAdmin = currentUser.role === 'admin';

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, searchTerm, filterDepartment, filterSemester]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await coursesApi.getAll();
      setCourses(data);
    } catch (error: any) {
      toast.error('Failed to load courses');
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCourses = () => {
    let filtered = courses;

    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterDepartment) {
      filtered = filtered.filter(course => course.department === filterDepartment);
    }

    if (filterSemester) {
      filtered = filtered.filter(course => course.semester === filterSemester);
    }

    setFilteredCourses(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const courseData = {
        course_code: formData.course_code,
        name: formData.name,
        description: formData.description,
        credits: parseInt(formData.credits),
        department: formData.department,
        instructor: formData.instructor,
        semester: formData.semester
      };

      if (editingCourse) {
        await coursesApi.update(editingCourse.id, courseData);
        toast.success('Course updated successfully!');
      } else {
        await coursesApi.create(courseData);
        toast.success('Course created successfully!');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchCourses();
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      course_code: course.course_code,
      name: course.name,
      description: course.description || '',
      credits: course.credits.toString(),
      department: course.department,
      instructor: course.instructor,
      semester: course.semester || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (course: Course) => {
    if (!confirm(`Are you sure you want to delete "${course.name}"?`)) return;

    try {
      await coursesApi.delete(course.id);
      toast.success('Course deleted successfully!');
      fetchCourses();
    } catch (error: any) {
      toast.error(error.message || 'Delete failed');
    }
  };

  const handleView = (course: Course) => {
    setSelectedCourse(course);
    setIsViewDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      course_code: '',
      name: '',
      description: '',
      credits: '3',
      department: '',
      instructor: '',
      semester: ''
    });
    setEditingCourse(null);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterDepartment('');
    setFilterSemester('');
  };

  const getDepartmentColor = (department: string) => {
    const colors = {
      'Computer Science': 'bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-300 dark:border-blue-800',
      'Mathematics': 'bg-green-500/10 text-green-700 border-green-200 dark:text-green-300 dark:border-green-800',
      'Physics': 'bg-purple-500/10 text-purple-700 border-purple-200 dark:text-purple-300 dark:border-purple-800',
      'Chemistry': 'bg-orange-500/10 text-orange-700 border-orange-200 dark:text-orange-300 dark:border-orange-800',
      'Biology': 'bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-300 dark:border-emerald-800',
      'Economics': 'bg-yellow-500/10 text-yellow-700 border-yellow-200 dark:text-yellow-300 dark:border-yellow-800',
      'Business Administration': 'bg-red-500/10 text-red-700 border-red-200 dark:text-red-300 dark:border-red-800',
      'Literature': 'bg-pink-500/10 text-pink-700 border-pink-200 dark:text-pink-300 dark:border-pink-800',
      'Psychology': 'bg-indigo-500/10 text-indigo-700 border-indigo-200 dark:text-indigo-300 dark:border-indigo-800',
      'Engineering': 'bg-gray-500/10 text-gray-700 border-gray-200 dark:text-gray-300 dark:border-gray-800'
    };
    return colors[department as keyof typeof colors] || 'bg-gray-500/10 text-gray-700 border-gray-200 dark:text-gray-300 dark:border-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-8 w-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 w-full max-w-full"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Course Management</h1>
          <p className="text-muted-foreground mt-1">Manage academic courses and programs</p>
        </div>
        <div className="flex items-center gap-2">
          {onTabChange && (
            <Button 
              variant="outline" 
              onClick={() => onTabChange('dashboard')}
              className="hover:bg-accent transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          {isAdmin && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={resetForm}
                  className="bg-primary hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Course
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingCourse ? 'Edit Course' : 'Add New Course'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingCourse ? 'Update course information' : 'Create a new academic course'}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="course_code">Course Code *</Label>
                    <Input
                      id="course_code"
                      value={formData.course_code}
                      onChange={(e) => setFormData({ ...formData, course_code: e.target.value })}
                      placeholder="e.g., CS101"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="name">Course Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter course name"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter course description"
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="credits">Credits *</Label>
                      <Input
                        id="credits"
                        type="number"
                        min="1"
                        max="6"
                        value={formData.credits}
                        onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                        placeholder="3"
                        className="mt-1"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="department">Department *</Label>
                      <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="instructor">Instructor *</Label>
                    <Input
                      id="instructor"
                      value={formData.instructor}
                      onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                      placeholder="Enter instructor name"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="semester">Semester</Label>
                    <Select value={formData.semester} onValueChange={(value) => setFormData({ ...formData, semester: value })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {semesters.map((semester) => (
                          <SelectItem key={semester} value={semester}>
                            {semester}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {editingCourse ? 'Updating...' : 'Creating...'}
                        </>
                      ) : (
                        editingCourse ? 'Update Course' : 'Create Course'
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Courses</p>
              <p className="text-2xl font-bold">{courses.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-blue-500/5 border-blue-500/20">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Departments</p>
              <p className="text-2xl font-bold">{new Set(courses.map(c => c.department)).size}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-green-500/5 border-green-500/20">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Total Credits</p>
              <p className="text-2xl font-bold">{courses.reduce((sum, course) => sum + course.credits, 0)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-purple-500/5 border-purple-500/20">
          <div className="flex items-center gap-3">
            <User className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-sm text-muted-foreground">Instructors</p>
              <p className="text-2xl font-bold">{new Set(courses.map(c => c.instructor)).size}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterSemester} onValueChange={setFilterSemester}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Semesters</SelectItem>
              {semesters.map((semester) => (
                <SelectItem key={semester} value={semester}>
                  {semester}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(searchTerm || filterDepartment || filterSemester) && (
            <Button variant="outline" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </Card>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredCourses.map((course) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-6 hover:shadow-lg transition-all border-2 hover:border-primary/20">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {course.course_code}
                      </Badge>
                      <Badge className={getDepartmentColor(course.department)}>
                        {course.department}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-lg mb-1 line-clamp-2">{course.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">by {course.instructor}</p>
                    {course.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{course.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{course.credits} credits</span>
                      {course.semester && <span>{course.semester}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleView(course)}
                      className="h-8 w-8 p-0 hover:bg-primary hover:text-primary-foreground"
                    >
                      <BookOpen className="h-4 w-4" />
                    </Button>
                    {isAdmin && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(course)}
                          className="h-8 w-8 p-0 hover:bg-primary hover:text-primary-foreground"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(course)}
                          className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => handleView(course)}
                >
                  View Details
                </Button>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredCourses.length === 0 && (
        <Card className="p-12 text-center">
          <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No courses found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || filterDepartment || filterSemester
              ? 'Try adjusting your search or filters'
              : 'No courses have been added yet'}
          </p>
          {isAdmin && !searchTerm && !filterDepartment && !filterSemester && (
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Course
            </Button>
          )}
        </Card>
      )}

      {/* View Course Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedCourse && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="outline">{selectedCourse.course_code}</Badge>
                  <Badge className={getDepartmentColor(selectedCourse.department)}>
                    {selectedCourse.department}
                  </Badge>
                </div>
                <DialogTitle className="text-2xl">{selectedCourse.name}</DialogTitle>
                <DialogDescription>
                  Instructor: {selectedCourse.instructor}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {selectedCourse.description && (
                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <p className="text-sm text-muted-foreground mt-1">{selectedCourse.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Credits</Label>
                    <p className="text-sm text-muted-foreground">{selectedCourse.credits}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Department</Label>
                    <p className="text-sm text-muted-foreground">{selectedCourse.department}</p>
                  </div>
                </div>
                {selectedCourse.semester && (
                  <div>
                    <Label className="text-sm font-medium">Semester</Label>
                    <p className="text-sm text-muted-foreground">{selectedCourse.semester}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedCourse.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}