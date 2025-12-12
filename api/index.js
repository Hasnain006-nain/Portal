const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MySQL connection with caching for serverless
let cachedDb = null;

async function connectDB() {
    if (cachedDb) {
        try {
            await cachedDb.ping();
            return cachedDb;
        } catch (error) {
            cachedDb = null;
        }
    }

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'studentportal',
        port: process.env.DB_PORT || 3306,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    cachedDb = connection;
    return connection;
}

// Initialize database tables and default users
async function initializeDatabase(db) {
    try {
        // Create users table
        await db.query(`
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
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // Create default admin user if it doesn't exist
        const bcrypt = require('bcryptjs');
        const [adminExists] = await db.query('SELECT id FROM users WHERE email = ?', ['admin@university.edu']);
        
        if (adminExists.length === 0) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await db.query(
                'INSERT INTO users (email, password, name, role, approved) VALUES (?, ?, ?, ?, ?)',
                ['admin@university.edu', hashedPassword, 'System Administrator', 'admin', true]
            );
            console.log('✓ Default admin user created: admin@university.edu / admin123');
        }

        // Create default student user if it doesn't exist
        const [studentExists] = await db.query('SELECT id FROM users WHERE email = ?', ['john.doe@university.edu']);
        
        if (studentExists.length === 0) {
            const hashedPassword = await bcrypt.hash('student123', 10);
            await db.query(
                'INSERT INTO users (email, password, name, role, approved, department, year) VALUES (?, ?, ?, ?, ?, ?, ?)',
                ['john.doe@university.edu', hashedPassword, 'John Doe', 'student', true, 'Computer Science', 2]
            );
            console.log('✓ Default student user created: john.doe@university.edu / student123');
        }

        console.log('✓ Database initialized successfully');
    } catch (error) {
        console.error('Database initialization error:', error);
        throw error;
    }
}

// Initialize routes
async function initializeRoutes() {
    try {
        const db = await connectDB();
        console.log('✓ Database connected successfully');
        
        // Initialize database tables and users
        await initializeDatabase(db);

        // Simple auth route
        app.post('/api/auth/login', async (req, res) => {
            try {
                const { email, password } = req.body;
                const bcrypt = require('bcryptjs');
                const jwt = require('jsonwebtoken');

                // Find user
                const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
                if (users.length === 0) {
                    return res.status(401).json({ error: 'Invalid credentials' });
                }

                const user = users[0];

                // Check password
                const isValid = await bcrypt.compare(password, user.password);
                if (!isValid) {
                    return res.status(401).json({ error: 'Invalid credentials' });
                }

                // Generate token
                const token = jwt.sign(
                    { userId: user.id, email: user.email, role: user.role },
                    process.env.JWT_SECRET || 'fallback-secret-key',
                    { expiresIn: '24h' }
                );

                res.json({
                    token,
                    user: {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        approved: user.approved
                    }
                });
            } catch (error) {
                console.error('Login error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Simple register route
        app.post('/api/auth/register', async (req, res) => {
            try {
                const { email, password, name, phone, department, year } = req.body;
                const bcrypt = require('bcryptjs');

                // Check if user exists
                const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
                if (existing.length > 0) {
                    return res.status(400).json({ error: 'User already exists' });
                }

                // Hash password
                const hashedPassword = await bcrypt.hash(password, 10);

                // Insert user with pending status
                const [result] = await db.query(
                    'INSERT INTO users (email, password, name, phone, department, year, role, approved) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [email, hashedPassword, name, phone, department, year, 'pending', false]
                );

                res.status(201).json({ 
                    message: 'Registration submitted. Awaiting admin approval.', 
                    userId: result.insertId 
                });
            } catch (error) {
                console.error('Registration error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Basic API routes are defined above

        // Health check
        app.get('/api/health', (req, res) => {
            res.json({ status: 'ok', message: 'Server is running with database connection' });
        });

        // Database test endpoint
        app.get('/api/test-db', async (req, res) => {
            try {
                const [tables] = await db.query('SHOW TABLES');
                res.json({
                    status: 'ok',
                    database: process.env.DB_NAME,
                    tables: tables.map(t => Object.values(t)[0])
                });
            } catch (error) {
                console.error('Database test error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Error handling middleware
        app.use((err, req, res, next) => {
            console.error('API Error:', err);
            res.status(500).json({ error: 'Internal server error' });
        });

        return app;
    } catch (error) {
        console.error('Failed to initialize routes:', error);
        throw error;
    }
}

// Serverless handler
let appPromise = null;

module.exports = async (req, res) => {
    if (!appPromise) {
        appPromise = initializeRoutes();
    }

    const app = await appPromise;
    return app(req, res);
};
