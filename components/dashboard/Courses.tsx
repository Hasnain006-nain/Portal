import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { coursesApi, enrollmentsApi, studentsApi } from '../../lib/apiClient';
import { Users, Plus, Edit, Trash2, Loader2, GraduationCap, ArrowLeft, X, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { ExportButton } from '../ui/export-button';
import { exportCourses } from '../../lib/exportUtils';

interface CoursesProps {
  onTabChange?: (tab: string) => void;
}

export function Courses({ onTabChange }: CoursesProps = {}) {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [enrollmentMode, setEnrollmentMode] = useState<'select' | 'manual'>('select');
  const [editingEnrollment, setEditingEnrollment] = useState<any>(null);
  const [isEditEnrollmentDialogOpen, setIsEditEnrollmentDialogOpen] = useState(false);
  const [viewingStudent, setViewingStudent] = useState<any>(null);
  const [isViewStudentDialogOpen, setIsViewStudentDialogOpen] = useState(false);
  const [studentAllEnrollments, setStudentAllEnrollments] = useState<any[]>([]);
  const [enrollFormData, setEnrollFormData] = useState({
    studentId: '',
    studentName: '',
    studentEmail: '',
    manualStudentId: '',
    manualStudentName: '',
    manualStudentEmail: '',
    newCourseCode: ''
  });
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    credits: '',
    instructor: '',
    semester: '',
    enrolled: '',
    capacity: '',
    category: '',
    courseType: ''
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const facultyCategories = [
    { id: 'science', name: 'Science', color: 'bg-blue-500' },
    { id: 'economics', name: 'Economics', color: 'bg-green-500' },
    { id: 'business', name: 'Business', color: 'bg-purple-500' },
    { id: 'multimedia', name: 'Multimedia', color: 'bg-orange-500' },
    { id: 'literature', name: 'Literature', color: 'bg-pink-500' },
    { id: 'acting', name: 'Acting & Theatre', color: 'bg-red-500' }
  ];

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const isAdmin = currentUser.role === 'admin';

  const handleViewCourse = async (course: any) => {
    try {
      setSelectedCourse(course);
      await fetchEnrolledStudents(course.code);
    } catch (error: any) {
      toast.error('Failed to load course details');
    }
  };

  const fetchEnrolledStudents = async (courseCode: string) => {
    try {
      const enrollments = await enrollmentsApi.getByCourseCode(courseCode);
      console.log('Fetched enrollments for', courseCode, ':', enrollments);
      setEnrolledStudents(enrollments || []);
    } catch (error: any) {
      console.error('Failed to load enrolled students:', error);
      setEnrolledStudents([]);
    }
  };

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let enrollmentData;

      if (enrollmentMode === 'select') {
        const selectedStudent = allStudents.find(s => s.studentId === enrollFormData.studentId);
        if (!selectedStudent) {
          toast.error('Please select a student');
          return;
        }
        enrollmentData = {
          studentId: selectedStudent.studentId,
          studentName: selectedStudent.name,
          studentEmail: selectedStudent.email,
          courseCode: selectedCourse.code,
          courseName: selectedCourse.name,
          enrolledAt: new Date().toISOString()
        };
      } else {
        enrollmentData = {
          studentId: enrollFormData.manualStudentId,
          studentName: enrollFormData.manualStudentName,
          studentEmail: enrollFormData.manualStudentEmail,
          courseCode: selectedCourse.code,
          courseName: selectedCourse.name,
          enrolledAt: new Date().toISOString()
        };
      }

      const result = await enrollmentsApi.create(enrollmentData);
      console.log('Enrollment created:', result);
      toast.success('Student enrolled successfully!');
      setIsEnrollDialogOpen(false);
      resetEnrollForm();

      // Force refresh with a small delay to ensure backend is updated
      setTimeout(async () => {
        await fetchEnrolledStudents(selectedCourse.code);
        await fetchCourses();

        // Update selected course
        const updatedCourses = await coursesApi.getAll();
        const updatedCourse = updatedCourses.find(c => c.code === selectedCourse.code);
        if (updatedCourse) {
          setSelectedCourse(updatedCourse);
        }
      }, 300);
    } catch (error: any) {
      toast.error(error.message || 'Failed to enroll student');
    }
  };



  const handleViewStudent = async (enrollment: any) => {
    try {
      setViewingStudent(enrollment);
      // Fetch all enrollments for this student
      const allEnrollments = await enrollmentsApi.getByStudentId(enrollment.studentId);
      setStudentAllEnrollments(allEnrollments);
      setIsViewStudentDialogOpen(true);
    } catch (error: any) {
      toast.error('Failed to load student details');
    }
  };

  const handleEditEnrollment = (enrollment: any) => {
    setEditingEnrollment(enrollment);
    setEnrollFormData({
      studentId: enrollment.studentId,
      studentName: enrollment.studentName,
      studentEmail: enrollment.studentEmail,
      manualStudentId: enrollment.studentId,
      manualStudentName: enrollment.studentName,
      manualStudentEmail: enrollment.studentEmail,
      newCourseCode: enrollment.courseCode
    });
    setIsEditEnrollmentDialogOpen(true);
  };

  const handleUpdateEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const courseChanged = enrollFormData.newCourseCode !== editingEnrollment.courseCode;

      if (courseChanged) {
        // Course transfer: delete old enrollment and create new one
        const newCourse = courses.find(c => c.code === enrollFormData.newCourseCode);
        if (!newCourse) {
          toast.error('Selected course not found');
          return;
        }

        // Create transfer history entry
        const transferHistory = editingEnrollment.transferHistory || [];
        transferHistory.push({
          fromCourse: editingEnrollment.courseCode,
          fromCourseName: editingEnrollment.courseName,
          toCourse: newCourse.code,
          toCourseName: newCourse.name,
          transferredAt: new Date().toISOString()
        });

        // Create new enrollment with original date and transfer history
        const newEnrollmentData = {
          studentId: enrollFormData.manualStudentId,
          studentName: enrollFormData.manualStudentName,
          studentEmail: enrollFormData.manualStudentEmail,
          courseCode: newCourse.code,
          courseName: newCourse.name,
          enrolledAt: editingEnrollment.enrolledAt, // Keep original enrollment date
          transferHistory: transferHistory
        };

        await enrollmentsApi.create(newEnrollmentData);
        await enrollmentsApi.delete(editingEnrollment._id);

        toast.success(`Student transferred to ${newCourse.name} successfully!`);
      } else {
        // Just update student info
        const updatedData = {
          studentName: enrollFormData.manualStudentName,
          studentEmail: enrollFormData.manualStudentEmail
        };
        await enrollmentsApi.update(editingEnrollment._id, updatedData);
        toast.success('Student information updated successfully!');
      }

      setIsEditEnrollmentDialogOpen(false);
      setEditingEnrollment(null);
      resetEnrollForm();

      setTimeout(async () => {
        await fetchEnrolledStudents(selectedCourse.code);
        await fetchCourses();
      }, 300);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update student');
    }
  };

  const handleDeleteEnrollment = async (enrollmentId: string) => {
    if (!confirm('Are you sure you want to remove this student from the course?')) return;

    try {
      await enrollmentsApi.delete(enrollmentId);
      toast.success('Student removed from course successfully!');

      setTimeout(async () => {
        await fetchEnrolledStudents(selectedCourse.code);
        await fetchCourses();

        const updatedCourses = await coursesApi.getAll();
        const updatedCourse = updatedCourses.find(c => c.code === selectedCourse.code);
        if (updatedCourse) {
          setSelectedCourse(updatedCourse);
        }
      }, 300);
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove student');
    }
  };

  const resetEnrollForm = () => {
    setEnrollFormData({
      studentId: '',
      studentName: '',
      studentEmail: '',
      manualStudentId: '',
      manualStudentName: '',
      manualStudentEmail: '',
      newCourseCode: ''
    });
    setEnrollmentMode('select');
  };

  const handleStudentSelect = (studentId: string) => {
    const student = allStudents.find(s => s.studentId === studentId);
    if (student) {
      setEnrollFormData({
        ...enrollFormData,
        studentId: student.studentId,
        studentName: student.name,
        studentEmail: student.email
      });
    }
  };

  useEffect(() => {
    fetchCourses();
    if (isAdmin) {
      fetchStudents();
    }
  }, []);

  const fetchStudents = async () => {
    try {
      const data = await studentsApi.getAll();
      setAllStudents(data);
    } catch (error: any) {
      console.error('Failed to load students');
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await coursesApi.getAll();
      setCourses(data);
    } catch (error: any) {
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return; // Prevent duplicate submissions

    setIsSubmitting(true);
    try {
      const courseData = {
        code: formData.code,
        name: formData.name,
        credits: parseInt(formData.credits),
        instructor: formData.instructor,
        semester: formData.semester,
        enrolled: editingCourse ? parseInt(formData.enrolled) : 0,
        capacity: parseInt(formData.capacity),
        category: formData.category,
        courseType: formData.courseType
      };

      if (editingCourse) {
        await coursesApi.update(editingCourse._id, courseData);
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

  const handleEdit = (course: any) => {
    setEditingCourse(course);
    setFormData({
      code: course.code,
      name: course.name || '',
      credits: (course.credits || 0).toString(),
      instructor: course.instructor || '',
      semester: course.semester || '',
      enrolled: (course.enrolled || 0).toString(),
      capacity: (course.capacity || 30).toString(),
      category: course.category || '',
      courseType: course.courseType || 'major'
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;

    if (isSubmitting) return; // Prevent duplicate operations

    setIsSubmitting(true);

    try {
      await coursesApi.delete(id);
      toast.success('Course deleted successfully!');
      fetchCourses();
    } catch (error: any) {
      toast.error(error.message || 'Delete failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      credits: '',
      instructor: '',
      semester: '',
      enrolled: '',
      capacity: '',
      category: '',
      courseType: ''
    });
    setEditingCourse(null);
  };

  const filteredCourses = selectedCategory === 'all'
    ? courses
    : courses.filter(course => course.category === selectedCategory);

  const getCategoryColor = (categoryId: string) => {
    const category = facultyCategories.find(c => c.id === categoryId);
    return category?.color || 'bg-gray-500';
  };

  const getCategoryName = (categoryId: string) => {
    const category = facultyCategories.find(c => c.id === categoryId);
    return category?.name || categoryId;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Detail View
  if (selectedCourse) {
    const enrollmentRate = Math.round((selectedCourse.enrolled / selectedCourse.capacity) * 100);
    const available = selectedCourse.capacity - selectedCourse.enrolled;

    return (
      <div className="space-y-6 w-full max-w-full">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setSelectedCourse(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
          {isAdmin && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleEdit(selectedCourse)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="destructive" onClick={() => handleDelete(selectedCourse._id)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
        </div>

        <Card className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="outline" className="text-lg px-3 py-1">{selectedCourse.code}</Badge>
                <Badge variant="secondary" className="text-lg px-3 py-1">{selectedCourse.credits} Credits</Badge>
                {selectedCourse.category && (
                  <Badge className={`${getCategoryColor(selectedCourse.category)} text-white text-lg px-3 py-1`}>
                    {getCategoryName(selectedCourse.category)}
                  </Badge>
                )}
                {selectedCourse.courseType && (
                  <Badge variant={selectedCourse.courseType === 'major' ? 'default' : 'outline'} className="text-lg px-3 py-1">
                    {selectedCourse.courseType === 'major' ? 'Major' : 'Minor'}
                  </Badge>
                )}
              </div>
              <h1 className="mb-2">{selectedCourse.name}</h1>
              <p className="text-muted-foreground">{selectedCourse.instructor}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSelectedCourse(null)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
            <Card className="p-3 sm:p-4 bg-primary/5">
              <p className="text-muted-foreground text-[10px] sm:text-xs md:text-sm mb-1">Semester</p>
              <p className="font-medium text-xs sm:text-sm md:text-base">{selectedCourse.semester}</p>
            </Card>
            <Card className="p-3 sm:p-4 bg-blue-500/5">
              <p className="text-muted-foreground text-[10px] sm:text-xs md:text-sm mb-1">Enrolled</p>
              <h3 className="text-lg sm:text-xl md:text-2xl">{selectedCourse.enrolled}</h3>
            </Card>
            <Card className="p-3 sm:p-4 bg-green-500/5">
              <p className="text-muted-foreground text-[10px] sm:text-xs md:text-sm mb-1">Capacity</p>
              <h3 className="text-lg sm:text-xl md:text-2xl">{selectedCourse.capacity}</h3>
            </Card>
            <Card className="p-3 sm:p-4 bg-purple-500/5">
              <p className="text-muted-foreground text-[10px] sm:text-xs md:text-sm mb-1">Available</p>
              <Badge variant={available > 0 ? "outline" : "destructive"} className="text-xs sm:text-sm">
                {available} seats
              </Badge>
            </Card>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="mb-4">Enrollment Rate</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Current Enrollment</span>
                  <span className="font-medium">{enrollmentRate}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-4">
                  <div
                    className="bg-primary rounded-full h-4 transition-all"
                    style={{ width: `${enrollmentRate}%` }}
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3>Enrolled Students ({enrolledStudents.length})</h3>
                {isAdmin && (
                  <Button onClick={() => { resetEnrollForm(); setIsEnrollDialogOpen(true); }}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Enroll Student
                  </Button>
                )}
              </div>
              {enrolledStudents.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5 gap-2 sm:gap-3 md:gap-3">
                  {enrolledStudents.map((enrollment: any) => (
                    <Card
                      key={enrollment._id}
                      className="p-2 sm:p-2.5 md:p-3 relative group hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 w-full cursor-pointer border-2 hover:border-primary/50"
                      onClick={() => handleViewStudent(enrollment)}
                    >
                      <div className="space-y-1 text-center">
                        <p className="font-semibold text-[11px] sm:text-xs md:text-sm truncate">{enrollment.studentName}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate font-medium">{enrollment.studentId}</p>
                        <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground truncate">{enrollment.studentEmail}</p>
                        <p className="text-[8px] sm:text-[9px] md:text-[10px] text-muted-foreground mt-1 pt-1 border-t">
                          {new Date(enrollment.enrolledAt).toLocaleDateString()}
                        </p>
                      </div>
                      {isAdmin && (
                        <div className="absolute top-1 right-1 flex gap-1 opacity-0 md:group-hover:opacity-100 transition-opacity bg-background/95 rounded-md p-0.5 shadow-sm">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 sm:h-7 sm:w-7 hover:bg-primary/10"
                            onClick={(e) => { e.stopPropagation(); handleEditEnrollment(enrollment); }}
                          >
                            <Edit className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 sm:h-7 sm:w-7 text-destructive hover:bg-destructive/10"
                            onClick={(e) => { e.stopPropagation(); handleDeleteEnrollment(enrollment._id); }}
                          >
                            <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          </Button>
                        </div>
                      )}
                      {/* Mobile action buttons - always visible on touch devices */}
                      {isAdmin && (
                        <div className="flex gap-1 mt-2 pt-2 border-t md:hidden">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-7 text-[10px]"
                            onClick={(e) => { e.stopPropagation(); handleEditEnrollment(enrollment); }}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 h-7 text-[10px] text-destructive hover:bg-destructive/10"
                            onClick={(e) => { e.stopPropagation(); handleDeleteEnrollment(enrollment._id); }}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Remove
                          </Button>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No students enrolled yet</p>
                  {isAdmin && (
                    <Button className="mt-4" onClick={() => { resetEnrollForm(); setIsEnrollDialogOpen(true); }}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Enroll First Student
                    </Button>
                  )}
                </Card>
              )}
            </div>
          </div>
        </Card>

        {/* Enrollment Dialog for Detail View */}
        <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
          <DialogContent className="!w-[90%] sm:!w-[550px] !max-w-[600px] max-h-[90vh] overflow-hidden p-0 !rounded-2xl">
            <div className="p-6 border-b">
              <DialogHeader className="text-left">
                <DialogTitle className="text-xl font-semibold">Enroll Student</DialogTitle>
                <DialogDescription className="text-sm mt-1">
                  Add a student to {selectedCourse?.name} ({selectedCourse?.code})
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="flex border-b">
              <button
                type="button"
                onClick={() => setEnrollmentMode('select')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${enrollmentMode === 'select'
                  ? 'border-b-2 border-primary bg-primary/5 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
              >
                Select from List
              </button>
              <button
                type="button"
                onClick={() => setEnrollmentMode('manual')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${enrollmentMode === 'manual'
                  ? 'border-b-2 border-primary bg-primary/5 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
              >
                Add Manually
              </button>
            </div>

            <form onSubmit={handleEnrollStudent} className="flex flex-col h-full">
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {enrollmentMode === 'select' ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="studentSelect" className="text-sm font-medium mb-2 block">
                        Select Student
                      </Label>
                      <select
                        id="studentSelect"
                        value={enrollFormData.studentId}
                        onChange={(e) => handleStudentSelect(e.target.value)}
                        className="flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                        required
                      >
                        <option value="">Choose a student...</option>
                        {allStudents.map((student) => {
                          const isEnrolled = enrolledStudents.some(e => e.studentId === student.studentId);
                          return (
                            <option key={student._id} value={student.studentId} disabled={isEnrolled}>
                              {student.name} ({student.studentId}) {isEnrolled ? '- Already Enrolled' : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    {enrollFormData.studentId && (
                      <Card className="p-4 bg-primary/5 border-primary/20">
                        <h4 className="text-sm font-semibold mb-3">Selected Student</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Name:</span>
                            <span className="font-medium">{enrollFormData.studentName}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Student ID:</span>
                            <span className="font-medium">{enrollFormData.studentId}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Email:</span>
                            <span className="font-medium">{enrollFormData.studentEmail}</span>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="manualStudentId" className="text-sm font-medium mb-2 block">
                        Student ID
                      </Label>
                      <Input
                        id="manualStudentId"
                        value={enrollFormData.manualStudentId}
                        onChange={(e) => setEnrollFormData({ ...enrollFormData, manualStudentId: e.target.value })}
                        placeholder="e.g., S001"
                        className="h-11 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="manualStudentName" className="text-sm font-medium mb-2 block">
                        Student Name
                      </Label>
                      <Input
                        id="manualStudentName"
                        value={enrollFormData.manualStudentName}
                        onChange={(e) => setEnrollFormData({ ...enrollFormData, manualStudentName: e.target.value })}
                        placeholder="e.g., John Doe"
                        className="h-11 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="manualStudentEmail" className="text-sm font-medium mb-2 block">
                        Student Email
                      </Label>
                      <Input
                        id="manualStudentEmail"
                        type="email"
                        value={enrollFormData.manualStudentEmail}
                        onChange={(e) => setEnrollFormData({ ...enrollFormData, manualStudentEmail: e.target.value })}
                        placeholder="e.g., john.doe@university.edu"
                        className="h-11 rounded-lg"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t bg-muted/30 flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsEnrollDialogOpen(false)} className="px-6">
                  Cancel
                </Button>
                <Button type="submit" className="px-6">
                  Enroll Student
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Enrollment Dialog */}
        <Dialog open={isEditEnrollmentDialogOpen} onOpenChange={setIsEditEnrollmentDialogOpen}>
          <DialogContent className="!w-[90%] sm:!w-[500px] !max-w-[550px] max-h-[90vh] overflow-hidden p-0 !rounded-2xl">
            <div className="p-6 border-b">
              <DialogHeader className="text-left">
                <DialogTitle className="text-xl font-semibold">Edit Student Information</DialogTitle>
                <DialogDescription className="text-sm mt-1">
                  Update student details for {editingEnrollment?.studentName}
                </DialogDescription>
              </DialogHeader>
            </div>

            <form onSubmit={handleUpdateEnrollment} className="flex flex-col h-full">
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <div>
                  <Label htmlFor="editStudentId" className="text-sm font-medium mb-2 block">
                    Student ID (Cannot be changed)
                  </Label>
                  <Input
                    id="editStudentId"
                    value={enrollFormData.manualStudentId}
                    disabled
                    className="h-11 rounded-lg bg-muted"
                  />
                </div>
                <div>
                  <Label htmlFor="editStudentName" className="text-sm font-medium mb-2 block">
                    Student Name
                  </Label>
                  <Input
                    id="editStudentName"
                    value={enrollFormData.manualStudentName}
                    onChange={(e) => setEnrollFormData({ ...enrollFormData, manualStudentName: e.target.value })}
                    placeholder="e.g., John Doe"
                    className="h-11 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="editStudentEmail" className="text-sm font-medium mb-2 block">
                    Student Email
                  </Label>
                  <Input
                    id="editStudentEmail"
                    type="email"
                    value={enrollFormData.manualStudentEmail}
                    onChange={(e) => setEnrollFormData({ ...enrollFormData, manualStudentEmail: e.target.value })}
                    placeholder="e.g., john.doe@university.edu"
                    className="h-11 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="editCourseCode" className="text-sm font-medium mb-2 block">
                    Enrolled Course
                  </Label>
                  <select
                    id="editCourseCode"
                    value={enrollFormData.newCourseCode}
                    onChange={(e) => setEnrollFormData({ ...enrollFormData, newCourseCode: e.target.value })}
                    className="flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                    required
                  >
                    {courses.map((course) => (
                      <option key={course._id} value={course.code}>
                        {course.code} - {course.name}
                      </option>
                    ))}
                  </select>
                  {enrollFormData.newCourseCode !== editingEnrollment?.courseCode && (
                    <p className="text-xs text-amber-600 mt-2">
                      ⚠️ Changing course will transfer this student. Original enrollment date will be preserved.
                    </p>
                  )}
                </div>
              </div>

              <div className="p-6 border-t bg-muted/30 flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsEditEnrollmentDialogOpen(false)} className="px-6">
                  Cancel
                </Button>
                <Button type="submit" className="px-6">
                  Update Student
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Student Details Dialog */}
        <Dialog open={isViewStudentDialogOpen} onOpenChange={setIsViewStudentDialogOpen}>
          <DialogContent className="!w-[90%] sm:!w-[600px] !max-w-[650px] max-h-[90vh] overflow-hidden p-0 !rounded-2xl">
            <div className="p-6 border-b">
              <DialogHeader className="text-left">
                <DialogTitle className="text-xl font-semibold">Student Details</DialogTitle>
                <DialogDescription className="text-sm mt-1">
                  Complete information about {viewingStudent?.studentName}
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Student Basic Info */}
              <Card className="p-4 bg-primary/5 border-primary/20">
                <h4 className="text-sm font-semibold mb-3">Basic Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{viewingStudent?.studentName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Student ID:</span>
                    <span className="font-medium">{viewingStudent?.studentId}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{viewingStudent?.studentEmail}</span>
                  </div>
                </div>
              </Card>

              {/* Current Course Enrollment */}
              <Card className="p-4 bg-blue-500/5 border-blue-500/20">
                <h4 className="text-sm font-semibold mb-3">Current Course Enrollment</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Course:</span>
                    <span className="font-medium">{viewingStudent?.courseName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Course Code:</span>
                    <span className="font-medium">{viewingStudent?.courseCode}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Enrolled At:</span>
                    <span className="font-medium">
                      {viewingStudent?.enrolledAt
                        ? new Date(viewingStudent.enrolledAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Transfer History */}
              {viewingStudent?.transferHistory && viewingStudent.transferHistory.length > 0 && (
                <Card className="p-4 bg-amber-500/5 border-amber-500/20">
                  <h4 className="text-sm font-semibold mb-3">Transfer History</h4>
                  <div className="space-y-3">
                    {viewingStudent.transferHistory.map((transfer: any, index: number) => (
                      <div key={index} className="border-l-2 border-amber-500 pl-3 py-1">
                        <p className="text-xs font-medium">
                          Transferred from <span className="text-amber-700">{transfer.fromCourseName}</span> ({transfer.fromCourse})
                        </p>
                        <p className="text-xs font-medium">
                          to <span className="text-green-700">{transfer.toCourseName}</span> ({transfer.toCourse})
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(transfer.transferredAt).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* All Enrolled Courses */}
              <div>
                <h4 className="text-sm font-semibold mb-3">All Enrolled Courses ({studentAllEnrollments.length})</h4>
                {studentAllEnrollments.length > 0 ? (
                  <div className="space-y-2">
                    {studentAllEnrollments.map((enrollment: any, index: number) => (
                      <Card key={enrollment._id} className="p-3 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">{enrollment.courseCode}</Badge>
                              <span className="font-medium text-sm">{enrollment.courseName}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            #{index + 1}
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-6 text-center">
                    <p className="text-sm text-muted-foreground">No other courses found</p>
                  </Card>
                )}
              </div>
            </div>

            <div className="p-6 border-t bg-muted/30 flex gap-3 justify-end">
              <Button type="button" onClick={() => setIsViewStudentDialogOpen(false)} className="px-6">
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6 w-full max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl">Faculties</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-xs sm:text-sm md:text-base">View and manage course catalog</p>
        </div>
        <div className="flex items-center gap-2">
          {onTabChange && (
            <Button variant="outline" onClick={() => onTabChange('dashboard')} className="flex-shrink-0">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          )}
          {isAdmin && (
            <>
              <ExportButton
                onExport={exportCourses}
                label="Export"
                className="flex-shrink-0"
              />
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm} className="flex-shrink-0">
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Add Course</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="!w-[90%] sm:!w-[550px] !max-w-[600px] max-h-[90vh] overflow-hidden p-0 !rounded-2xl">
                  <div className="p-6 border-b">
                    <DialogHeader className="text-left">
                      <DialogTitle className="text-xl font-semibold">{editingCourse ? 'Edit Course' : 'Add New Course'}</DialogTitle>
                      <DialogDescription className="text-sm mt-1">
                        {editingCourse ? 'Update course information' : 'Create a new course entry'}
                      </DialogDescription>
                    </DialogHeader>
                  </div>
                  <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <div className="p-6 overflow-y-auto flex-1 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="code">Course Code</Label>
                          <Input
                            id="code"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            placeholder="CS101"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="credits">Credits</Label>
                          <Input
                            id="credits"
                            type="number"
                            value={formData.credits}
                            onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                            placeholder="4"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="name">Course Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Introduction to Programming"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="category">Faculty Category</Label>
                          <select
                            id="category"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            required
                          >
                            <option value="">Select a faculty</option>
                            {facultyCategories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="courseType">Course Type</Label>
                          <select
                            id="courseType"
                            value={formData.courseType}
                            onChange={(e) => setFormData({ ...formData, courseType: e.target.value })}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            required
                          >
                            <option value="">Select type</option>
                            <option value="major">Major</option>
                            <option value="minor">Minor</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="instructor">Instructor</Label>
                          <Input
                            id="instructor"
                            value={formData.instructor}
                            onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                            placeholder="Dr. Smith"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="semester">Semester</Label>
                          <Input
                            id="semester"
                            value={formData.semester}
                            onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                            placeholder="Fall 2024"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="capacity">Capacity</Label>
                        <Input
                          id="capacity"
                          type="number"
                          value={formData.capacity}
                          onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                          placeholder="50"
                          required
                        />
                      </div>
                    </div>
                    <div className="p-6 border-t bg-muted/30 flex gap-3 justify-end">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="px-6">
                        Cancel
                      </Button>
                      <Button type="submit" className="px-6">
                        {editingCourse ? 'Update' : 'Create'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {/* Faculty Category Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
        >
          All Faculties
        </Button>
        {facultyCategories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
            className={selectedCategory === category.id ? `${category.color} text-white hover:opacity-90` : ''}
          >
            {category.name}
          </Button>
        ))}
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-2 w-full">
        {filteredCourses.map((course) => {
          const enrollmentRate = Math.round((course.enrolled / course.capacity) * 100);
          const available = course.capacity - course.enrolled;

          return (
            <Card
              key={course._id}
              className="p-2 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleViewCourse(course)}
            >
              <div className="flex items-start justify-between mb-1.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-0.5 mb-1 flex-wrap">
                    <Badge variant="outline" className="text-[8px] px-1 py-0 h-3">{course.code}</Badge>
                    <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3">{course.credits}cr</Badge>
                    {course.category && (
                      <Badge className={`${getCategoryColor(course.category)} text-white text-[8px] px-1 py-0 h-3`}>
                        {getCategoryName(course.category)}
                      </Badge>
                    )}
                  </div>
                  <h3 className="mb-0.5 text-[11px] font-semibold leading-tight truncate">{course.name}</h3>
                  <p className="text-muted-foreground text-[9px] truncate">{course.instructor}</p>
                </div>
                {isAdmin && (
                  <div className="flex flex-col gap-0.5 ml-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-4 w-4 p-0"
                      onClick={() => handleEdit(course)}
                    >
                      <Edit className="h-2.5 w-2.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-4 w-4 p-0"
                      onClick={() => handleDelete(course._id)}
                    >
                      <Trash2 className="h-2.5 w-2.5 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-[9px]">Semester</span>
                  <span className="font-medium text-[9px]">{course.semester}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-[9px]">Enrolled</span>
                  <span className="font-medium text-[9px]">{course.enrolled}/{course.capacity}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-[9px]">Available</span>
                  <Badge variant={available > 0 ? "outline" : "destructive"} className="text-[8px] px-1 py-0 h-3">
                    {available}
                  </Badge>
                </div>
                <div className="pt-0.5">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-muted-foreground text-[8px]">Enrollment</span>
                    <span className="text-[8px] font-medium">{enrollmentRate}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1">
                    <div
                      className="bg-primary rounded-full h-1.5 sm:h-2 transition-all"
                      style={{ width: `${enrollmentRate}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredCourses.length === 0 && courses.length > 0 && (
        <Card className="p-12 text-center">
          <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="mb-2">No Courses in This Faculty</h3>
          <p className="text-muted-foreground mb-4">
            Try selecting a different faculty category.
          </p>
        </Card>
      )}

      {courses.length === 0 && (
        <Card className="p-12 text-center">
          <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="mb-2">No Courses Found</h3>
          <p className="text-muted-foreground mb-4">
            {isAdmin ? 'Get started by adding your first course.' : 'No courses available at the moment.'}
          </p>
        </Card>
      )}

      {/* Enrollment Dialog */}
      <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
        <DialogContent className="!w-[90%] sm:!w-[550px] !max-w-[600px] max-h-[90vh] overflow-hidden p-0 !rounded-2xl">
          <div className="p-6 border-b">
            <DialogHeader className="text-left">
              <DialogTitle className="text-xl font-semibold">Enroll Student</DialogTitle>
              <DialogDescription className="text-sm mt-1">
                Add a student to {selectedCourse?.name} ({selectedCourse?.code})
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex border-b">
            <button
              type="button"
              onClick={() => setEnrollmentMode('select')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${enrollmentMode === 'select'
                ? 'border-b-2 border-primary bg-primary/5 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
            >
              Select from List
            </button>
            <button
              type="button"
              onClick={() => setEnrollmentMode('manual')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${enrollmentMode === 'manual'
                ? 'border-b-2 border-primary bg-primary/5 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
            >
              Add Manually
            </button>
          </div>

          <form onSubmit={handleEnrollStudent} className="flex flex-col h-full">
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {enrollmentMode === 'select' ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="studentSelect2" className="text-sm font-medium mb-2 block">
                      Select Student
                    </Label>
                    <select
                      id="studentSelect2"
                      value={enrollFormData.studentId}
                      onChange={(e) => handleStudentSelect(e.target.value)}
                      className="flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                      required
                    >
                      <option value="">Choose a student...</option>
                      {allStudents.map((student) => {
                        const isEnrolled = enrolledStudents.some(e => e.studentId === student.studentId);
                        return (
                          <option key={student._id} value={student.studentId} disabled={isEnrolled}>
                            {student.name} ({student.studentId}) {isEnrolled ? '- Already Enrolled' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  {enrollFormData.studentId && (
                    <Card className="p-4 bg-primary/5 border-primary/20">
                      <h4 className="text-sm font-semibold mb-3">Selected Student</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Name:</span>
                          <span className="font-medium">{enrollFormData.studentName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Student ID:</span>
                          <span className="font-medium">{enrollFormData.studentId}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Email:</span>
                          <span className="font-medium">{enrollFormData.studentEmail}</span>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="manualStudentId2" className="text-sm font-medium mb-2 block">
                      Student ID
                    </Label>
                    <Input
                      id="manualStudentId2"
                      value={enrollFormData.manualStudentId}
                      onChange={(e) => setEnrollFormData({ ...enrollFormData, manualStudentId: e.target.value })}
                      placeholder="e.g., S001"
                      className="h-11 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="manualStudentName2" className="text-sm font-medium mb-2 block">
                      Student Name
                    </Label>
                    <Input
                      id="manualStudentName2"
                      value={enrollFormData.manualStudentName}
                      onChange={(e) => setEnrollFormData({ ...enrollFormData, manualStudentName: e.target.value })}
                      placeholder="e.g., John Doe"
                      className="h-11 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="manualStudentEmail2" className="text-sm font-medium mb-2 block">
                      Student Email
                    </Label>
                    <Input
                      id="manualStudentEmail2"
                      type="email"
                      value={enrollFormData.manualStudentEmail}
                      onChange={(e) => setEnrollFormData({ ...enrollFormData, manualStudentEmail: e.target.value })}
                      placeholder="e.g., john.doe@university.edu"
                      className="h-11 rounded-lg"
                      required
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-muted/30 flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsEnrollDialogOpen(false)} className="px-6">
                Cancel
              </Button>
              <Button type="submit" className="px-6">
                Enroll Student
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
