const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection with caching for serverless
let cachedDb = null;
let cachedClient = null;

async function connectDB() {
    if (cachedDb && cachedClient) {
        const isConnected = cachedClient.topology && cachedClient.topology.isConnected();
        if (isConnected) {
            return cachedDb;
        }
    }

    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri, {
        maxPoolSize: 10,
        minPoolSize: 1,
    });

    await client.connect();
    const db = client.db('studentportal');

    cachedClient = client;
    cachedDb = db;

    return db;
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

    // Health check
    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok', message: 'Server is running' });
    });

    // Database test endpoint
    app.get('/api/test-db', async (req, res) => {
        try {
            const collections = await db.listCollections().toArray();
            const collectionNames = collections.map(c => c.name);
            res.json({
                status: 'ok',
                database: db.databaseName,
                collections: collectionNames
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
