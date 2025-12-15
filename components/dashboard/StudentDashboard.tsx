import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { studentsApi, hostelsApi, coursesApi, booksApi, requestsApi, enrollmentsApi } from '../../lib/apiClient';
import { BookOpen, GraduationCap, Mail, User, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface StudentDashboardProps {
  onTabChange: (tab: string) => void;
}

export function StudentDashboard({ onTabChange }: StudentDashboardProps) {
  const [studentData, setStudentData] = useState<any>(null);
  const [hostelData, setHostelData] = useState<any>(null);
  const [borrowedBooks, setBorrowedBooks] = useState<any[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalBooks, setTotalBooks] = useState(0);
  const [totalCourses, setTotalCourses] = useState(0);

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      setLoading(true);

      // Fetch all students and find current user
      const students = await studentsApi.getAll();
      const student = students.find((s: any) => s.email === currentUser.email);
      setStudentData(student);

      // Fetch hostels
      const hostels = await hostelsApi.getAll();
      if (student?.hostelBuilding) {
        // Find student's assigned hostel
        const assignedHostel = hostels.find((h: any) => h._id === student.hostelBuilding);
        setHostelData(assignedHostel);
      }

      // Fetch courses
      const courses = await coursesApi.getAll();
      setTotalCourses(courses.length);

      // Fetch student's enrolled courses
      if (student?.studentId) {
        try {
          const enrollments = await enrollmentsApi.getByStudentId(student.studentId);
          setEnrolledCourses(enrollments.slice(0, 3)); // Show first 3
        } catch (error) {
          console.error('Failed to fetch enrollments:', error);
          setEnrolledCourses([]);
        }
      }

      // Fetch books
      const books = await booksApi.getAll();
      setTotalBooks(books.length);

      // Fetch actual borrowed books from requests
      try {
        const requests = await requestsApi.getByStudentId(currentUser.email);
        const borrowRequests = requests.filter((r: any) => r.type === 'borrow');
        const returnRequests = requests.filter((r: any) => r.type === 'return');

        // Get currently borrowed books (approved borrows without approved returns)
        const currentlyBorrowed = borrowRequests.filter((borrowReq: any) => {
          if (borrowReq.status !== 'approved') return false;

          // Check if this borrow has an approved return
          const hasReturnedBook = returnRequests.some(
            (returnReq: any) => returnReq.borrowingId === borrowReq._id &&
              returnReq.status === 'approved'
          );

          return !hasReturnedBook; // Only include if not returned
        });

        setBorrowedBooks(currentlyBorrowed);
      } catch (error) {
        console.error('Failed to fetch borrowed books:', error);
        setBorrowedBooks([]);
      }

    } catch (error: any) {
      toast.error('Failed to load dashboard data');
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6 w-full">
      <div className="w-full">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Welcome back, {currentUser.name}!</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">Here's your student dashboard overview</p>
      </div>

      {/* Student Profile Card */}
      <Card className="p-4 sm:p-5 md:p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 w-full">
        <h3 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold">My Profile</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 w-full">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <User className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Student ID</span>
            </div>
            <p className="font-medium text-sm sm:text-base truncate">{studentData?.studentId || 'N/A'}</p>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Mail className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Email</span>
            </div>
            <p className="font-medium text-sm sm:text-base truncate">{studentData?.email || currentUser.email}</p>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <GraduationCap className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Major</span>
            </div>
            <p className="font-medium text-sm sm:text-base truncate">{studentData?.major || 'N/A'}</p>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Year</span>
            </div>
            <p className="font-medium text-sm sm:text-base">Year {studentData?.year || 'N/A'}</p>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -4, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card className="p-4 sm:p-5 cursor-pointer hover:shadow-xl hover:border-blue-500/30 transition-all duration-300 w-full bg-gradient-to-br from-blue-500/5 to-blue-500/10" onClick={() => onTabChange('library')}>
            <div className="flex items-center gap-3 min-w-0">
              <motion.div 
                className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0"
                whileHover={{ rotate: 10, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <BookOpen className="h-6 w-6 text-blue-500" />
              </motion.div>
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs sm:text-sm mb-0.5">Available Books</p>
                <h3 className="text-base sm:text-lg font-semibold">{totalBooks}</h3>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -4, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card className="p-4 sm:p-5 cursor-pointer hover:shadow-xl hover:border-green-500/30 transition-all duration-300 bg-gradient-to-br from-green-500/5 to-green-500/10" onClick={() => onTabChange('courses')}>
            <div className="flex items-center gap-3">
              <motion.div 
                className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center shrink-0"
                whileHover={{ rotate: 10, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <GraduationCap className="h-6 w-6 text-green-500" />
              </motion.div>
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs sm:text-sm mb-0.5">Total Courses</p>
                <h3 className="text-base sm:text-lg font-semibold">{totalCourses}</h3>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Hostel Information */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-4 sm:p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold">Hostel Information</h3>
            </div>
          {studentData?.hostelBuilding && hostelData ? (
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs sm:text-sm">Building</span>
                <span className="font-medium text-sm sm:text-base">{hostelData.name || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs sm:text-sm">Room Number</span>
                <Badge variant="outline" className="text-xs">{studentData?.roomNumber || 'N/A'}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs sm:text-sm">Floor</span>
                <span className="font-medium text-sm sm:text-base">{studentData?.floor || 'N/A'}</span>
              </div>
              {hostelData.address && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs sm:text-sm">Address</span>
                  <span className="font-medium text-xs sm:text-sm text-right">{hostelData.address}</span>
                </div>
              )}
              {hostelData.facilities && hostelData.facilities.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-muted-foreground text-xs sm:text-sm mb-2">Facilities:</p>
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    {hostelData.facilities.map((facility: string, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {facility}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs sm:text-sm">Building</span>
                <span className="font-medium text-sm sm:text-base text-muted-foreground">N/A</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs sm:text-sm">Room Number</span>
                <Badge variant="outline" className="text-xs">N/A</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs sm:text-sm">Floor</span>
                <span className="font-medium text-sm sm:text-base text-muted-foreground">N/A</span>
              </div>
              <p className="text-muted-foreground text-sm mt-3 pt-3 border-t">
                Your hostel will be assigned by the admin soon.
              </p>
            </div>
          )}
          </Card>
        </motion.div>

        {/* Borrowed Books */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-4 sm:p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold">Borrowed Books</h3>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="ghost" size="sm" onClick={() => onTabChange('library')} className="text-xs sm:text-sm hover:bg-blue-500/10 hover:text-blue-600 transition-colors">
                  View All
                </Button>
              </motion.div>
            </div>
          {borrowedBooks.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {borrowedBooks.map((request) => (
                <div key={request._id} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted/50">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm sm:text-base">{request.bookTitle}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{request.bookAuthor}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs bg-green-500/10 text-green-700 border-green-500/20">Borrowed</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(request.requestedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No books currently borrowed</p>
          )}
          </Card>
        </motion.div>
      </div>

      {/* Enrolled Courses */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-4 sm:p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold">Enrolled Courses</h3>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="ghost" size="sm" onClick={() => onTabChange('courses')} className="text-xs sm:text-sm hover:bg-green-500/10 hover:text-green-600 transition-colors">
                View All
              </Button>
            </motion.div>
          </div>
        {enrolledCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {enrolledCourses.map((enrollment) => (
              <div key={enrollment._id} className="p-3 sm:p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">{enrollment.courseCode}</Badge>
                </div>
                <h4 className="mb-1 text-sm sm:text-base">{enrollment.courseName}</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">{enrollment.courseInstructor || 'N/A'}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No courses enrolled</p>
        )}
        </Card>
      </motion.div>
    </div>
  );
}
