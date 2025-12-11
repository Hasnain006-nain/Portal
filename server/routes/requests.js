const express = require('express');

module.exports = (db) => {
    const router = express.Router();

    router.get('/', async (req, res) => {
        try {
            const [requests] = await db.query(`
                SELECT r.*, s.name as student_name, s.student_id, s.email
                FROM requests r
                LEFT JOIN students s ON (r.student_id = s.id OR r.student_id = s.email)
                ORDER BY r.created_at DESC
            `);
            res.json(requests);
        } catch (error) {
            console.error('Get requests error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    router.get('/pending', async (req, res) => {
        try {
            const [requests] = await db.query(`
                SELECT r.*, s.name as student_name, s.student_id, s.email
                FROM requests r
                LEFT JOIN students s ON (r.student_id = s.id OR r.student_id = s.email)
                WHERE r.status = 'pending'
                ORDER BY r.created_at DESC
            `);
            res.json(requests);
        } catch (error) {
            console.error('Get pending requests error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    router.get('/student/:studentId', async (req, res) => {
        try {
            // studentId can be email or actual student ID
            const [requests] = await db.query(
                'SELECT * FROM requests WHERE student_id = ? OR student_email = ? ORDER BY created_at DESC',
                [req.params.studentId, req.params.studentId]
            );
            res.json(requests);
        } catch (error) {
            console.error('Get student requests error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    router.post('/', async (req, res) => {
        try {
            // Map frontend field names to database column names
            const requestData = {
                student_id: req.body.student_id || req.body.studentId || req.body.studentEmail || req.body.student_email,
                type: req.body.type,
                title: req.body.title || `${req.body.type} request`,
                description: req.body.description || '',
                book_id: req.body.book_id || req.body.bookId,
                book_title: req.body.book_title || req.body.bookTitle,
                book_author: req.body.book_author || req.body.bookAuthor,
                course_id: req.body.course_id || req.body.courseId,
                course_code: req.body.course_code || req.body.courseCode,
                course_name: req.body.course_name || req.body.courseName,
                borrowing_id: req.body.borrowing_id || req.body.borrowingId,
                enrollment_id: req.body.enrollment_id || req.body.enrollmentId,
                student_email: req.body.student_email || req.body.studentEmail,
                student_name: req.body.student_name || req.body.studentName
            };
            
            const [result] = await db.query(
                `INSERT INTO requests (
                    student_id, type, title, description, status,
                    book_id, book_title, book_author,
                    course_id, course_code, course_name,
                    borrowing_id, enrollment_id,
                    student_email, student_name
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    requestData.student_id, 
                    requestData.type, 
                    requestData.title, 
                    requestData.description, 
                    'pending',
                    requestData.book_id || null,
                    requestData.book_title || null,
                    requestData.book_author || null,
                    requestData.course_id || null,
                    requestData.course_code || null,
                    requestData.course_name || null,
                    requestData.borrowing_id || null,
                    requestData.enrollment_id || null,
                    requestData.student_email || null,
                    requestData.student_name || null
                ]
            );
            res.status(201).json({ message: 'Request created successfully', id: result.insertId });
        } catch (error) {
            console.error('Create request error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Approve course enrollment request and create enrollment
    router.post('/:id/approve-enrollment', async (req, res) => {
        try {
            const { course_id } = req.body;
            
            // Get request details
            const [requests] = await db.query('SELECT * FROM requests WHERE id = ?', [req.params.id]);
            if (requests.length === 0) {
                return res.status(404).json({ error: 'Request not found' });
            }
            
            const request = requests[0];
            
            // Create enrollment
            const enrollmentDate = new Date().toISOString().split('T')[0];
            await db.query(
                'INSERT INTO enrollments (student_id, course_id, enrollment_date, status) VALUES (?, ?, ?, ?)',
                [request.student_id, course_id, enrollmentDate, 'enrolled']
            );
            
            // Delete the request
            await db.query('DELETE FROM requests WHERE id = ?', [req.params.id]);
            
            res.json({ message: 'Enrollment approved and created successfully' });
        } catch (error) {
            console.error('Enrollment approval error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    router.put('/:id/status', async (req, res) => {
        try {
            const { status, admin_note } = req.body;
            
            // Get request details before processing
            const [requests] = await db.query('SELECT * FROM requests WHERE id = ?', [req.params.id]);
            if (requests.length === 0) {
                return res.status(404).json({ error: 'Request not found' });
            }
            
            const request = requests[0];
            
            // Get student user ID for notification
            const [students] = await db.query(
                'SELECT u.id as user_id FROM users u WHERE u.email = ?',
                [request.student_email || request.student_id]
            );
            
            const userId = students.length > 0 ? students[0].user_id : null;
            
            // If approved, handle based on request type
            if (status === 'approved') {
                let notificationMessage = '';
                
                // Handle course enrollment requests
                if (request.type === 'enroll' && request.course_code) {
                    // Find course
                    const [courses] = await db.query(
                        'SELECT id FROM courses WHERE course_code = ?',
                        [request.course_code]
                    );
                    
                    if (courses.length > 0) {
                        // Find student by email
                        const [studentRecords] = await db.query(
                            'SELECT id FROM students WHERE email = ?',
                            [request.student_email || request.student_id]
                        );
                        
                        if (studentRecords.length > 0) {
                            // Create enrollment
                            const enrollmentDate = new Date().toISOString().split('T')[0];
                            await db.query(
                                'INSERT INTO enrollments (student_id, course_id, enrollment_date, status) VALUES (?, ?, ?, ?)',
                                [studentRecords[0].id, courses[0].id, enrollmentDate, 'enrolled']
                            );
                            notificationMessage = `Your enrollment request for ${request.course_name || request.course_code} has been approved!`;
                        }
                    }
                }
                
                // Handle book borrow requests
                if (request.type === 'borrow' && request.book_id) {
                    notificationMessage = `Your request to borrow "${request.book_title}" has been approved!`;
                    
                    // Update book availability
                    await db.query(
                        'UPDATE books SET available_copies = available_copies - 1 WHERE id = ? AND available_copies > 0',
                        [request.book_id]
                    );
                }
                
                // Handle unenroll requests
                if (request.type === 'unenroll' && request.enrollment_id) {
                    await db.query('DELETE FROM enrollments WHERE id = ?', [request.enrollment_id]);
                    notificationMessage = `Your unenrollment request for ${request.course_name || request.course_code} has been approved.`;
                }
                
                // Handle return requests
                if (request.type === 'return' && request.book_id) {
                    notificationMessage = `Your book return for "${request.book_title}" has been approved. Thank you!`;
                    
                    // Update book availability
                    await db.query(
                        'UPDATE books SET available_copies = available_copies + 1 WHERE id = ?',
                        [request.book_id]
                    );
                }
                
                // Create notification for student
                if (userId && notificationMessage) {
                    await db.query(
                        'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
                        [userId, 'Request Approved', notificationMessage, 'success']
                    );
                }
                
                // Delete the request after approval
                await db.query('DELETE FROM requests WHERE id = ?', [req.params.id]);
                
                // Trigger notification event
                if (notificationMessage) {
                    console.log(`✓ Notification sent to user ${userId}: ${notificationMessage}`);
                }
                
                res.json({ 
                    message: `Request approved and removed from list`,
                    notificationSent: !!notificationMessage
                });
            } else if (status === 'rejected') {
                // Create rejection notification
                let notificationMessage = '';
                
                if (request.type === 'enroll') {
                    notificationMessage = `Your enrollment request for ${request.course_name || request.course_code} has been rejected.`;
                } else if (request.type === 'borrow') {
                    notificationMessage = `Your request to borrow "${request.book_title}" has been rejected.`;
                } else if (request.type === 'unenroll') {
                    notificationMessage = `Your unenrollment request has been rejected.`;
                } else if (request.type === 'return') {
                    notificationMessage = `Your book return request has been rejected.`;
                }
                
                if (admin_note) {
                    notificationMessage += ` Reason: ${admin_note}`;
                }
                
                // Create notification for student
                if (userId && notificationMessage) {
                    await db.query(
                        'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
                        [userId, 'Request Rejected', notificationMessage, 'error']
                    );
                }
                
                // Delete the request after rejection
                await db.query('DELETE FROM requests WHERE id = ?', [req.params.id]);
                res.json({ 
                    message: `Request rejected and removed from list`,
                    notificationSent: !!notificationMessage
                });
            } else {
                // For other statuses, just update
                await db.query(
                    'UPDATE requests SET status = ?, admin_note = ? WHERE id = ?',
                    [status, admin_note, req.params.id]
                );
                res.json({ message: 'Request status updated successfully' });
            }
        } catch (error) {
            console.error('Request status update error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    router.delete('/:id', async (req, res) => {
        try {
            await db.query('DELETE FROM requests WHERE id = ?', [req.params.id]);
            res.json({ message: 'Request deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
