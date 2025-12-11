const express = require('express');

module.exports = (db) => {
    const router = express.Router();

    router.get('/', async (req, res) => {
        try {
            const [courses] = await db.query(`
                SELECT 
                    c.*,
                    c.course_code as code,
                    c.department as category,
                    COUNT(DISTINCT e.id) as enrolled,
                    30 as capacity
                FROM courses c
                LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'enrolled'
                GROUP BY c.id
                ORDER BY c.created_at DESC
            `);
            res.json(courses);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.get('/:id', async (req, res) => {
        try {
            const [courses] = await db.query(`
                SELECT 
                    c.*,
                    c.course_code as code,
                    c.department as category,
                    COUNT(DISTINCT e.id) as enrolled,
                    30 as capacity
                FROM courses c
                LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'enrolled'
                WHERE c.id = ?
                GROUP BY c.id
            `, [req.params.id]);
            if (courses.length === 0) return res.status(404).json({ error: 'Course not found' });
            res.json(courses[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.post('/', async (req, res) => {
        try {
            const { 
                course_code, 
                courseCode,
                code,
                name, 
                description, 
                credits, 
                department,
                category,
                instructor, 
                semester 
            } = req.body;
            
            // Handle both camelCase and snake_case
            const finalCourseCode = course_code || courseCode || code;
            const finalDepartment = department || category;
            
            if (!finalCourseCode || !name) {
                return res.status(400).json({ error: 'Course code and name are required' });
            }
            
            const [result] = await db.query(
                'INSERT INTO courses (course_code, name, description, credits, department, instructor, semester) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [finalCourseCode, name, description || '', credits || 3, finalDepartment || '', instructor || '', semester || 'Fall 2024']
            );
            res.status(201).json({ message: 'Course created successfully', id: result.insertId });
        } catch (error) {
            console.error('Course creation error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    router.put('/:id', async (req, res) => {
        try {
            const { name, description, credits, department, instructor, semester } = req.body;
            await db.query(
                'UPDATE courses SET name = ?, description = ?, credits = ?, department = ?, instructor = ?, semester = ? WHERE id = ?',
                [name, description, credits, department, instructor, semester, req.params.id]
            );
            res.json({ message: 'Course updated successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.delete('/:id', async (req, res) => {
        try {
            await db.query('DELETE FROM courses WHERE id = ?', [req.params.id]);
            res.json({ message: 'Course deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
