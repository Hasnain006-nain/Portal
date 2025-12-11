require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;
const idTransformMiddleware = require('./middleware/idTransform');

// Middleware
app.use(cors());
app.use(express.json());
app.use(idTransformMiddleware);

async function startServer() {
    try {
        // Initialize database and create tables
        const db = await initializeDatabase();
        console.log('✓ Connected to MySQL Database');
        console.log('✓ Database tables initialized');

        // Import routes
        const authRoutes = require('./routes/auth')(db);
        const hostelRoutes = require('./routes/hostels')(db);
        const roomRoutes = require('./routes/rooms')(db);
        const bookRoutes = require('./routes/books')(db);
        const courseRoutes = require('./routes/courses')(db);
        const studentRoutes = require('./routes/students')(db);
        const borrowingRoutes = require('./routes/borrowings')(db);
        const enrollmentRoutes = require('./routes/enrollments')(db);
        const requestRoutes = require('./routes/requests')(db);
        const notificationRoutes = require('./routes/notifications')(db);
        const announcementRoutes = require('./routes/announcements')(db);
        const appointmentRoutes = require('./routes/appointments')(db);
        const serviceRoutes = require('./routes/services')(db);

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
            res.json({ status: 'ok', message: 'Server is running with MySQL' });
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

        // Error handling middleware
        app.use((err, req, res, next) => {
            console.error(err.stack);
            res.status(500).json({ error: 'Something went wrong!' });
        });

        app.listen(PORT, () => {
            console.log(`✓ Server running on http://localhost:${PORT}`);
            console.log(`✓ API available at http://localhost:${PORT}/api`);
            console.log('\n✓ Using MySQL Database (XAMPP)');
            console.log('  Make sure XAMPP MySQL is running!');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
