require('dotenv').config();
const bcrypt = require('bcryptjs');
const { initializeDatabase } = require('./config/database');

async function seedDatabase() {
    try {
        console.log('🌱 Starting database seeding...\n');
        
        const db = await initializeDatabase();
        console.log('✓ Connected to MySQL\n');

        // Clear existing data
        console.log('Clearing existing data...');
        await db.query('DELETE FROM enrollments');
        await db.query('DELETE FROM borrowings');
        await db.query('DELETE FROM requests');
        await db.query('DELETE FROM notifications');
        await db.query('DELETE FROM announcements');
        await db.query('DELETE FROM rooms');
        await db.query('DELETE FROM hostels');
        await db.query('DELETE FROM books');
        await db.query('DELETE FROM courses');
        await db.query('DELETE FROM students');
        await db.query('DELETE FROM users');
        console.log('✓ Cleared existing data\n');

        // Hash passwords
        const adminPassword = await bcrypt.hash('admin123', 10);
        const studentPassword = await bcrypt.hash('student123', 10);
        const teacherPassword = await bcrypt.hash('teacher123', 10);

        // 1. Create Users (Admin, Students, Teachers)
        console.log('Creating users...');
        const users = [
            // Admin
            ['admin@university.edu', adminPassword, 'Dr. Sarah Admin', 'admin', new Date()],
            // Students
            ['john.doe@university.edu', studentPassword, 'John Doe', 'student', new Date()],
            ['jane.smith@university.edu', studentPassword, 'Jane Smith', 'student', new Date()],
            ['mike.johnson@university.edu', studentPassword, 'Mike Johnson', 'student', new Date()],
            // Teachers
            ['prof.wilson@university.edu', teacherPassword, 'Prof. Robert Wilson', 'teacher', new Date()],
            ['dr.brown@university.edu', teacherPassword, 'Dr. Emily Brown', 'teacher', new Date()],
            ['prof.davis@university.edu', teacherPassword, 'Prof. Michael Davis', 'teacher', new Date()]
        ];

        for (const user of users) {
            await db.query(
                'INSERT INTO users (email, password, name, role, created_at) VALUES (?, ?, ?, ?, ?)',
                user
            );
        }
        console.log('✓ Created 7 users (1 admin, 3 students, 3 teachers)\n');

        // 2. Create Students
        console.log('Creating student records...');
        const [userResults] = await db.query('SELECT id, email, name FROM users WHERE role = "student"');
        
        const students = [
            ['STU001', userResults[0].name, userResults[0].email, '123-456-7890', 'Computer Science', 3, 'active'],
            ['STU002', userResults[1].name, userResults[1].email, '123-456-7891', 'Business Administration', 2, 'active'],
            ['STU003', userResults[2].name, userResults[2].email, '123-456-7892', 'Engineering', 4, 'active']
        ];

        for (const student of students) {
            await db.query(
                'INSERT INTO students (student_id, name, email, phone, department, year, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                student
            );
        }
        console.log('✓ Created 3 student records\n');

        // 3. Create Courses
        console.log('Creating courses...');
        const [teacherResults] = await db.query('SELECT id, name FROM users WHERE role = "admin"');
        
        const courses = [
            ['CS101', 'Introduction to Programming', 'Learn the basics of programming with Python', 4, 'Computer Science', teacherResults[0].name, 'Fall 2024'],
            ['CS201', 'Data Structures & Algorithms', 'Advanced programming concepts and algorithms', 4, 'Computer Science', teacherResults[0].name, 'Fall 2024'],
            ['BUS101', 'Business Fundamentals', 'Introduction to business principles', 3, 'Business', teacherResults[0].name, 'Fall 2024'],
            ['ENG101', 'Engineering Mathematics', 'Mathematical foundations for engineering', 4, 'Engineering', teacherResults[0].name, 'Fall 2024'],
            ['CS301', 'Database Systems', 'Design and implementation of database systems', 3, 'Computer Science', teacherResults[0].name, 'Fall 2024'],
            ['BUS201', 'Marketing Strategy', 'Modern marketing techniques and strategies', 3, 'Business', teacherResults[0].name, 'Fall 2024']
        ];

        for (const course of courses) {
            await db.query(
                'INSERT INTO courses (course_code, name, description, credits, department, instructor, semester) VALUES (?, ?, ?, ?, ?, ?, ?)',
                course
            );
        }
        console.log('✓ Created 6 courses\n');

        // 4. Create Enrollments
        console.log('Creating enrollments...');
        const [studentIds] = await db.query('SELECT id FROM students');
        const [courseIds] = await db.query('SELECT id FROM courses');
        
        const today = new Date().toISOString().split('T')[0];
        const enrollments = [
            [studentIds[0].id, courseIds[0].id, today, 'A', 'enrolled'],
            [studentIds[0].id, courseIds[1].id, today, 'B+', 'enrolled'],
            [studentIds[1].id, courseIds[2].id, today, 'A-', 'enrolled'],
            [studentIds[2].id, courseIds[3].id, today, 'B', 'enrolled']
        ];

        for (const enrollment of enrollments) {
            await db.query(
                'INSERT INTO enrollments (student_id, course_id, enrollment_date, grade, status) VALUES (?, ?, ?, ?, ?)',
                enrollment
            );
        }
        console.log('✓ Created 4 enrollments\n');

        // 5. Create Books
        console.log('Creating library books...');
        const books = [
            ['978-0262033848', 'Introduction to Algorithms', 'Thomas H. Cormen', 'MIT Press', 'Computer Science', 5, 5],
            ['978-0132350884', 'Clean Code', 'Robert C. Martin', 'Prentice Hall', 'Software Engineering', 3, 2],
            ['978-0201633610', 'Design Patterns', 'Gang of Four', 'Addison-Wesley', 'Software Engineering', 4, 4],
            ['978-0684841489', 'Business Strategy', 'Michael Porter', 'Free Press', 'Business', 6, 5],
            ['978-1118807330', 'Engineering Mechanics', 'J.L. Meriam', 'Wiley', 'Engineering', 8, 7],
            ['978-0078022159', 'Database System Concepts', 'Abraham Silberschatz', 'McGraw-Hill', 'Computer Science', 4, 3]
        ];

        for (const book of books) {
            await db.query(
                'INSERT INTO books (isbn, title, author, publisher, category, total_copies, available_copies) VALUES (?, ?, ?, ?, ?, ?, ?)',
                book
            );
        }
        console.log('✓ Created 6 library books\n');

        // 6. Create Borrowings
        console.log('Creating book borrowings...');
        const [bookIds] = await db.query('SELECT id FROM books');
        
        const borrowDate = new Date().toISOString().split('T')[0];
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);
        const dueDateStr = dueDate.toISOString().split('T')[0];

        const borrowings = [
            [studentIds[0].id, bookIds[0].id, borrowDate, dueDateStr, null, 'borrowed', 0],
            [studentIds[1].id, bookIds[3].id, borrowDate, dueDateStr, null, 'borrowed', 0]
        ];

        for (const borrowing of borrowings) {
            await db.query(
                'INSERT INTO borrowings (student_id, book_id, borrow_date, due_date, return_date, status, fine) VALUES (?, ?, ?, ?, ?, ?, ?)',
                borrowing
            );
        }
        
        // Update available copies
        await db.query('UPDATE books SET available_copies = available_copies - 1 WHERE id IN (?, ?)', [bookIds[0].id, bookIds[3].id]);
        console.log('✓ Created 2 book borrowings\n');

        // 7. Create Hostels
        console.log('Creating hostels...');
        const hostels = [
            ['Sunrise Hall', 'boys', 100, 75, 'Mr. John Warden', '555-0101'],
            ['Moonlight Residence', 'girls', 80, 60, 'Ms. Sarah Warden', '555-0102'],
            ['Starlight Dorm', 'mixed', 90, 70, 'Dr. Mike Warden', '555-0103']
        ];

        for (const hostel of hostels) {
            await db.query(
                'INSERT INTO hostels (name, type, total_rooms, occupied_rooms, warden_name, warden_contact) VALUES (?, ?, ?, ?, ?, ?)',
                hostel
            );
        }
        console.log('✓ Created 3 hostels\n');

        // 8. Create Rooms
        console.log('Creating hostel rooms...');
        const [hostelIds] = await db.query('SELECT id FROM hostels');
        
        const rooms = [
            [hostelIds[0].id, '101', 1, 1, 1, 'occupied'],
            [hostelIds[0].id, '102', 1, 2, 2, 'occupied'],
            [hostelIds[0].id, '103', 1, 2, 0, 'available'],
            [hostelIds[1].id, '201', 2, 1, 1, 'occupied'],
            [hostelIds[1].id, '202', 2, 3, 0, 'available'],
            [hostelIds[2].id, '301', 3, 2, 2, 'occupied']
        ];

        for (const room of rooms) {
            await db.query(
                'INSERT INTO rooms (hostel_id, room_number, floor, capacity, occupied, status) VALUES (?, ?, ?, ?, ?, ?)',
                room
            );
        }
        console.log('✓ Created 6 hostel rooms\n');

        // 9. Create Announcements
        console.log('Creating announcements...');
        const [adminUser] = await db.query('SELECT id FROM users WHERE role = "admin" LIMIT 1');
        const announcements = [
            ['Welcome to New Semester', 'Welcome all students to the Fall 2024 semester!', 'general', 'high', adminUser[0].id],
            ['Library Hours Extended', 'Library will be open 24/7 during exam week', 'academic', 'medium', adminUser[0].id],
            ['Hostel Maintenance Notice', 'Scheduled maintenance in Sunrise Hall this weekend', 'hostel', 'low', adminUser[0].id]
        ];

        for (const announcement of announcements) {
            await db.query(
                'INSERT INTO announcements (title, content, type, priority, created_by) VALUES (?, ?, ?, ?, ?)',
                announcement
            );
        }
        console.log('✓ Created 3 announcements\n');

        // 10. Create Requests
        console.log('Creating support requests...');
        const requests = [
            [studentIds[0].id, 'hostel', 'Room Change Request', 'I would like to change my room to a single occupancy', 'pending', null],
            [studentIds[1].id, 'course', 'Course Add Request', 'Request to add CS301 to my schedule', 'approved', 'Approved by academic advisor']
        ];

        for (const request of requests) {
            await db.query(
                'INSERT INTO requests (student_id, type, title, description, status, admin_note) VALUES (?, ?, ?, ?, ?, ?)',
                request
            );
        }
        console.log('✓ Created 2 support requests\n');

        console.log('✅ Database seeding completed successfully!\n');
        console.log('📊 Summary:');
        console.log('   - 7 Users (1 admin, 3 students, 3 teachers)');
        console.log('   - 3 Student records');
        console.log('   - 6 Courses');
        console.log('   - 4 Enrollments');
        console.log('   - 6 Library books');
        console.log('   - 2 Book borrowings');
        console.log('   - 3 Hostels');
        console.log('   - 6 Hostel rooms');
        console.log('   - 3 Announcements');
        console.log('   - 2 Support requests\n');
        
        console.log('🔐 Login Credentials:');
        console.log('   Admin: admin@university.edu / admin123');
        console.log('   Student: john.doe@university.edu / student123');
        console.log('   Teacher: prof.wilson@university.edu / teacher123\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedDatabase();
