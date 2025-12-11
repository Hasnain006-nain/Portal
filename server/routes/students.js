const express = require('express');

module.exports = (db) => {
    const router = express.Router();

    // Get all students
    router.get('/', async (req, res) => {
        try {
            const [students] = await db.query('SELECT * FROM students ORDER BY created_at DESC');
            res.json(students);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Get student by ID
    router.get('/:id', async (req, res) => {
        try {
            const [students] = await db.query('SELECT * FROM students WHERE id = ?', [req.params.id]);
            if (students.length === 0) {
                return res.status(404).json({ error: 'Student not found' });
            }
            res.json(students[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Create student
    router.post('/', async (req, res) => {
        try {
            // Support both camelCase (frontend) and snake_case (database)
            const student_id = req.body.student_id || req.body.studentId;
            const { name, email, phone, year, status } = req.body;
            const department = req.body.department || req.body.faculty || req.body.major;
            const gender = req.body.gender;
            const hostelBuilding = req.body.hostelBuilding || req.body.hostel_building;
            const roomNumber = req.body.roomNumber || req.body.room_number;
            
            // Check if columns exist before inserting
            const [columns] = await db.query(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students'
            `);
            
            const columnNames = columns.map(c => c.COLUMN_NAME);
            
            // Build dynamic query based on available columns
            let fields = ['student_id', 'name', 'email'];
            let values = [student_id, name, email];
            let placeholders = ['?', '?', '?'];
            
            if (columnNames.includes('phone') && phone) {
                fields.push('phone');
                values.push(phone);
                placeholders.push('?');
            }
            
            if (columnNames.includes('department') && department) {
                fields.push('department');
                values.push(department);
                placeholders.push('?');
            }
            
            if (columnNames.includes('year') && year) {
                fields.push('year');
                values.push(year);
                placeholders.push('?');
            }
            
            if (columnNames.includes('gender') && gender) {
                fields.push('gender');
                values.push(gender);
                placeholders.push('?');
            }
            
            if (columnNames.includes('hostel_building') && hostelBuilding) {
                fields.push('hostel_building');
                values.push(hostelBuilding);
                placeholders.push('?');
            }
            
            if (columnNames.includes('room_number') && roomNumber) {
                fields.push('room_number');
                values.push(roomNumber);
                placeholders.push('?');
            }
            
            if (columnNames.includes('status')) {
                fields.push('status');
                values.push(status || 'active');
                placeholders.push('?');
            }
            
            const query = `INSERT INTO students (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`;
            const [result] = await db.query(query, values);

            res.status(201).json({ 
                message: 'Student created successfully', 
                id: result.insertId 
            });
        } catch (error) {
            console.error('Create student error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Update student
    router.put('/:id', async (req, res) => {
        try {
            const { name, email, phone, year, status } = req.body;
            const department = req.body.department || req.body.major;
            
            await db.query(
                'UPDATE students SET name = ?, email = ?, phone = ?, department = ?, year = ?, status = ? WHERE id = ?',
                [name, email, phone || null, department, year, status, req.params.id]
            );

            res.json({ message: 'Student updated successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Delete student
    router.delete('/:id', async (req, res) => {
        try {
            await db.query('DELETE FROM students WHERE id = ?', [req.params.id]);
            res.json({ message: 'Student deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
