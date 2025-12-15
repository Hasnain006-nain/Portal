import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { studentsApi } from '../../lib/apiClient';
import { Users, Plus, Edit, Trash2, Loader2, User, ArrowLeft, X, Mail, BookOpen, Search, Filter, Phone, GraduationCap, Eye, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface StudentsProps {
  onTabChange?: (tab: string) => void;
}

interface Student {
  id: string;
  student_id: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  year: number;
  status: 'active' | 'inactive' | 'graduated';
  created_at: string;
}

interface FormData {
  student_id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  year: string;
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

export function Students({ onTabChange }: StudentsProps = {}) {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterYear, setFilterYear] = useState('');
  
  const [formData, setFormData] = useState<FormData>({
    student_id: '',
    name: '',
    email: '',
    phone: '',
    department: '',
    year: ''
  });

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const isAdmin = currentUser.role === 'admin';

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, filterDepartment, filterYear]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await studentsApi.getAll();
      setStudents(data);
    } catch (error: any) {
      toast.error('Failed to load students');
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterDepartment) {
      filtered = filtered.filter(student => student.department === filterDepartment);
    }

    if (filterYear) {
      filtered = filtered.filter(student => student.year.toString() === filterYear);
    }

    setFilteredStudents(filtered);
  };

  const generateStudentId = () => {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `STU${year}${randomNum}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const studentData = {
        student_id: formData.student_id || generateStudentId(),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        year: parseInt(formData.year),
        status: 'active' as const
      };

      if (editingStudent) {
        await studentsApi.update(editingStudent.id, studentData);
        toast.success('Student updated successfully!');
      } else {
        await studentsApi.create(studentData);
        toast.success('Student created successfully!');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchStudents();
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      student_id: student.student_id,
      name: student.name,
      email: student.email,
      phone: student.phone || '',
      department: student.department,
      year: student.year.toString()
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (student: Student) => {
    if (!confirm(`Are you sure you want to delete ${student.name}?`)) return;

    try {
      await studentsApi.delete(student.id);
      toast.success('Student deleted successfully!');
      if (selectedStudent?.id === student.id) {
        setSelectedStudent(null);
      }
      fetchStudents();
    } catch (error: any) {
      toast.error(error.message || 'Delete failed');
    }
  };

  const resetForm = () => {
    setFormData({
      student_id: '',
      name: '',
      email: '',
      phone: '',
      department: '',
      year: ''
    });
    setEditingStudent(null);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterDepartment('');
    setFilterYear('');
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

  // Detail View
  if (selectedStudent) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6 w-full max-w-full"
      >
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedStudent(null)}
            className="hover:bg-accent transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Students
          </Button>
          {isAdmin && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedStudent(null);
                  setTimeout(() => handleEdit(selectedStudent), 100);
                }}
                className="hover:bg-primary hover:text-primary-foreground transition-all"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Student
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => {
                  setSelectedStudent(null);
                  setTimeout(() => handleDelete(selectedStudent), 100);
                }}
                className="hover:bg-destructive/90 transition-all"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Student
              </Button>
            </div>
          )}
        </div>

        <Card className="p-8 shadow-lg">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {selectedStudent.student_id}
                </Badge>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {selectedStudent.department}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold mb-2">{selectedStudent.name}</h1>
              <p className="text-muted-foreground">{selectedStudent.email}</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSelectedStudent(null)}
              className="hover:bg-accent transition-colors"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex items-center gap-3">
                <User className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Student ID</p>
                  <p className="font-semibold">{selectedStudent.student_id}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-blue-500/5 border-blue-500/20">
              <div className="flex items-center gap-3">
                <GraduationCap className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Year</p>
                  <p className="font-semibold">Year {selectedStudent.year}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-green-500/5 border-green-500/20">
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-semibold">{selectedStudent.department}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-purple-500/5 border-purple-500/20">
              <div className="flex items-center gap-3">
                <Badge className="h-8 w-8 rounded-full bg-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-semibold capitalize">{selectedStudent.status}</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Email</p>
                      <p className="font-medium">{selectedStudent.email}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Phone</p>
                      <p className="font-medium">{selectedStudent.phone || 'N/A'}</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  // List View
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 w-full max-w-full"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="text-muted-foreground mt-1">View and manage student records</p>
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
                  Add Student
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingStudent ? 'Edit Student' : 'Add New Student'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingStudent ? 'Update student information' : 'Create a new student record'}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="student_id">Student ID</Label>
                    <Input
                      id="student_id"
                      value={formData.student_id}
                      onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                      placeholder="Auto-generated if empty"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter full name"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter email address"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Enter phone number"
                      className="mt-1"
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

                  <div>
                    <Label htmlFor="year">Year *</Label>
                    <Select value={formData.year} onValueChange={(value) => setFormData({ ...formData, year: value })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Year 1</SelectItem>
                        <SelectItem value="2">Year 2</SelectItem>
                        <SelectItem value="3">Year 3</SelectItem>
                        <SelectItem value="4">Year 4</SelectItem>
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
                          {editingStudent ? 'Updating...' : 'Creating...'}
                        </>
                      ) : (
                        editingStudent ? 'Update Student' : 'Create Student'
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
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
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Years</SelectItem>
              <SelectItem value="1">Year 1</SelectItem>
              <SelectItem value="2">Year 2</SelectItem>
              <SelectItem value="3">Year 3</SelectItem>
              <SelectItem value="4">Year 4</SelectItem>
            </SelectContent>
          </Select>
          {(searchTerm || filterDepartment || filterYear) && (
            <Button variant="outline" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </Card>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {filteredStudents.map((student) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
            >
              <Card className="group relative overflow-hidden border-2 hover:border-primary/30 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card/50 to-card backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className="text-xs font-medium bg-primary/5 border-primary/20 text-primary">
                          {student.student_id}
                        </Badge>
                        <Badge variant="info" className="text-xs">
                          Year {student.year}
                        </Badge>
                        <Badge 
                          variant={student.status === 'active' ? 'success' : 'secondary'} 
                          className="text-xs capitalize"
                        >
                          {student.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg mb-2 group-hover:text-primary transition-colors">
                        {student.name}
                      </CardTitle>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{student.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <GraduationCap className="h-3 w-3" />
                          <span className="truncate">{student.department}</span>
                        </div>
                        {student.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span className="truncate">{student.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(student);
                          }}
                          className="h-8 w-8 p-0 hover:bg-primary hover:text-primary-foreground hover:scale-110 transition-all"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(student);
                          }}
                          className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground hover:scale-110 transition-all"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:scale-105"
                      onClick={() => setSelectedStudent(student)}
                    >
                      <Eye className="h-3 w-3 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
                
                {/* Decorative gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredStudents.length === 0 && (
        <Card className="p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No students found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || filterDepartment || filterYear
              ? 'Try adjusting your filters'
              : 'Get started by adding your first student'}
          </p>
          {isAdmin && !searchTerm && !filterDepartment && !filterYear && (
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Student
            </Button>
          )}
        </Card>
      )}
    </motion.div>
  );
}