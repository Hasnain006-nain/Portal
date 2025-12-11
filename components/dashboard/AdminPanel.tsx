import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { studentsApi, hostelsApi, enrollmentsApi } from '../../lib/apiClient';
import { Users, Plus, Edit, Trash2, Loader2, Mail, GraduationCap, ArrowLeft, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '../ui/dialog';

interface AdminPanelProps {
  onTabChange?: (tab: string) => void;
}

export function AdminPanel({ onTabChange }: AdminPanelProps = {}) {
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentEnrollments, setStudentEnrollments] = useState<any[]>([]);
  const [hostels, setHostels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [formData, setFormData] = useState({
    studentId: '',
    name: '',
    email: '',
    major: '',
    year: ''
  });

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const isAdmin = currentUser.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsData, hostelsData] = await Promise.all([
        studentsApi.getAll(),
        hostelsApi.getAll()
      ]);
      setStudents(studentsData);
      setHostels(hostelsData);
    } catch (error: any) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudent = async (student: any) => {
    try {
      setSelectedStudent(student);
      // Fetch student's enrollments
      const enrollments = await enrollmentsApi.getByStudentId(student.studentId);
      setStudentEnrollments(enrollments);
    } catch (error: any) {
      toast.error('Failed to load student details');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const studentData = {
        studentId: formData.studentId,
        name: formData.name,
        email: formData.email,
        major: formData.major,
        year: parseInt(formData.year)
      };

      if (editingStudent) {
        await studentsApi.update(editingStudent._id, studentData);
        toast.success('Student updated successfully!');
      } else {
        await studentsApi.create(studentData);
        toast.success('Student created successfully!');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    }
  };

  const handleEdit = (student: any) => {
    setEditingStudent(student);
    setFormData({
      studentId: student.studentId,
      name: student.name,
      email: student.email,
      major: student.major,
      year: student.year.toString()
    });
    setSelectedStudent(null); // Close detail view when editing
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;

    try {
      await studentsApi.delete(id);
      toast.success('Student deleted successfully!');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Delete failed');
    }
  };

  const resetForm = () => {
    setFormData({
      studentId: '',
      name: '',
      email: '',
      major: '',
      year: ''
    });
    setEditingStudent(null);
  };

  if (!isAdmin) {
    return (
      <Card className="p-12 text-center">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="mb-2">Admin Access Required</h3>
        <p className="text-muted-foreground">
          You need administrator privileges to access this panel.
        </p>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Student Detail View
  if (selectedStudent) {
    const assignedHostel = hostels[0]; // In real app, match by student's hostel assignment

    return (
      <div className="space-y-6 w-full max-w-full">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setSelectedStudent(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Students
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleEdit(selectedStudent)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setSelectedStudent(null)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <Card className="p-6">
          <h2 className="mb-6">{selectedStudent.name}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Student Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Student Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-muted-foreground text-sm">Student ID</p>
                  <p className="font-medium">{selectedStudent.studentId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Email</p>
                  <p className="font-medium">{selectedStudent.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Major</p>
                  <p className="font-medium">{selectedStudent.major}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Year</p>
                  <Badge variant="outline">Year {selectedStudent.year}</Badge>
                </div>
              </div>
            </div>

            {/* Hostel Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Hostel Assignment</h3>
              {assignedHostel ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-muted-foreground text-sm">Building</p>
                    <p className="font-medium">{assignedHostel.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Room Number</p>
                    <Badge variant="outline">A-301</Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Floor</p>
                    <p className="font-medium">3rd Floor</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Address</p>
                    <p className="font-medium text-sm">{assignedHostel.address}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm mb-2">Facilities</p>
                    <div className="flex flex-wrap gap-2">
                      {assignedHostel.facilities.map((facility: string, idx: number) => (
                        <Badge key={idx} variant="secondary">{facility}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No hostel assigned</p>
              )}
            </div>
          </div>
        </Card>

        {/* Enrolled Courses */}
        <Card className="p-6">
          <h3 className="mb-4">Enrolled Courses</h3>
          {studentEnrollments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {studentEnrollments.map((enrollment: any) => (
                <div key={enrollment._id} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{enrollment.courseCode}</Badge>
                    <Badge variant="secondary">{enrollment.course?.credits || 0} Credits</Badge>
                  </div>
                  <h4 className="mb-1">{enrollment.courseName}</h4>
                  <p className="text-sm text-muted-foreground">{enrollment.courseInstructor}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No courses enrolled</p>
          )}
        </Card>
      </div>
    );
  }

  // Student List View
  return (
    <div className="space-y-6 w-full max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl">Student Management</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">Manage student records and information</p>
        </div>
        <div className="flex items-center gap-2">
          {onTabChange && (
            <Button variant="outline" onClick={() => onTabChange('dashboard')} className="flex-shrink-0">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="flex-shrink-0">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Add Student</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingStudent ? 'Edit Student' : 'Add New Student'}</DialogTitle>
                <DialogDescription>
                  {editingStudent ? 'Update student information' : 'Create a new student record'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="studentId">Student ID</Label>
                    <Input
                      id="studentId"
                      value={formData.studentId}
                      onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                      placeholder="S001"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john.doe@university.edu"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="major">Major</Label>
                    <Input
                      id="major"
                      value={formData.major}
                      onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                      placeholder="Computer Science"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      type="number"
                      min="1"
                      max="5"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      placeholder="3"
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingStudent ? 'Update' : 'Create'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground">Total Students</p>
                <h3>{students.length}</h3>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-muted-foreground">Majors</p>
                <h3>{new Set(students.map(s => s.major)).size}</h3>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <Mail className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-muted-foreground">Active</p>
                <h3>{students.length}</h3>
              </div>
            </div>
          </Card>

        </div>

        {/* Students Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map((student) => (
            <Card
              key={student._id}
              className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleViewStudent(student)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{student.studentId}</Badge>
                    <Badge variant="secondary">Year {student.year}</Badge>
                  </div>
                  <h3 className="mb-1">{student.name}</h3>
                  <p className="text-muted-foreground text-sm">{student.major}</p>
                </div>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(student)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(student._id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium text-sm truncate ml-2 max-w-[180px]">{student.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Student ID</span>
                  <span className="font-medium">{student.studentId}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {students.length === 0 && (
          <Card className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="mb-2">No Students Found</h3>
            <p className="text-muted-foreground mb-4">
              Get started by adding your first student record.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
