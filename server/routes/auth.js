const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = (db) => {
    const router = express.Router();

    // Register
    router.post('/register', async (req, res) => {
        try {
            const { email, password, name, phone, department, year } = req.body;

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

    // Login
    router.post('/login', async (req, res) => {
        try {
            const { email, password } = req.body;

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

            // Check if user is approved (except for admin)
            if (user.role === 'pending' && !user.approved) {
                return res.json({
                    token: null,
                    user: {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: 'pending',
                        approved: false
                    },
                    message: 'Account pending approval'
                });
            }

            // Generate token
            const token = jwt.sign(
                { userId: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET,
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

    // Change password
    router.post('/change-password', async (req, res) => {
        try {
            const { email, oldPassword, newPassword } = req.body;

            const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
            if (users.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            const user = users[0];
            const isValid = await bcrypt.compare(oldPassword, user.password);
            if (!isValid) {
                return res.status(401).json({ error: 'Invalid old password' });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);

            res.json({ message: 'Password changed successfully' });
        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Check password security (mock implementation)
    router.post('/check-password-security', async (req, res) => {
        try {
            const { password } = req.body;
            
            // Simple security check
            const isLeaked = false; // Mock - would need external API
            const leakCount = 0;
            const usedBefore = false;

            res.json({ isLeaked, leakCount, usedBefore });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Generate password suggestions
    router.get('/generate-password', (req, res) => {
        try {
            const count = parseInt(req.query.count) || 3;
            const length = parseInt(req.query.length) || 16;
            
            const suggestions = [];
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
            
            for (let i = 0; i < count; i++) {
                let password = '';
                for (let j = 0; j < length; j++) {
                    password += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                suggestions.push(password);
            }

            res.json({ suggestions });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Get pending users (admin only)
    router.get('/pending-users', async (req, res) => {
        try {
            const [users] = await db.query(
                'SELECT id, email, name, phone, department, year, created_at FROM users WHERE role = ? AND approved = ? ORDER BY created_at DESC',
                ['pending', false]
            );
            res.json(users);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Approve user and create student record
    router.post('/approve-user/:id', async (req, res) => {
        try {
            const userId = req.params.id;
            const { student_id } = req.body;

            // Get user details
            const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
            if (users.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            const user = users[0];

            // Update user to approved student
            await db.query(
                'UPDATE users SET role = ?, approved = ? WHERE id = ?',
                ['student', true, userId]
            );

            // Create student record
            await db.query(
                'INSERT INTO students (student_id, name, email, phone, department, year, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [student_id, user.name, user.email, user.phone, user.department, user.year, 'active']
            );

            res.json({ message: 'User approved and student record created successfully' });
        } catch (error) {
            console.error('Approval error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Reject user
    router.post('/reject-user/:id', async (req, res) => {
        try {
            await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
            res.json({ message: 'User registration rejected' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Get all users (admin only)
    router.get('/users', async (req, res) => {
        try {
            const [users] = await db.query(`
                SELECT 
                    id, email, 
                    COALESCE(first_name, SUBSTRING_INDEX(name, ' ', 1)) as first_name,
                    COALESCE(last_name, SUBSTRING_INDEX(name, ' ', -1)) as last_name,
                    name, role, 
                    phone, department, year, hostel_id, room_id, 
                    approved, created_at
                FROM users
                WHERE role IN ('admin', 'teacher', 'student')
                ORDER BY 
                    CASE role
                        WHEN 'admin' THEN 1
                        WHEN 'teacher' THEN 2
                        WHEN 'student' THEN 3
                    END,
                    name
            `);
            res.json(users);
        } catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Create user (admin/teacher) - admin only
    router.post('/create-user', async (req, res) => {
        try {
            const { 
                email, password, first_name, last_name, name, role, 
                phone, department, hostel_id, room_id 
            } = req.body;

            // Check if user exists
            const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
            if (existing.length > 0) {
                return res.status(400).json({ error: 'User already exists' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Full name
            const fullName = name || `${first_name} ${last_name}`;

            // Insert user (admin/teacher are auto-approved)
            const [result] = await db.query(
                'INSERT INTO users (email, password, first_name, last_name, name, role, phone, department, hostel_id, room_id, approved) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [email, hashedPassword, first_name, last_name, fullName, role, phone, department, hostel_id, room_id, true]
            );

            res.status(201).json({ 
                message: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully`, 
                userId: result.insertId 
            });
        } catch (error) {
            console.error('User creation error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Create student account - admin only (for new students added directly)
    router.post('/create-student-account', async (req, res) => {
        try {
            const { email, password, name, studentId } = req.body;

            // Check if user exists
            const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
            if (existing.length > 0) {
                return res.status(400).json({ error: 'User account already exists for this email' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert user as student with approved status
            const [result] = await db.query(
                'INSERT INTO users (email, password, name, role, approved) VALUES (?, ?, ?, ?, ?)',
                [email, hashedPassword, name, 'student', true]
            );

            res.status(201).json({ 
                message: 'Student account created successfully', 
                userId: result.insertId 
            });
        } catch (error) {
            console.error('Student account creation error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Update user
    router.put('/users/:id', async (req, res) => {
        try {
            const { 
                first_name, last_name, name, email, phone, 
                department, hostel_id, room_id, role 
            } = req.body;

            const fullName = name || `${first_name} ${last_name}`;

            await db.query(
                'UPDATE users SET first_name = ?, last_name = ?, name = ?, email = ?, phone = ?, department = ?, hostel_id = ?, room_id = ?, role = ? WHERE id = ?',
                [first_name, last_name, fullName, email, phone, department, hostel_id, room_id, role, req.params.id]
            );

            res.json({ message: 'User updated successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Delete user (admin only)
    router.delete('/users/:id', async (req, res) => {
        try {
            await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
            res.json({ message: 'User deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Update own profile
    router.put('/profile/:id', async (req, res) => {
        try {
            const { first_name, last_name, name, phone, department } = req.body;
            const fullName = name || `${first_name} ${last_name}`;

            await db.query(
                'UPDATE users SET first_name = ?, last_name = ?, name = ?, phone = ?, department = ? WHERE id = ?',
                [first_name, last_name, fullName, phone, department, req.params.id]
            );

            // Get updated user data
            const [users] = await db.query('SELECT id, email, name, role FROM users WHERE id = ?', [req.params.id]);

            res.json({ 
                message: 'Profile updated successfully',
                user: users[0]
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
