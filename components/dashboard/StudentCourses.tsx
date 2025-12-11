import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { coursesApi, enrollmentsApi, requestsApi } from '../../lib/apiClient';
import { GraduationCap, Loader2, Clock, CheckCircle, XCircle, AlertCircle, ArrowLeft, BookOpen, User, Calendar, Award, Users } from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';

interface StudentCoursesProps {
    onTabChange?: (tab: string) => void;
}

export function StudentCourses({ onTabChange }: StudentCoursesProps = {}) {
    const [courses, setCourses] = useState<any[]>([]);
    const [myEnrollments, setMyEnrollments] = useState<any[]>([]);
    const [myRequests, setMyRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [submittingRequest, setSubmittingRequest] = useState<string | null>(null);
    const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
    const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const studentEmail = currentUser.email;

    const facultyCategories = [
        { id: 'science', name: 'Science', color: 'bg-blue-500' },
        { id: 'economics', name: 'Economics', color: 'bg-green-500' },
        { id: 'business', name: 'Business', color: 'bg-purple-500' },
        { id: 'multimedia', name: 'Multimedia', color: 'bg-orange-500' },
        { id: 'literature', name: 'Literature', color: 'bg-pink-500' },
        { id: 'acting', name: 'Acting & Theatre', color: 'bg-red-500' }
    ];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch courses (public)
            const coursesData = await coursesApi.getAll();
            setCourses(coursesData);

            // Fetch enrollments and requests (requires auth) - handle gracefully if fails
            try {
                const enrollmentsData = await enrollmentsApi.getByStudentId(studentEmail);
                setMyEnrollments(enrollmentsData || []);
            } catch (enrollError) {
                console.warn('Could not load enrollments:', enrollError);
                setMyEnrollments([]);
            }

            try {
                const requestsData = await requestsApi.getByStudentId(studentEmail);
                setMyRequests((requestsData || []).filter(r => r.type === 'enroll' || r.type === 'unenroll'));
            } catch (requestError) {
                console.warn('Could not load requests:', requestError);
                setMyRequests([]);
            }
        } catch (error: any) {
            toast.error('Failed to load courses data');
            console.error('Error loading courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEnrollRequest = async (course: any) => {
        if (submittingRequest === course.code) return; // Prevent duplicate submissions

        // Check if student already has a pending enrollment request for this course
        const hasPendingRequest = myRequests.some(
            req => req.courseCode === course.code && req.type === 'enroll' && req.status === 'pending'
        );

        if (hasPendingRequest) {
            toast.error('You already have a pending enrollment request for this course');
            return;
        }

        // Check if student is currently enrolled (approved enroll with no unenroll)
        const enrolledCourse = myEnrollments.find(enr => enr.courseCode === course.code);
        if (enrolledCourse) {
            // Check if there's an approved unenroll for this enrollment
            const hasUnenrolled = myRequests.some(
                req => req.enrollmentId === enrolledCourse._id &&
                    req.type === 'unenroll' &&
                    req.status === 'approved'
            );

            if (!hasUnenrolled) {
                toast.error('You are already enrolled in this course');
                return;
            }
        }

        // Check if course is full
        if (course.enrolled >= course.capacity) {
            toast.error('This course is full');
            return;
        }

        setSubmittingRequest(course.code);
        try {
            await requestsApi.create({
                type: 'enroll',
                studentId: studentEmail,
                studentName: currentUser.name,
                studentEmail: studentEmail,
                courseCode: course.code,
                courseName: course.name,
                courseInstructor: course.instructor,
                courseSemester: course.semester,
                requestedAt: new Date().toISOString()
            });

            toast.success('Enrollment request submitted! Waiting for admin approval.');
            fetchData();

            // Trigger notification update for admins
            window.dispatchEvent(new Event('requestsUpdated'));
        } catch (error: any) {
            toast.error(error.message || 'Failed to submit request');
        } finally {
            setSubmittingRequest(null);
        }
    };

    const handleUnenrollRequest = async (enrollment: any) => {
        if (submittingRequest === enrollment._id) return;

        setSubmittingRequest(enrollment._id);
        try {
            await requestsApi.create({
                type: 'unenroll',
                studentId: studentEmail,
                studentName: currentUser.name,
                studentEmail: studentEmail,
                courseCode: enrollment.courseCode,
                courseName: enrollment.courseName,
                enrollmentId: enrollment._id,
                requestedAt: new Date().toISOString()
            });

            toast.success('Unenroll request submitted! Waiting for admin approval.');
            fetchData();

            // Trigger notification update for admins
            window.dispatchEvent(new Event('requestsUpdated'));
        } catch (error: any) {
            toast.error(error.message || 'Failed to submit request');
        } finally {
            setSubmittingRequest(null);
        }
    };

    const getRequestStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                    <Clock className="h-3 w-3 mr-1" />
                    Pending
                </Badge>;
            case 'approved':
                return <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Approved
                </Badge>;
            case 'rejected':
                return <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-500/20">
                    <XCircle className="h-3 w-3 mr-1" />
                    Rejected
                </Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getCategoryColor = (categoryId: string) => {
        const category = facultyCategories.find(c => c.id === categoryId);
        return category?.color || 'bg-gray-500';
    };

    const getCategoryName = (categoryId: string) => {
        const category = facultyCategories.find(c => c.id === categoryId);
        return category?.name || categoryId;
    };

    const filteredCourses = selectedCategory === 'all'
        ? courses
        : courses.filter(course => course.category === selectedCategory);

    const pendingRequests = myRequests.filter(r => r.status === 'pending');
    const approvedEnrollments = myEnrollments.length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 w-full max-w-full">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl">Faculties & Courses</h1>
                    <p className="text-muted-foreground mt-1 text-sm sm:text-base">Browse and enroll in courses</p>
                </div>
                {onTabChange && (
                    <Button variant="outline" onClick={() => onTabChange('dashboard')} className="flex-shrink-0">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Back</span>
                    </Button>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <Card className="p-4">
                    <p className="text-muted-foreground text-xs sm:text-sm">Available Courses</p>
                    <h2 className="mt-1 text-xl sm:text-2xl">{courses.length}</h2>
                </Card>
                <Card className="p-4">
                    <p className="text-muted-foreground text-xs sm:text-sm">My Enrollments</p>
                    <h2 className="mt-1 text-xl sm:text-2xl text-green-600">{approvedEnrollments}</h2>
                </Card>
                <Card className="p-4">
                    <p className="text-muted-foreground text-xs sm:text-sm">Pending Requests</p>
                    <h2 className="mt-1 text-xl sm:text-2xl text-yellow-600">{pendingRequests.length}</h2>
                </Card>
                <Card className="p-4">
                    <p className="text-muted-foreground text-xs sm:text-sm">Total Requests</p>
                    <h2 className="mt-1 text-xl sm:text-2xl">{myRequests.length}</h2>
                </Card>
            </div>

            {/* Pending Requests Alert */}
            {pendingRequests.length > 0 && (
                <Card className="p-4 bg-yellow-500/10 border-yellow-500/20">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                        <div>
                            <h4 className="text-yellow-700 font-medium">You have {pendingRequests.length} pending enrollment request(s)</h4>
                            <p className="text-muted-foreground text-sm mt-1">Waiting for admin approval</p>
                        </div>
                    </div>
                </Card>
            )}

            {/* My Enrolled Courses */}
            {myEnrollments.length > 0 && (
                <Card className="p-4 sm:p-6">
                    <h3 className="text-lg font-semibold mb-4">My Enrolled Courses</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {myEnrollments.map((enrollment) => {
                            const course = courses.find(c => c.code === enrollment.courseCode);
                            const hasPendingUnenroll = myRequests.some(
                                req => req.enrollmentId === enrollment._id && req.type === 'unenroll' && req.status === 'pending'
                            );
                            return (
                                <Card key={enrollment._id} className="p-3 bg-green-500/5 border-green-500/20">
                                    <div className="flex items-start gap-2 mb-2">
                                        <div className="h-8 w-8 rounded bg-green-500/10 flex items-center justify-center shrink-0">
                                            <GraduationCap className="h-4 w-4 text-green-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1 mb-1 flex-wrap">
                                                <Badge variant="outline" className="text-xs">{enrollment.courseCode}</Badge>
                                                {course?.category && (
                                                    <Badge className={`${getCategoryColor(course.category)} text-white text-xs`}>
                                                        {getCategoryName(course.category)}
                                                    </Badge>
                                                )}
                                            </div>
                                            <h4 className="font-medium text-sm truncate">{enrollment.courseName}</h4>
                                            {course && (
                                                <>
                                                    <p className="text-xs text-muted-foreground truncate">{course.instructor}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{course.semester}</p>
                                                    <div className="mt-1 flex items-center gap-1 flex-wrap">
                                                        <Badge variant="secondary" className="text-xs">{course.credits}cr</Badge>
                                                        {course.courseType && (
                                                            <Badge variant={course.courseType === 'major' ? 'default' : 'outline'} className="text-xs">
                                                                {course.courseType === 'major' ? 'Major' : 'Minor'}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                            <p className="text-xs text-muted-foreground mt-2">
                                                {new Date(enrollment.enrolledAt).toLocaleDateString()}
                                            </p>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="mt-2 w-full h-7 text-xs"
                                                onClick={() => handleUnenrollRequest(enrollment)}
                                                disabled={hasPendingUnenroll || submittingRequest === enrollment._id}
                                            >
                                                {submittingRequest === enrollment._id ? 'Submitting...' :
                                                    hasPendingUnenroll ? 'Unenroll Pending' : 'Request Unenroll'}
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </Card>
            )}

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredCourses.map((course) => {
                    const hasPendingRequest = myRequests.some(
                        req => req.courseCode === course.code && req.status === 'pending'
                    );
                    const isEnrolled = myEnrollments.some(enr => enr.courseCode === course.code);
                    const isFull = course.enrolled >= course.capacity;
                    const available = course.capacity - course.enrolled;
                    const enrollmentRate = Math.round((course.enrolled / course.capacity) * 100);

                    return (
                        <Card
                            key={course._id}
                            className="p-3 hover:shadow-md transition-shadow cursor-pointer bg-card"
                            onClick={() => {
                                setSelectedCourse(course);
                                setIsCourseDialogOpen(true);
                            }}
                        >
                            <div className="flex items-start gap-2 mb-2">
                                <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                                    <GraduationCap className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1 mb-1 flex-wrap">
                                        <Badge variant="outline" className="text-xs">{course.code}</Badge>
                                        <Badge variant="secondary" className="text-xs">{course.credits}cr</Badge>
                                        {course.category && (
                                            <Badge className={`${getCategoryColor(course.category)} text-white text-xs`}>
                                                {getCategoryName(course.category)}
                                            </Badge>
                                        )}
                                    </div>
                                    <h4 className="text-sm font-semibold mb-1 truncate">{course.name}</h4>
                                    <p className="text-xs text-muted-foreground truncate">{course.instructor}</p>
                                    <p className="text-xs text-muted-foreground truncate">{course.semester}</p>

                                    <div className="space-y-1 mt-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">Enrolled</span>
                                            <span className="font-medium">{course.enrolled}/{course.capacity}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">Available</span>
                                            <Badge variant={available > 0 ? "outline" : "destructive"} className="text-xs">
                                                {available}
                                            </Badge>
                                        </div>
                                        <div className="pt-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-muted-foreground text-xs">Enrollment</span>
                                                <span className="text-xs font-medium">{enrollmentRate}%</span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-1.5">
                                                <div
                                                    className="bg-primary rounded-full h-1.5 transition-all"
                                                    style={{ width: `${enrollmentRate}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        className="w-full mt-2 h-7 text-xs"
                                        size="sm"
                                        disabled={isEnrolled || hasPendingRequest || isFull || submittingRequest === course.code}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEnrollRequest(course);
                                        }}
                                    >
                                        {submittingRequest === course.code ? 'Submitting...' :
                                            isEnrolled ? 'Enrolled' :
                                                hasPendingRequest ? 'Pending' :
                                                    isFull ? 'Full' :
                                                        'Request to Enroll'}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {filteredCourses.length === 0 && (
                <Card className="p-12 text-center">
                    <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No courses found in this faculty</p>
                </Card>
            )}

            {/* Course Details Dialog */}
            <Dialog open={isCourseDialogOpen} onOpenChange={setIsCourseDialogOpen}>
                <DialogContent className="!w-[95%] sm:!w-[600px] !max-w-[650px] max-h-[90vh] overflow-y-auto">
                    {selectedCourse && (() => {
                        const hasPendingRequest = myRequests.some(
                            req => req.courseCode === selectedCourse.code && req.status === 'pending'
                        );
                        const isEnrolled = myEnrollments.some(enr => enr.courseCode === selectedCourse.code);
                        const isFull = selectedCourse.enrolled >= selectedCourse.capacity;
                        const available = selectedCourse.capacity - selectedCourse.enrolled;
                        const enrollmentRate = Math.round((selectedCourse.enrolled / selectedCourse.capacity) * 100);

                        return (
                            <>
                                <DialogHeader>
                                    <div className="flex items-start gap-3">
                                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                            <BookOpen className="h-6 w-6 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <DialogTitle className="text-xl font-bold mb-2">{selectedCourse.name}</DialogTitle>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Badge variant="outline">{selectedCourse.code}</Badge>
                                                <Badge variant="secondary">{selectedCourse.credits} Credits</Badge>
                                                {selectedCourse.category && (
                                                    <Badge className={`${getCategoryColor(selectedCourse.category)} text-white`}>
                                                        {getCategoryName(selectedCourse.category)}
                                                    </Badge>
                                                )}
                                                {selectedCourse.courseType && (
                                                    <Badge variant={selectedCourse.courseType === 'major' ? 'default' : 'outline'}>
                                                        {selectedCourse.courseType === 'major' ? 'Major' : 'Minor'}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </DialogHeader>

                                <div className="space-y-4 py-4">
                                    {/* Course Info */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="flex items-start gap-3">
                                            <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium">Instructor</p>
                                                <p className="text-sm text-muted-foreground">{selectedCourse.instructor}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium">Semester</p>
                                                <p className="text-sm text-muted-foreground">{selectedCourse.semester}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Award className="h-5 w-5 text-muted-foreground mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium">Credits</p>
                                                <p className="text-sm text-muted-foreground">{selectedCourse.credits} Credits</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium">Capacity</p>
                                                <p className="text-sm text-muted-foreground">{selectedCourse.enrolled} / {selectedCourse.capacity} students</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    {selectedCourse.description && (
                                        <div>
                                            <h4 className="text-sm font-semibold mb-2">Course Description</h4>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {selectedCourse.description}
                                            </p>
                                        </div>
                                    )}

                                    {/* Enrollment Progress */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-sm font-semibold">Enrollment Status</h4>
                                            <span className="text-sm font-medium">{enrollmentRate}%</span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2.5">
                                            <div
                                                className={`rounded-full h-2.5 transition-all ${enrollmentRate >= 90 ? 'bg-red-500' :
                                                    enrollmentRate >= 70 ? 'bg-yellow-500' :
                                                        'bg-green-500'
                                                    }`}
                                                style={{ width: `${enrollmentRate}%` }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                                            <span>{selectedCourse.enrolled} enrolled</span>
                                            <span>{available} spots available</span>
                                        </div>
                                    </div>

                                    {/* Status Messages */}
                                    {isEnrolled && (
                                        <Card className="p-3 bg-green-500/10 border-green-500/20">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                                <p className="text-sm text-green-700 font-medium">You are enrolled in this course</p>
                                            </div>
                                        </Card>
                                    )}

                                    {hasPendingRequest && !isEnrolled && (
                                        <Card className="p-3 bg-yellow-500/10 border-yellow-500/20">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-yellow-600" />
                                                <p className="text-sm text-yellow-700 font-medium">Your enrollment request is pending approval</p>
                                            </div>
                                        </Card>
                                    )}

                                    {isFull && !isEnrolled && !hasPendingRequest && (
                                        <Card className="p-3 bg-red-500/10 border-red-500/20">
                                            <div className="flex items-center gap-2">
                                                <XCircle className="h-4 w-4 text-red-600" />
                                                <p className="text-sm text-red-700 font-medium">This course is currently full</p>
                                            </div>
                                        </Card>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 justify-end pt-4 border-t">
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsCourseDialogOpen(false)}
                                    >
                                        Close
                                    </Button>
                                    {!isEnrolled && !hasPendingRequest && !isFull && (
                                        <Button
                                            onClick={() => {
                                                handleEnrollRequest(selectedCourse);
                                                setIsCourseDialogOpen(false);
                                            }}
                                            disabled={submittingRequest === selectedCourse.code}
                                        >
                                            {submittingRequest === selectedCourse.code ? 'Submitting...' : 'Request to Enroll'}
                                        </Button>
                                    )}
                                </div>
                            </>
                        );
                    })()}
                </DialogContent>
            </Dialog>

            {/* My Enrollment Requests History */}
            <Card className="p-4 sm:p-6">
                <h3 className="text-lg font-semibold mb-4">My Enrollment Request History</h3>
                {myRequests.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {myRequests.map((request) => (
                            <Card key={request._id} className="p-3">
                                <div className="flex items-start gap-2">
                                    <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                                        <GraduationCap className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1 mb-1 flex-wrap">
                                            <Badge variant="outline" className="text-xs capitalize">{request.type}</Badge>
                                            <Badge variant="outline" className="text-xs">{request.courseCode}</Badge>
                                            {getRequestStatusBadge(request.status)}
                                        </div>
                                        <p className="font-medium text-sm truncate">{request.courseName}</p>
                                        <p className="text-xs text-muted-foreground truncate">{request.courseInstructor}</p>
                                        <p className="text-xs text-muted-foreground truncate">{request.courseSemester}</p>
                                        <div className="mt-2 space-y-1">
                                            <p className="text-xs text-muted-foreground">
                                                <span className="font-medium">Requested:</span> {new Date(request.requestedAt || request.createdAt).toLocaleDateString()}
                                            </p>
                                            {request.processedAt && (
                                                <p className="text-xs text-muted-foreground">
                                                    <span className="font-medium">Processed:</span> {new Date(request.processedAt).toLocaleDateString()}
                                                </p>
                                            )}
                                            {request.adminNote && (
                                                <p className="text-xs text-muted-foreground italic">
                                                    <span className="font-medium">Note:</span> {request.adminNote}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center py-8">No enrollment requests yet</p>
                )}
            </Card>
        </div>
    );
}
