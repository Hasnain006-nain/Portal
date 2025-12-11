const express = require('express');

module.exports = (db) => {
    const router = express.Router();

    router.get('/', async (req, res) => {
        try {
            const [enrollments] = await db.query(`
                SELECT e.*, s.name as student_name, s.student_id, c.name as course_name, c.course_code
                FROM enrollments e
                JOIN students s ON e.student_id = s.id
                JOIN courses c ON e.course_id = c.id
                ORDER BY e.created_at DESC
            `);
            res.json(enrollments);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.get('/student/:studentId', async (req, res) => {
        try {
            const [enrollments] = await db.query(`
                SELECT e.*, c.name as course_name, c.course_code, c.credits
                FROM enrollments e
                JOIN courses c ON e.course_id = c.id
                WHERE e.student_id = ?
            `, [req.params.studentId]);
            res.json(enrollments);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.get('/course/:courseCode', async (req, res) => {
        try {
            const [enrollments] = await db.query(`
                SELECT e.*, s.name as student_name, s.student_id, s.email
                FROM enrollments e
                JOIN students s ON e.student_id = s.id
                JOIN courses c ON e.course_id = c.id
                WHERE c.course_code = ?
            `, [req.params.courseCode]);
            res.json(enrollments);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.post('/', async (req, res) => {
        try {
            const { student_id, course_id, enrollment_date, status } = req.body;
            const [result] = await db.query(
                'INSERT INTO enrollments (student_id, course_id, enrollment_date, status) VALUES (?, ?, ?, ?)',
                [student_id, course_id, enrollment_date, status || 'enrolled']
            );
            res.status(201).json({ message: 'Enrollment created successfully', id: result.insertId });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.put('/:id', async (req, res) => {
        try {
            const { grade, status } = req.body;
            await db.query(
                'UPDATE enrollments SET grade = ?, status = ? WHERE id = ?',
                [grade, status, req.params.id]
            );
            res.json({ message: 'Enrollment updated successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.delete('/:id', async (req, res) => {
        try {
            await db.query('DELETE FROM enrollments WHERE id = ?', [req.params.id]);
            res.json({ message: 'Enrollment deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
