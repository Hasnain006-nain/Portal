const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Mock users database (in-memory for immediate functionality)
const users = [
    {
        id: 1,
        email: 'admin@university.edu',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // admin123
        name: 'System Administrator',
        role: 'admin',
        approved: true
    },
    {
        id: 2,
        email: 'john.doe@university.edu',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // student123
        name: 'John Doe',
        role: 'student',
        approved: true,
        department: 'Computer Science',
        year: 2
    }
];

// Auth routes
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password (for demo, accept both hashed and plain passwords)
        let isValid = false;
        if (password === 'admin123' && email === 'admin@university.edu') {
            isValid = true;
        } else if (password === 'student123' && email === 'john.doe@university.edu') {
            isValid = true;
        } else {
            isValid = await bcrypt.compare(password, user.password);
        }

        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'university-portal-secret-key-2024',
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

app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, name, phone, department, year } = req.body;

        // Check if user exists
        const existing = users.find(u => u.email === email);
        if (existing) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Add user to mock database
        const newUser = {
            id: users.length + 1,
            email,
            password: hashedPassword,
            name,
            phone,
            department,
            year,
            role: 'pending',
            approved: false
        };
        users.push(newUser);

        res.status(201).json({ 
            message: 'Registration submitted. Awaiting admin approval.', 
            userId: newUser.id 
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
