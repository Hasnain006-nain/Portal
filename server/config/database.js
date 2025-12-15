const mysql = require('mysql2/promise');

let pool = null;

async function createPool() {
    if (pool) return pool;

    pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'studentportal',
        port: process.env.DB_PORT || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    return pool;
}

async function initializeDatabase() {
    const pool = await createPool();
    
    // Create tables if they don't exist
    const connection = await pool.getConnection();
    
    try {
        // Users table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                name VARCHAR(255) NOT NULL,
                role ENUM('student', 'admin', 'teacher', 'pending') DEFAULT 'pending',
                phone VARCHAR(20),
                department VARCHAR(100),
                year INT,
                hostel_id INT,
                room_id INT,
                approved BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE SET NULL,
                FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL
            )
        `);

        // Students table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS students (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(20),
                department VARCHAR(100),
                year INT,
                status ENUM('active', 'inactive', 'graduated') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Courses table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS courses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                course_code VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                credits INT,
                department VARCHAR(100),
                instructor VARCHAR(255),
                semester VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Enrollments table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS enrollments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                course_id INT NOT NULL,
                enrollment_date DATE,
                grade VARCHAR(5),
                status ENUM('enrolled', 'completed', 'dropped') DEFAULT 'enrolled',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
            )
        `);

        // Hostels table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS hostels (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                type ENUM('boys', 'girls', 'mixed') NOT NULL,
                total_rooms INT DEFAULT 0,
                occupied_rooms INT DEFAULT 0,
                warden_name VARCHAR(255),
                warden_contact VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Rooms table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS rooms (
                id INT AUTO_INCREMENT PRIMARY KEY,
                hostel_id INT NOT NULL,
                room_number VARCHAR(50) NOT NULL,
                floor INT,
                capacity INT DEFAULT 2,
                occupied INT DEFAULT 0,
                status ENUM('available', 'occupied', 'maintenance') DEFAULT 'available',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE CASCADE,
                UNIQUE KEY unique_room (hostel_id, room_number)
            )
        `);

        // Room residents table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS room_residents (
                id INT AUTO_INCREMENT PRIMARY KEY,
                room_id INT NOT NULL,
                student_id INT NOT NULL,
                check_in_date DATE,
                check_out_date DATE,
                status ENUM('active', 'checked_out') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
            )
        `);

        // Books table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS books (
                id INT AUTO_INCREMENT PRIMARY KEY,
                isbn VARCHAR(50) UNIQUE,
                title VARCHAR(255) NOT NULL,
                author VARCHAR(255),
                publisher VARCHAR(255),
                category VARCHAR(100),
                total_copies INT DEFAULT 1,
                available_copies INT DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Borrowings table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS borrowings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                book_id INT NOT NULL,
                borrow_date DATE NOT NULL,
                due_date DATE NOT NULL,
                return_date DATE,
                status ENUM('borrowed', 'returned', 'overdue') DEFAULT 'borrowed',
                fine DECIMAL(10, 2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
            )
        `);

        // Requests table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id VARCHAR(255) NOT NULL,
                type ENUM('hostel', 'library', 'course', 'other', 'borrow', 'return', 'enroll', 'unenroll', 'new_user') NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                admin_note TEXT,
                book_id INT,
                book_title VARCHAR(255),
                book_author VARCHAR(255),
                course_id INT,
                course_code VARCHAR(50),
                course_name VARCHAR(255),
                borrowing_id INT,
                enrollment_id INT,
                student_email VARCHAR(255),
                student_name VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Notifications table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT,
                type ENUM('info', 'warning', 'success', 'error') DEFAULT 'info',
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Announcements table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS announcements (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                type ENUM('general', 'academic', 'hostel', 'library', 'urgent') DEFAULT 'general',
                priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
                created_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        // Announcement reads table (track who has read what)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS announcement_reads (
                id INT AUTO_INCREMENT PRIMARY KEY,
                announcement_id INT NOT NULL,
                user_id INT NOT NULL,
                read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_read (announcement_id, user_id)
            )
        `);

        // Services table for appointments
        await connection.query(`
            CREATE TABLE IF NOT EXISTS services (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                duration INT DEFAULT 30 COMMENT 'Duration in minutes',
                department VARCHAR(100),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Staff availability table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS staff_availability (
                id INT AUTO_INCREMENT PRIMARY KEY,
                staff_id INT NOT NULL,
                day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                is_available BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Appointments table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS appointments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                service_id INT NOT NULL,
                staff_id INT,
                appointment_date DATE NOT NULL,
                appointment_time TIME NOT NULL,
                token_number VARCHAR(20) UNIQUE NOT NULL,
                status ENUM('pending', 'approved', 'rejected', 'completed', 'cancelled', 'no_show') DEFAULT 'pending',
                queue_position INT,
                notes TEXT,
                admin_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
                FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);

        // Appointment notifications table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS appointment_notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                appointment_id INT NOT NULL,
                user_id INT NOT NULL,
                notification_type ENUM('confirmation', 'reminder', 'status_change', 'queue_update') NOT NULL,
                message TEXT NOT NULL,
                is_sent BOOLEAN DEFAULT FALSE,
                sent_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Create default admin user if it doesn't exist
        const bcrypt = require('bcryptjs');
        const [adminExists] = await connection.query('SELECT id FROM users WHERE email = ?', ['admin@university.edu']);
        
        if (adminExists.length === 0) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await connection.query(
                'INSERT INTO users (email, password, name, role, approved) VALUES (?, ?, ?, ?, ?)',
                ['admin@university.edu', hashedPassword, 'System Administrator', 'admin', true]
            );
            console.log('✓ Default admin user created: admin@university.edu / admin123');
        }

        // Create default student user if it doesn't exist
        const [studentExists] = await connection.query('SELECT id FROM users WHERE email = ?', ['john.doe@university.edu']);
        
        if (studentExists.length === 0) {
            const hashedPassword = await bcrypt.hash('student123', 10);
            await connection.query(
                'INSERT INTO users (email, password, name, role, approved, department, year) VALUES (?, ?, ?, ?, ?, ?, ?)',
                ['john.doe@university.edu', hashedPassword, 'John Doe', 'student', true, 'Computer Science', 2]
            );
            console.log('✓ Default student user created: john.doe@university.edu / student123');
        }

        // Insert sample students if none exist
        const [studentsCount] = await connection.query('SELECT COUNT(*) as count FROM students');
        if (studentsCount[0].count === 0) {
            const sampleStudents = [
                ['STU001', 'John Doe', 'john.doe@university.edu', '+1234567890', 'Computer Science', 2, 'active'],
                ['STU002', 'Jane Smith', 'jane.smith@university.edu', '+1234567891', 'Mathematics', 3, 'active'],
                ['STU003', 'Mike Johnson', 'mike.johnson@university.edu', '+1234567892', 'Physics', 1, 'active'],
                ['STU004', 'Sarah Wilson', 'sarah.wilson@university.edu', '+1234567893', 'Chemistry', 4, 'active'],
                ['STU005', 'David Brown', 'david.brown@university.edu', '+1234567894', 'Biology', 2, 'active'],
                ['STU006', 'Emily Davis', 'emily.davis@university.edu', '+1234567895', 'Literature', 3, 'active'],
                ['STU007', 'Alex Miller', 'alex.miller@university.edu', '+1234567896', 'Economics', 1, 'active'],
                ['STU008', 'Lisa Garcia', 'lisa.garcia@university.edu', '+1234567897', 'Psychology', 4, 'active']
            ];

            for (const student of sampleStudents) {
                await connection.query(
                    'INSERT INTO students (student_id, name, email, phone, department, year, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    student
                );
            }
            console.log('✓ Sample students created');
        }

        // Insert sample books if none exist
        const [booksCount] = await connection.query('SELECT COUNT(*) as count FROM books');
        if (booksCount[0].count === 0) {
            const sampleBooks = [
                ['978-0262033848', 'Introduction to Algorithms', 'Thomas H. Cormen', 'MIT Press', 'Computer Science', 5, 3],
                ['978-1285741550', 'Calculus: Early Transcendentals', 'James Stewart', 'Cengage Learning', 'Mathematics', 8, 6],
                ['978-1133947271', 'Physics for Scientists and Engineers', 'Raymond A. Serway', 'Cengage Learning', 'Physics', 4, 2],
                ['978-0134093413', 'Campbell Biology', 'Jane B. Reece', 'Pearson', 'Biology', 6, 4],
                ['978-0134414232', 'Chemistry: The Central Science', 'Theodore E. Brown', 'Pearson', 'Chemistry', 7, 5],
                ['978-0393617405', 'The Norton Anthology of English Literature', 'Stephen Greenblatt', 'W. W. Norton', 'Literature', 3, 2],
                ['978-1319013387', 'Principles of Economics', 'N. Gregory Mankiw', 'Worth Publishers', 'Economics', 5, 3],
                ['978-1464140815', 'Psychology: The Science of Mind and Behaviour', 'Michael W. Passer', 'McGraw-Hill', 'Psychology', 4, 3],
                ['978-0134685991', 'Engineering Mechanics: Dynamics', 'Russell C. Hibbeler', 'Pearson', 'Engineering', 3, 1],
                ['978-0134746968', 'Business Communication Today', 'Courtland L. Bovee', 'Pearson', 'Business', 6, 4]
            ];

            for (const book of sampleBooks) {
                await connection.query(
                    'INSERT INTO books (isbn, title, author, publisher, category, total_copies, available_copies) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    book
                );
            }
            console.log('✓ Sample books created');
        }

        // Insert sample courses if none exist
        const [coursesCount] = await connection.query('SELECT COUNT(*) as count FROM courses');
        if (coursesCount[0].count === 0) {
            const sampleCourses = [
                ['CS101', 'Introduction to Programming', 'Learn the fundamentals of programming', 3, 'Computer Science', 'Dr. Smith', 'Fall 2024'],
                ['MATH201', 'Calculus II', 'Advanced calculus concepts', 4, 'Mathematics', 'Dr. Johnson', 'Fall 2024'],
                ['PHY101', 'Physics I', 'Mechanics and thermodynamics', 3, 'Physics', 'Dr. Brown', 'Fall 2024'],
                ['CHEM101', 'General Chemistry', 'Basic chemistry principles', 4, 'Chemistry', 'Dr. Davis', 'Fall 2024'],
                ['BIO101', 'Introduction to Biology', 'Cell biology and genetics', 3, 'Biology', 'Dr. Wilson', 'Fall 2024'],
                ['ENG201', 'English Literature', 'Classic and modern literature', 3, 'Literature', 'Dr. Miller', 'Fall 2024'],
                ['ECON101', 'Microeconomics', 'Supply and demand principles', 3, 'Economics', 'Dr. Garcia', 'Fall 2024'],
                ['PSY101', 'Introduction to Psychology', 'Human behavior and cognition', 3, 'Psychology', 'Dr. Taylor', 'Fall 2024']
            ];

            for (const course of sampleCourses) {
                await connection.query(
                    'INSERT INTO courses (course_code, name, description, credits, department, instructor, semester) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    course
                );
            }
            console.log('✓ Sample courses created');
        }

        // Insert sample hostels if none exist
        const [hostelsCount] = await connection.query('SELECT COUNT(*) as count FROM hostels');
        if (hostelsCount[0].count === 0) {
            const sampleHostels = [
                ['Alpha Hostel', 'boys', 50, 35, 'Mr. Wilson', '+1234567800'],
                ['Beta Hostel', 'girls', 45, 30, 'Ms. Davis', '+1234567801'],
                ['Gamma Hostel', 'mixed', 60, 40, 'Dr. Johnson', '+1234567802']
            ];

            for (const hostel of sampleHostels) {
                await connection.query(
                    'INSERT INTO hostels (name, type, total_rooms, occupied_rooms, warden_name, warden_contact) VALUES (?, ?, ?, ?, ?, ?)',
                    hostel
                );
            }
            console.log('✓ Sample hostels created');
        }

        console.log('✓ Database tables and sample data created successfully');
    } catch (error) {
        console.error('Error creating tables:', error);
        throw error;
    } finally {
        connection.release();
    }

    return pool;
}

module.exports = { createPool, initializeDatabase };
