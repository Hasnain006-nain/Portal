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

        console.log('✓ Database tables created successfully');
    } catch (error) {
        console.error('Error creating tables:', error);
        throw error;
    } finally {
        connection.release();
    }

    return pool;
}

module.exports = { createPool, initializeDatabase };
