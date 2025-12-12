// Environment variables with defaults for demo
const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'demo_user',
    password: process.env.DB_PASSWORD || 'demo_password',
    database: process.env.DB_NAME || 'studentportal',
    port: process.env.DB_PORT || 3306
};

const JWT_SECRET = process.env.JWT_SECRET || 'demo-jwt-secret-key-for-development-only';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Mock data for all features (simulating database)
const mockData = {
    students: [
        { id: 1, student_id: 'STU001', name: 'John Doe', email: 'john.doe@university.edu', department: 'Computer Science', year: 2, status: 'active' },
        { id: 2, student_id: 'STU002', name: 'Jane Smith', email: 'jane.smith@university.edu', department: 'Mathematics', year: 3, status: 'active' },
        { id: 3, student_id: 'STU003', name: 'Mike Johnson', email: 'mike.johnson@university.edu', department: 'Physics', year: 1, status: 'active' }
    ],
    courses: [
        { id: 1, course_code: 'CS101', name: 'Introduction to Programming', credits: 3, department: 'Computer Science', instructor: 'Dr. Smith' },
        { id: 2, course_code: 'MATH201', name: 'Calculus II', credits: 4, department: 'Mathematics', instructor: 'Dr. Johnson' },
        { id: 3, course_code: 'PHY101', name: 'Physics I', credits: 3, department: 'Physics', instructor: 'Dr. Brown' }
    ],
    books: [
        { id: 1, title: 'Introduction to Algorithms', author: 'Thomas Cormen', isbn: '978-0262033848', category: 'Computer Science', total_copies: 5, available_copies: 3 },
        { id: 2, title: 'Calculus: Early Transcendentals', author: 'James Stewart', isbn: '978-1285741550', category: 'Mathematics', total_copies: 8, available_copies: 6 },
        { id: 3, title: 'Physics for Scientists', author: 'Raymond Serway', isbn: '978-1133947271', category: 'Physics', total_copies: 4, available_copies: 2 }
    ],
    hostels: [
        { id: 1, name: 'Alpha Hostel', type: 'boys', total_rooms: 50, occupied_rooms: 35, warden_name: 'Mr. Wilson', warden_contact: '+1234567890' },
        { id: 2, name: 'Beta Hostel', type: 'girls', total_rooms: 45, occupied_rooms: 30, warden_name: 'Ms. Davis', warden_contact: '+1234567891' }
    ],
    announcements: [
        { id: 1, title: 'Welcome to New Semester', content: 'Welcome all students to the new academic semester!', type: 'general', priority: 'high', created_at: new Date().toISOString() },
        { id: 2, title: 'Library Hours Extended', content: 'Library will be open 24/7 during exam period.', type: 'library', priority: 'medium', created_at: new Date().toISOString() }
    ],
    enrollments: [
        { id: 1, student_id: 2, course_id: 1, status: 'enrolled', enrollment_date: '2024-01-15' },
        { id: 2, student_id: 2, course_id: 2, status: 'enrolled', enrollment_date: '2024-01-15' }
    ],
    borrowings: [
        { id: 1, student_id: 2, book_id: 1, borrow_date: '2024-01-10', due_date: '2024-01-24', status: 'borrowed' }
    ]
};

export default function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const url = req.url;
    const method = req.method;

    // Health check
    if (url === '/api/health') {
        res.status(200).json({ 
            status: 'ok', 
            message: 'Server running',
            environment: NODE_ENV,
            database: {
                host: DB_CONFIG.host,
                database: DB_CONFIG.database,
                connected: true // Mock connection status
            },
            timestamp: new Date().toISOString()
        });
        return;
    }
    
    // AUTH ENDPOINTS
    if (url === '/api/auth/login' && method === 'POST') {
        let body = {};
        try {
            body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
        } catch (e) {
            res.status(400).json({ error: 'Invalid JSON in request body' });
            return;
        }
        const { email, password } = body;
        
        if (email === 'admin@university.edu' && password === 'admin123') {
            res.status(200).json({
                token: 'admin-token-123',
                user: { id: 1, email: 'admin@university.edu', name: 'System Administrator', role: 'admin', approved: true }
            });
        } else if (email === 'john.doe@university.edu' && password === 'student123') {
            res.status(200).json({
                token: 'student-token-123',
                user: { id: 2, email: 'john.doe@university.edu', name: 'John Doe', role: 'student', approved: true }
            });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
        return;
    }
    
    if (url === '/api/auth/register' && method === 'POST') {
        let body = {};
        try {
            body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
        } catch (e) {
            res.status(400).json({ error: 'Invalid JSON in request body' });
            return;
        }
        res.status(201).json({ message: 'Registration submitted. Awaiting admin approval.', userId: Math.floor(Math.random() * 1000) });
        return;
    }

    // STUDENTS ENDPOINTS
    if (url === '/api/students' && method === 'GET') {
        res.status(200).json(mockData.students);
        return;
    }

    // COURSES ENDPOINTS
    if (url === '/api/courses' && method === 'GET') {
        res.status(200).json(mockData.courses);
        return;
    }

    // BOOKS ENDPOINTS
    if (url === '/api/books' && method === 'GET') {
        res.status(200).json(mockData.books);
        return;
    }

    // HOSTELS ENDPOINTS
    if (url === '/api/hostels' && method === 'GET') {
        res.status(200).json(mockData.hostels);
        return;
    }

    // ANNOUNCEMENTS ENDPOINTS
    if (url === '/api/announcements' && method === 'GET') {
        res.status(200).json(mockData.announcements);
        return;
    }

    // ENROLLMENTS ENDPOINTS
    if (url.startsWith('/api/enrollments/student/') && method === 'GET') {
        const studentId = parseInt(url.split('/').pop());
        const studentEnrollments = mockData.enrollments.filter(e => e.student_id === studentId);
        res.status(200).json(studentEnrollments);
        return;
    }

    if (url === '/api/enrollments' && method === 'GET') {
        res.status(200).json(mockData.enrollments);
        return;
    }

    // BORROWINGS ENDPOINTS
    if (url.startsWith('/api/borrowings/student/') && method === 'GET') {
        const studentId = parseInt(url.split('/').pop());
        const studentBorrowings = mockData.borrowings.filter(b => b.student_id === studentId);
        res.status(200).json(studentBorrowings);
        return;
    }

    if (url === '/api/borrowings' && method === 'GET') {
        res.status(200).json(mockData.borrowings);
        return;
    }

    // ROOMS ENDPOINTS
    if (url === '/api/rooms' && method === 'GET') {
        res.status(200).json([
            { id: 1, hostel_id: 1, room_number: '101', floor: 1, capacity: 2, occupied: 1, status: 'available' },
            { id: 2, hostel_id: 1, room_number: '102', floor: 1, capacity: 2, occupied: 2, status: 'occupied' }
        ]);
        return;
    }

    // REQUESTS ENDPOINTS
    if (url === '/api/requests' && method === 'GET') {
        res.status(200).json([
            { id: 1, student_id: '2', type: 'library', title: 'Book Request', description: 'Need access to advanced books', status: 'pending' }
        ]);
        return;
    }

    // NOTIFICATIONS ENDPOINTS
    if (url.startsWith('/api/notifications/email/') && method === 'GET') {
        res.status(200).json([
            { id: 1, title: 'Welcome!', message: 'Welcome to the university portal', type: 'info', is_read: false, created_at: new Date().toISOString() }
        ]);
        return;
    }

    // Default 404
    res.status(404).json({ error: 'Not found' });
}
