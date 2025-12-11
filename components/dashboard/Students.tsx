import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { studentsApi, enrollmentsApi, hostelsApi, roomsApi } from '../../lib/apiClient';
import { Users, Plus, Edit, Trash2, Loader2, User, ArrowLeft, X, Mail, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../ui/dialog';
import { ConfirmationDialog } from '../ui/confirmation-dialog';
import { ExportButton } from '../ui/export-button';
import { exportStudents } from '../../lib/exportUtils';

interface StudentsProps {
    onTabChange?: (tab: string) => void;
}

export function Students({ onTabChange }: StudentsProps = {}) {
    const [students, setStudents] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [studentEnrollments, setStudentEnrollments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<any>(null);
    const [hostels, setHostels] = useState<any[]>([]);
    const [availableRooms, setAvailableRooms] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState<any>(null);
    const [formData, setFormData] = useState({
        studentId: '',
        name: '',
        email: '',
        phone: '',
        hostelBuilding: '',
        roomNumber: '',
        faculty: '',
        year: '',
        gender: '',
        password: ''
    });
    const [isNewStudent, setIsNewStudent] = useState(true); // Track if student is new or from registration

    const facultyCategories = [
        { id: 'science', name: 'Science' },
        { id: 'economics', name: 'Economics' },
        { id: 'business', name: 'Business' },
        { id: 'multimedia', name: 'Multimedia' },
        { id: 'literature', name: 'Literature' },
        { id: 'acting', name: 'Acting & Theatre' }
    ];

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const isAdmin = currentUser.role === 'admin';

    const handleBuildingChange = async (hostelId: string) => {
        setFormData({
            ...formData,
            hostelBuilding: hostelId,
            roomNumber: '' // Reset room when building changes
        });

        // Fetch rooms for the selected hostel
        if (hostelId) {
            try {
                const rooms = await roomsApi.getByHostelId(hostelId);
                // Filter out rooms that are at full capacity
                const availableRoomsList = rooms.filter((room: any) => {
                    const residents = room.residents || [];
                    return residents.length < room.capacity;
                });
                setAvailableRooms(availableRoomsList);
            } catch (error) {
                console.error('Failed to fetch rooms:', error);
                setAvailableRooms([]);
            }
        } else {
            setAvailableRooms([]);
        }
    };

    const generateStudentId = (fullName: string) => {
        const year = new Date().getFullYear();
        const month = new Date().getMonth(); // 0-11
        const monthLastLetters = ['y', 'y', 'h', 'l', 'y', 'e', 'y', 't', 'r', 'r', 'r', 'r'];
        const monthLastLetter = monthLastLetters[month];

        const nameParts = fullName.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts[nameParts.length - 1] || '';

        const firstInitial = firstName.charAt(0).toUpperCase();
        const lastTwoLetters = lastName.length >= 2
            ? lastName.slice(-2).toUpperCase()
            : (lastName + 'X').slice(0, 2).toUpperCase();

        // Count existing students to get next counter
        const counter = students.length;

        return `${year}${counter}${firstInitial}${lastTwoLetters}${monthLastLetter}`;
    };

    const handleNameChange = (name: string) => {
        setFormData({ ...formData, name });
        if (!editingStudent && name.trim()) {
            const generatedId = generateStudentId(name);
            setFormData(prev => ({ ...prev, name, studentId: generatedId }));
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

    useEffect(() => {
        fetchStudents();
        fetchHostels();
    }, []);

    // Check for new user to complete from registration request
    useEffect(() => {
        const newUserData = localStorage.getItem('newUserToComplete');
        if (newUserData) {
            try {
                const userData = JSON.parse(newUserData);
                // Pre-fill the form with the user data
                handleNameChange(userData.name || '');
                setFormData(prev => ({
                    ...prev,
                    email: userData.email || '',
                    name: userData.name || '',
                    password: '' // No password needed for registered users
                }));
                setIsNewStudent(false); // This is a registered user, hide password field
                // Open the dialog
                setIsDialogOpen(true);
                // Clear the localStorage
                localStorage.removeItem('newUserToComplete');
                toast.info('Complete the student profile from registration request');
            } catch (error) {
                console.error('Failed to parse new user data:', error);
                localStorage.removeItem('newUserToComplete');
            }
        }
    }, []);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const data = await studentsApi.getAll();
            setStudents(data);
        } catch (error: any) {
            toast.error('Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    const fetchHostels = async () => {
        try {
            const data = await hostelsApi.getAll();
            setHostels(data);
        } catch (error: any) {
            console.error('Failed to load hostels:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isSubmitting) return; // Prevent double submission

        setIsSubmitting(true);
        try {
            const studentData = {
                studentId: formData.studentId,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                hostelBuilding: formData.hostelBuilding,
                roomNumber: formData.roomNumber,
                faculty: formData.faculty,
                year: parseInt(formData.year),
                gender: formData.gender
            };

            if (editingStudent) {
                await studentsApi.update(editingStudent._id, studentData);
                toast.success('Student updated successfully!');
            } else {
                // Check for duplicates before creating
                const existingByEmail = students.find(s => s.email.toLowerCase() === formData.email.toLowerCase());
                const existingByStudentId = students.find(s => s.studentId === formData.studentId);
                const existingByPhone = students.find(s => s.phone === formData.phone && formData.phone);

                if (existingByEmail) {
                    toast.error(`A student with email "${formData.email}" already exists!`);
                    setIsSubmitting(false);
                    return;
                }

                if (existingByStudentId) {
                    toast.error(`A student with ID "${formData.studentId}" already exists!`);
                    setIsSubmitting(false);
                    return;
                }

                if (existingByPhone) {
                    toast.error(`A student with phone number "${formData.phone}" already exists!`);
                    setIsSubmitting(false);
                    return;
                }

                await studentsApi.create(studentData);

                // If this is a NEW student (not from registration), create user account with password
                if (isNewStudent && formData.password) {
                    try {
                        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';
                        const authToken = localStorage.getItem('authToken');
                        
                        // Create user account
                        const createUserResponse = await fetch(`${API_URL}/auth/create-student-account`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${authToken}`
                            },
                            body: JSON.stringify({
                                email: formData.email,
                                password: formData.password,
                                name: formData.name,
                                studentId: formData.studentId
                            })
                        });

                        if (!createUserResponse.ok) {
                            const errorData = await createUserResponse.json();
                            throw new Error(errorData.error || 'Failed to create user account');
                        }

                        toast.success('Student and user account created successfully!');
                    } catch (error: any) {
                        console.error('Failed to create user account:', error);
                        toast.warning(`Student created but user account failed: ${error.message}`);
                    }
                } else {
                    // Mark the new_user request as approved and approve the user account (for registered users)
                    try {
                        const { requestsApi } = await import('../../lib/apiClient');
                        const allRequests = await requestsApi.getAll();
                        const newUserRequest = allRequests.find((r: any) =>
                            r.type === 'new_user' &&
                            r.studentEmail === formData.email &&
                            r.status === 'pending'
                        );

                        if (newUserRequest) {
                            // Approve the request
                            await requestsApi.updateStatus(
                                newUserRequest._id,
                                'approved',
                                'Student profile completed successfully'
                            );

                            // Approve the user account
                            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';
                        const authToken = localStorage.getItem('authToken');
                        await fetch(`${API_URL}/auth/approve-user`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${authToken}`
                            },
                            body: JSON.stringify({ email: formData.email })
                        });

                            toast.success('Student created and registration approved!');
                            // Trigger notification update
                            window.dispatchEvent(new Event('requestsUpdated'));
                        } else {
                            toast.success('Student created successfully!');
                        }
                    } catch (error) {
                        console.error('Failed to update request status:', error);
                        toast.success('Student created successfully!');
                    }

                    // Clear the newUserToComplete from localStorage after successful creation
                    localStorage.removeItem('newUserToComplete');
                }
            }

            // If hostel and room are selected, add student as resident to the room
            if (formData.hostelBuilding && formData.roomNumber) {
                try {
                    // Check if student is already in another room
                    const allHostels = await hostelsApi.getAll();
                    let existingRoom = null;
                    let existingHostel = null;

                    for (const hostel of allHostels) {
                        const hostelRooms = await roomsApi.getByHostelId(hostel._id);
                        for (const room of hostelRooms) {
                            const isInThisRoom = room.residents?.some((r: any) => r.studentId === formData.studentId);
                            if (isInThisRoom) {
                                existingRoom = room;
                                existingHostel = hostel;
                                break;
                            }
                        }
                        if (existingRoom) break;
                    }

                    // If student is already in a different room, ask for confirmation
                    if (existingRoom && (existingRoom.roomNumber !== formData.roomNumber || existingHostel._id !== formData.hostelBuilding)) {
                        const confirmMove = confirm(
                            `⚠️ ${formData.name} is already assigned to Room ${existingRoom.roomNumber} in ${existingHostel.name}.\n\n` +
                            `Do you want to move them to Room ${formData.roomNumber}?`
                        );

                        if (!confirmMove) {
                            toast.info('Student created but room assignment was cancelled');
                            setIsDialogOpen(false);
                            resetForm();
                            fetchStudents();
                            return;
                        }

                        // Remove from old room
                        const oldResident = existingRoom.residents.find((r: any) => r.studentId === formData.studentId);
                        if (oldResident) {
                            await roomsApi.removeResident(existingRoom._id, oldResident._id);
                            toast.success(`Removed from Room ${existingRoom.roomNumber}`);
                        }
                    }

                    // Find the new room and add student
                    const rooms = await roomsApi.getByHostelId(formData.hostelBuilding);
                    const selectedRoom = rooms.find((r: any) => r.roomNumber === formData.roomNumber);

                    if (selectedRoom) {
                        // Check if room is full
                        const residents = selectedRoom.residents || [];
                        if (residents.length >= selectedRoom.capacity) {
                            toast.error(`Room ${formData.roomNumber} is at full capacity (${selectedRoom.capacity} students)`);
                            setIsDialogOpen(false);
                            resetForm();
                            fetchStudents();
                            return;
                        }

                        // Check if student is already in this room
                        const alreadyInRoom = residents.some((r: any) => r.studentId === formData.studentId);
                        if (!alreadyInRoom) {
                            // Add student as resident to the room
                            const residentData = {
                                name: formData.name,
                                studentId: formData.studentId,
                                email: formData.email,
                                phone: formData.phone
                            };

                            await roomsApi.addResident(selectedRoom._id, residentData);
                            toast.success('Student assigned to room successfully!');
                        }
                    }
                } catch (roomError: any) {
                    console.error('Failed to add student to room:', roomError);
                    toast.error(roomError.message || 'Failed to assign room');
                }
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

    const handleEdit = async (student: any) => {
        setEditingStudent(student);
        setIsNewStudent(false); // Editing existing student, no password needed
        setFormData({
            studentId: student.studentId,
            name: student.name,
            email: student.email,
            phone: student.phone || '',
            hostelBuilding: student.hostelBuilding || '',
            roomNumber: student.roomNumber || '',
            faculty: student.faculty || student.department || '',
            year: student.year?.toString() || '',
            gender: student.gender || '',
            password: ''
        });

        // Load rooms for the student's hostel if they have one
        if (student.hostelBuilding) {
            try {
                const rooms = await roomsApi.getByHostelId(student.hostelBuilding);
                const availableRoomsList = rooms.filter((room: any) => {
                    const residents = room.residents || [];
                    return residents.length < room.capacity;
                });
                setAvailableRooms(availableRoomsList);
            } catch (error) {
                console.error('Failed to fetch rooms:', error);
                setAvailableRooms([]);
            }
        }

        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        const student = students.find(s => s._id === id);
        if (!student) return;

        // Check where student data exists
        let dataLocations: string[] = [];

        try {
            // Check enrollments
            const enrollments = await enrollmentsApi.getByStudentId(student.studentId);
            if (enrollments.length > 0) {
                dataLocations.push(`${enrollments.length} enrolled course(s)`);
            }

            // Check hostel room
            if (student.hostelBuilding && student.roomNumber) {
                dataLocations.push(`Hostel room ${student.roomNumber}`);
            }
        } catch (error) {
            console.error('Error checking student data:', error);
        }

        // Set student to delete and open confirmation dialog
        setStudentToDelete({ ...student, dataLocations });
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!studentToDelete) return;

        setDeleteConfirmOpen(false);

        try {
            // 1. Remove student from their hostel room if assigned
            if (studentToDelete.hostelBuilding && studentToDelete.roomNumber) {
                try {
                    const rooms = await roomsApi.getByHostelId(studentToDelete.hostelBuilding);
                    const studentRoom = rooms.find((r: any) => r.roomNumber === studentToDelete.roomNumber);

                    if (studentRoom) {
                        const resident = studentRoom.residents?.find((r: any) => r.studentId === studentToDelete.studentId);
                        if (resident) {
                            await roomsApi.removeResident(studentRoom._id, resident._id);
                            console.log('Removed student from room');
                        }
                    }
                } catch (roomError) {
                    console.error('Failed to remove student from room:', roomError);
                }
            }

            // 2. Remove student from all enrolled courses
            try {
                const enrollments = await enrollmentsApi.getByStudentId(studentToDelete.studentId);
                for (const enrollment of enrollments) {
                    await enrollmentsApi.delete(enrollment._id);
                }
                console.log('Removed student from all courses');
            } catch (enrollmentError) {
                console.error('Failed to remove student from courses:', enrollmentError);
            }

            // 3. Delete the student record
            await studentsApi.delete(studentToDelete._id);

            toast.success('Student and all related data deleted successfully!');

            // If we're viewing this student, go back to list
            if (selectedStudent && selectedStudent._id === studentToDelete._id) {
                setSelectedStudent(null);
            }

            setStudentToDelete(null);
            fetchStudents();
        } catch (error: any) {
            toast.error(error.message || 'Delete failed');
        }
    };

    const resetForm = () => {
        setFormData({
            studentId: '',
            name: '',
            email: '',
            phone: '',
            hostelBuilding: '',
            roomNumber: '',
            faculty: '',
            year: '',
            gender: '',
            password: ''
        });
        setEditingStudent(null);
        setIsNewStudent(true); // Reset to new student mode
    };



    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Detail View
    if (selectedStudent) {
        return (
            <div className="space-y-6 w-full max-w-full">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" onClick={() => setSelectedStudent(null)}>
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
                                className="border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary dark:border-primary/50 dark:text-primary dark:hover:bg-primary dark:hover:text-primary-foreground transition-all"
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Student
                            </Button>
                            <Button 
                                variant="destructive" 
                                onClick={() => {
                                    setSelectedStudent(null);
                                    setTimeout(() => handleDelete(selectedStudent._id), 100);
                                }}
                                className="transition-all"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Student
                            </Button>
                        </div>
                    )}
                </div>

                <Card className="p-8">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-lg px-3 py-1">{selectedStudent.studentId}</Badge>
                                <Badge variant="secondary" className="text-lg px-3 py-1">{selectedStudent.department}</Badge>
                            </div>
                            <h1 className="mb-2">{selectedStudent.name}</h1>
                            <p className="text-muted-foreground">{selectedStudent.email}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setSelectedStudent(null)}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
                        <Card className="p-3 sm:p-4 bg-primary/5">
                            <p className="text-muted-foreground text-[10px] sm:text-xs md:text-sm mb-1">Student ID</p>
                            <p className="font-medium text-xs sm:text-sm md:text-base">{selectedStudent.studentId}</p>
                        </Card>
                        <Card className="p-3 sm:p-4 bg-blue-500/5">
                            <p className="text-muted-foreground text-[10px] sm:text-xs md:text-sm mb-1">Year</p>
                            <h3 className="text-lg sm:text-xl md:text-2xl">Year {selectedStudent.year}</h3>
                        </Card>
                        <Card className="p-3 sm:p-4 bg-green-500/5">
                            <p className="text-muted-foreground text-[10px] sm:text-xs md:text-sm mb-1">Hostel</p>
                            <p className="font-medium text-xs sm:text-sm md:text-base">
                                {selectedStudent.hostelBuilding
                                    ? hostels.find(h => h._id === selectedStudent.hostelBuilding)?.name || 'N/A'
                                    : 'N/A'}
                            </p>
                        </Card>
                        <Card className="p-3 sm:p-4 bg-purple-500/5">
                            <p className="text-muted-foreground text-[10px] sm:text-xs md:text-sm mb-1">Room</p>
                            <p className="font-medium text-xs sm:text-sm md:text-base">{selectedStudent.roomNumber || 'N/A'}</p>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h3 className="mb-4">Contact Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="p-4">
                                    <div className="flex items-start gap-3">
                                        <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Email</p>
                                            <p className="font-medium">{selectedStudent.email}</p>
                                        </div>
                                    </div>
                                </Card>
                                <Card className="p-4">
                                    <div className="flex items-start gap-3">
                                        <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Phone</p>
                                            <p className="font-medium">{selectedStudent.phone || 'N/A'}</p>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>

                        <div>
                            <h3 className="mb-4">Enrolled Courses ({studentEnrollments.length})</h3>
                            {studentEnrollments.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {studentEnrollments.map((enrollment: any) => (
                                        <Card key={enrollment._id} className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Badge variant="outline">{enrollment.courseCode}</Badge>
                                                    </div>
                                                    <p className="font-medium">{enrollment.courseName}</p>
                                                    <p className="text-sm text-muted-foreground">{enrollment.instructor}</p>
                                                </div>
                                                <BookOpen className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <Card className="p-8 text-center">
                                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">No courses enrolled yet</p>
                                </Card>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    // List View
    return (
        <div className="space-y-3 sm:space-y-4 md:space-y-6 w-full max-w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl">Students</h1>
                    <p className="text-muted-foreground mt-1 sm:mt-2 text-xs sm:text-sm md:text-base">View and manage student records</p>
                </div>
                <div className="flex items-center gap-2">
                    {onTabChange && (
                        <Button variant="outline" onClick={() => onTabChange('dashboard')} className="flex-shrink-0">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Back</span>
                        </Button>
                    )}
                    {isAdmin && (
                        <ExportButton
                            onExport={() => exportStudents(hostels)}
                            label="Export"
                            className="flex-shrink-0"
                        />
                    )}
                    {isAdmin && (
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={resetForm} className="flex-shrink-0">
                                    <Plus className="h-4 w-4 mr-2" />
                                    <span className="hidden sm:inline">Add Student</span>
                                </Button>
                            </DialogTrigger>
                                <DialogContent className="!w-[90%] sm:!w-[600px] !max-w-[650px] max-h-[90vh] overflow-hidden p-0 !rounded-2xl">
                                    <div className="p-6 border-b">
                                        <DialogHeader className="text-left">
                                            <DialogTitle className="text-xl font-semibold">{editingStudent ? 'Edit Student' : 'Add New Student'}</DialogTitle>
                                            <DialogDescription className="text-sm mt-1">
                                                {editingStudent ? 'Update student information' : 'Create a new student record'}
                                            </DialogDescription>
                                        </DialogHeader>
                                    </div>

                                    <form onSubmit={handleSubmit} className="flex flex-col h-full">
                                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label htmlFor="studentId" className="text-sm font-medium mb-2 block">Student ID</Label>
                                                    <Input
                                                        id="studentId"
                                                        value={formData.studentId}
                                                        onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                                                        placeholder="Auto-generated"
                                                        className="h-11 rounded-lg bg-muted"
                                                        required
                                                        disabled
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="name" className="text-sm font-medium mb-2 block">Full Name</Label>
                                                    <Input
                                                        id="name"
                                                        value={formData.name}
                                                        onChange={(e) => handleNameChange(e.target.value)}
                                                        placeholder="e.g., John Doe"
                                                        className="h-11 rounded-lg"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label htmlFor="email" className="text-sm font-medium mb-2 block">Email</Label>
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        value={formData.email}
                                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                        placeholder="e.g., john@example.com"
                                                        className="h-11 rounded-lg"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="phone" className="text-sm font-medium mb-2 block">Phone</Label>
                                                    <Input
                                                        id="phone"
                                                        value={formData.phone}
                                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                        placeholder="e.g., +1234567890"
                                                        className="h-11 rounded-lg"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label htmlFor="faculty" className="text-sm font-medium mb-2 block">Faculty</Label>
                                                    <select
                                                        id="faculty"
                                                        value={formData.faculty}
                                                        onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                                                        className="flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                                                        required
                                                    >
                                                        <option value="">Select faculty...</option>
                                                        {facultyCategories.map((faculty) => (
                                                            <option key={faculty.id} value={faculty.id}>
                                                                {faculty.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <Label htmlFor="year" className="text-sm font-medium mb-2 block">Year</Label>
                                                    <Input
                                                        id="year"
                                                        type="number"
                                                        value={formData.year}
                                                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                                        placeholder="e.g., 1"
                                                        className="h-11 rounded-lg"
                                                        min="1"
                                                        max="4"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label htmlFor="gender" className="text-sm font-medium mb-2 block">Gender</Label>
                                                    <select
                                                        id="gender"
                                                        value={formData.gender}
                                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                                        className="flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                                                        required
                                                    >
                                                        <option value="">Select gender...</option>
                                                        <option value="male">Male</option>
                                                        <option value="female">Female</option>
                                                        <option value="other">Other</option>
                                                    </select>
                                                </div>
                                            </div>
                                            {/* Password field - only show for NEW students (not from registration) */}
                                            {!editingStudent && isNewStudent && (
                                                <div>
                                                    <Label htmlFor="password" className="text-sm font-medium mb-2 block">
                                                        Password <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Input
                                                        id="password"
                                                        type="password"
                                                        value={formData.password}
                                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                        placeholder="Enter password for student account"
                                                        className="h-11 rounded-lg"
                                                        required={isNewStudent}
                                                    />
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        This password will be used for the student to login
                                                    </p>
                                                </div>
                                            )}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label htmlFor="hostelBuilding" className="text-sm font-medium mb-2 block">Hostel Building</Label>
                                                    <select
                                                        id="hostelBuilding"
                                                        value={formData.hostelBuilding}
                                                        onChange={(e) => handleBuildingChange(e.target.value)}
                                                        className="flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                                                    >
                                                        <option value="">Select building...</option>
                                                        {hostels.map((hostel) => (
                                                            <option key={hostel._id} value={hostel._id}>
                                                                {hostel.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <Label htmlFor="roomNumber" className="text-sm font-medium mb-2 block">Room Number</Label>
                                                    <select
                                                        id="roomNumber"
                                                        value={formData.roomNumber}
                                                        onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                                                        className="flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                                                        disabled={!formData.hostelBuilding}
                                                    >
                                                        <option value="">
                                                            {formData.hostelBuilding ? 'Select room...' : 'Select building first'}
                                                        </option>
                                                        {availableRooms.map((room) => (
                                                            <option key={room._id} value={room.roomNumber}>
                                                                Room {room.roomNumber} (Floor {room.floor}) - {room.capacity - (room.residents?.length || 0)} spots available
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {formData.hostelBuilding && availableRooms.length === 0 && (
                                                        <p className="text-xs text-amber-600 mt-2">
                                                            ⚠️ No available rooms in this building
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 border-t bg-muted/30 flex gap-3 justify-end">
                                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="px-6">
                                                Cancel
                                            </Button>
                                            <Button type="submit" className="px-6" disabled={isSubmitting}>
                                                {isSubmitting ? 'Saving...' : (editingStudent ? 'Update' : 'Create')}
                                            </Button>
                                        </div>
                                    </form>
                                </DialogContent>
                        </Dialog>
                    )}
                </div>
            </div>

            {/* Students Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6 xl:gap-8 w-full">
                {students.map((student) => {
                    return (
                        <Card
                            key={student._id}
                            className="p-4 sm:p-5 md:p-6 cursor-pointer hover:shadow-lg transition-all group relative"
                            onClick={() => handleViewStudent(student)}
                        >
                            <div className="flex items-start justify-between mb-3 sm:mb-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <Badge variant="outline" className="text-xs">{student.studentId}</Badge>
                                        <Badge variant="secondary" className="text-xs">{student.department}</Badge>
                                    </div>
                                    <h3 className="mb-1 text-sm sm:text-base font-semibold">{student.name}</h3>
                                    <p className="text-muted-foreground text-xs sm:text-sm truncate">{student.email}</p>
                                </div>
                                {isAdmin && (
                                    <div className="flex flex-col gap-1.5 ml-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 px-2 text-xs transition-all border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary dark:border-primary/50 dark:text-primary dark:hover:bg-primary dark:hover:text-primary-foreground"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEdit(student);
                                            }}
                                        >
                                            <Edit className="h-3 w-3 mr-1" />
                                            <span>Edit</span>
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 px-2 text-xs transition-all border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground hover:border-destructive dark:border-destructive/50 dark:text-destructive dark:hover:bg-destructive dark:hover:text-destructive-foreground"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(student._id);
                                            }}
                                        >
                                            <Trash2 className="h-3 w-3 mr-1" />
                                            <span>Delete</span>
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2 sm:space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground text-xs sm:text-sm">Year</span>
                                    <span className="font-medium text-xs sm:text-sm">Year {student.year}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground text-xs sm:text-sm">Hostel</span>
                                    <span className="font-medium text-xs sm:text-sm truncate">
                                        {student.hostelBuilding
                                            ? hostels.find(h => h._id === student.hostelBuilding)?.name || 'N/A'
                                            : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground text-xs sm:text-sm">Room</span>
                                    <span className="font-medium text-xs sm:text-sm">{student.roomNumber || 'N/A'}</span>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {students.length === 0 && (
                <Card className="p-12 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="mb-2">No Students Found</h3>
                    <p className="text-muted-foreground mb-4">
                        {isAdmin ? 'Get started by adding your first student.' : 'No students available at the moment.'}
                    </p>
                </Card>
            )}

            {/* Delete Confirmation Dialog */}
            <ConfirmationDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                title={`Delete ${studentToDelete?.name || 'Student'}`}
                description={`${studentToDelete?.name} (${studentToDelete?.studentId})`}
                warningItems={studentToDelete?.dataLocations || []}
                confirmText="This action cannot be undone. All student data will be permanently deleted."
                requireTextMatch={studentToDelete?.name || ''}
                onConfirm={confirmDelete}
                onCancel={() => {
                    setDeleteConfirmOpen(false);
                    setStudentToDelete(null);
                }}
            />
        </div>
    );
}
