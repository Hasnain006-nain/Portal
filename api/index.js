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

// Initialize routes
async function initializeRoutes() {
    const db = await connectDB();

    // Import routes
    const authRoutes = require('../server/routes/auth')(db);
    const hostelRoutes = require('../server/routes/hostels')(db);
    const roomRoutes = require('../server/routes/rooms')(db);
    const bookRoutes = require('../server/routes/books')(db);
    const courseRoutes = require('../server/routes/courses')(db);
    const studentRoutes = require('../server/routes/students')(db);
    const borrowingRoutes = require('../server/routes/borrowings')(db);
    const enrollmentRoutes = require('../server/routes/enrollments')(db);
    const requestRoutes = require('../server/routes/requests')(db);
    const notificationRoutes = require('../server/routes/notifications')(db);
    const announcementRoutes = require('../server/routes/announcements')(db);
    const appointmentRoutes = require('../server/routes/appointments')(db);
    const serviceRoutes = require('../server/routes/services')(db);

    // API routes
    app.use('/api/auth', authRoutes);
    app.use('/api/hostels', hostelRoutes);
    app.use('/api/rooms', roomRoutes);
    app.use('/api/books', bookRoutes);
    app.use('/api/courses', courseRoutes);
    app.use('/api/students', studentRoutes);
    app.use('/api/borrowings', borrowingRoutes);
    app.use('/api/enrollments', enrollmentRoutes);
    app.use('/api/requests', requestRoutes);
    app.use('/api/notifications', notificationRoutes);
    app.use('/api/announcements', announcementRoutes);
    app.use('/api/appointments', appointmentRoutes);
    app.use('/api/services', serviceRoutes);

    // Health check
    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok', message: 'Server is running' });
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
            res.status(500).json({ error: error.message });
        }
    });

    return app;
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
