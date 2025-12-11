// Mock data for the student hub application

export interface Student {
    id: string;
    name: string;
    studentId: string;
    email: string;
    department: string;
    year: number;
    hostelRoom: string;
    profilePhoto: string;
    role: 'student' | 'admin';
}

export interface HostelRoom {
    id: string;
    roomNumber: string;
    block: string;
    floor: number;
    capacity: number;
    students: string[];
    rent: number;
    facilities: string[];
    status?: 'available' | 'occupied' | 'maintenance';
    occupied?: number;
}

export interface Book {
    id: string;
    title: string;
    author: string;
    isbn: string;
    category: string;
    available: boolean;
    coverImage: string;
    availableCopies?: number;
    totalCopies?: number;
}

export interface BorrowedBook {
    id: string;
    bookId: string;
    bookTitle: string;
    borrowDate: string;
    dueDate: string;
    returnDate?: string;
    status: 'borrowed' | 'returned' | 'overdue';
}

export interface Course {
    id: string;
    code: string;
    name: string;
    instructor: string;
    credits: number;
    schedule: string;
    room: string;
    grade?: string;
}

export interface Announcement {
    id: string;
    title: string;
    content: string;
    date: string;
    author: string;
    priority: 'low' | 'medium' | 'high';
    category: string;
    type?: string;
}

// Current logged-in student
export const currentStudent: Student = {
    id: '1',
    name: 'John Doe',
    studentId: 'STU2024001',
    email: 'john.doe@university.edu',
    department: 'Computer Science',
    year: 3,
    hostelRoom: 'A-301',
    profilePhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    role: 'admin'
};

// All students
export const students: Student[] = [
    currentStudent,
    {
        id: '2',
        name: 'Jane Smith',
        studentId: 'STU2024002',
        email: 'jane.smith@university.edu',
        department: 'Computer Science',
        year: 3,
        hostelRoom: 'A-301',
        profilePhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
        role: 'student'
    },
    {
        id: '3',
        name: 'Mike Johnson',
        studentId: 'STU2024003',
        email: 'mike.johnson@university.edu',
        department: 'Electrical Engineering',
        year: 2,
        hostelRoom: 'A-302',
        profilePhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
        role: 'student'
    }
];

// Hostel rooms
export const hostelRooms: HostelRoom[] = [
    {
        id: '1',
        roomNumber: 'A-301',
        block: 'A',
        floor: 3,
        capacity: 2,
        students: ['John Doe', 'Jane Smith'],
        rent: 5000,
        facilities: ['WiFi', 'AC', 'Attached Bathroom'],
        status: 'occupied',
        occupied: 2
    },
    {
        id: '2',
        roomNumber: 'A-302',
        block: 'A',
        floor: 3,
        capacity: 2,
        students: ['Mike Johnson'],
        rent: 5000,
        facilities: ['WiFi', 'AC', 'Attached Bathroom'],
        status: 'occupied',
        occupied: 1
    },
    {
        id: '3',
        roomNumber: 'B-201',
        block: 'B',
        floor: 2,
        capacity: 3,
        students: ['Sarah Williams', 'Tom Brown', 'Emily Davis'],
        rent: 4500,
        facilities: ['WiFi', 'Fan', 'Common Bathroom'],
        status: 'occupied',
        occupied: 3
    },
    {
        id: '4',
        roomNumber: 'A-401',
        block: 'A',
        floor: 4,
        capacity: 2,
        students: [],
        rent: 5000,
        facilities: ['WiFi', 'AC', 'Attached Bathroom'],
        status: 'available',
        occupied: 0
    },
    {
        id: '5',
        roomNumber: 'B-101',
        block: 'B',
        floor: 1,
        capacity: 2,
        students: [],
        rent: 4500,
        facilities: ['WiFi', 'Fan', 'Common Bathroom'],
        status: 'maintenance',
        occupied: 0
    }
];

// Library books
export const books: Book[] = [
    {
        id: '1',
        title: 'Introduction to Algorithms',
        author: 'Thomas H. Cormen',
        isbn: '978-0262033848',
        category: 'Computer Science',
        available: true,
        coverImage: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400',
        availableCopies: 3,
        totalCopies: 5
    },
    {
        id: '2',
        title: 'Clean Code',
        author: 'Robert C. Martin',
        isbn: '978-0132350884',
        category: 'Software Engineering',
        available: false,
        coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
        availableCopies: 0,
        totalCopies: 3
    },
    {
        id: '3',
        title: 'Design Patterns',
        author: 'Gang of Four',
        isbn: '978-0201633610',
        category: 'Software Engineering',
        available: true,
        coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400',
        availableCopies: 2,
        totalCopies: 4
    }
];

// Borrowed books
export const borrowedBooks: BorrowedBook[] = [
    {
        id: '1',
        bookId: '2',
        bookTitle: 'Clean Code',
        borrowDate: '2024-01-15',
        dueDate: '2024-02-15',
        status: 'borrowed'
    },
    {
        id: '2',
        bookId: '4',
        bookTitle: 'The Pragmatic Programmer',
        borrowDate: '2024-01-10',
        dueDate: '2024-01-25',
        status: 'overdue'
    },
    {
        id: '3',
        bookId: '1',
        bookTitle: 'Introduction to Algorithms',
        borrowDate: '2023-12-01',
        dueDate: '2024-01-01',
        returnDate: '2023-12-28',
        status: 'returned'
    }
];

// Courses
export const courses: Course[] = [
    {
        id: '1',
        code: 'CS301',
        name: 'Data Structures and Algorithms',
        instructor: 'Dr. Smith',
        credits: 4,
        schedule: 'Mon, Wed, Fri 10:00 AM',
        room: 'Room 201',
        grade: 'A'
    },
    {
        id: '2',
        code: 'CS302',
        name: 'Database Management Systems',
        instructor: 'Prof. Johnson',
        credits: 3,
        schedule: 'Tue, Thu 2:00 PM',
        room: 'Room 305'
    },
    {
        id: '3',
        code: 'CS303',
        name: 'Operating Systems',
        instructor: 'Dr. Williams',
        credits: 4,
        schedule: 'Mon, Wed 3:00 PM',
        room: 'Room 102'
    }
];

// Announcements
export const announcements: Announcement[] = [
    {
        id: '1',
        title: 'Mid-term Exam Schedule Released',
        content: 'The mid-term examination schedule for all courses has been released. Please check the academic portal for details.',
        date: '2024-02-01',
        author: 'Academic Office',
        priority: 'high',
        category: 'Academic',
        type: 'academic'
    },
    {
        id: '2',
        title: 'Library Maintenance',
        content: 'The library will be closed for maintenance on Saturday, February 10th. All borrowed books due on this date will have an automatic extension.',
        date: '2024-02-05',
        author: 'Library Administration',
        priority: 'medium',
        category: 'Library',
        type: 'general'
    },
    {
        id: '3',
        title: 'Hostel Fee Payment Reminder',
        content: 'This is a reminder to pay your hostel fees for the current semester by February 15th to avoid late fees.',
        date: '2024-02-03',
        author: 'Hostel Administration',
        priority: 'high',
        category: 'Hostel',
        type: 'event'
    }
];
