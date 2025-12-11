const express = require('express');

module.exports = (db) => {
    const router = express.Router();

    router.get('/', async (req, res) => {
        try {
            const userId = req.query.user_id;
            
            let query = `
                SELECT a.*, u.name as created_by_name
            `;
            
            // If user_id provided, check if they've read it
            if (userId) {
                query += `, 
                    CASE WHEN ar.user_id IS NOT NULL THEN 1 ELSE 0 END as is_read
                `;
            }
            
            query += `
                FROM announcements a
                LEFT JOIN users u ON a.created_by = u.id
            `;
            
            if (userId) {
                query += `
                    LEFT JOIN announcement_reads ar ON a.id = ar.announcement_id AND ar.user_id = ?
                `;
            }
            
            query += ` ORDER BY a.created_at DESC`;
            
            const [announcements] = userId 
                ? await db.query(query, [userId])
                : await db.query(query);
                
            res.json(announcements);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.get('/:id', async (req, res) => {
        try {
            const [announcements] = await db.query(`
                SELECT a.*, u.name as created_by_name
                FROM announcements a
                LEFT JOIN users u ON a.created_by = u.id
                WHERE a.id = ?
            `, [req.params.id]);
            if (announcements.length === 0) return res.status(404).json({ error: 'Announcement not found' });
            res.json(announcements[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.get('/type/:type', async (req, res) => {
        try {
            const [announcements] = await db.query(
                'SELECT * FROM announcements WHERE type = ? ORDER BY created_at DESC',
                [req.params.type]
            );
            res.json(announcements);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.post('/', async (req, res) => {
        try {
            const { title, content, type, priority, created_by } = req.body;
            const [result] = await db.query(
                'INSERT INTO announcements (title, content, type, priority, created_by) VALUES (?, ?, ?, ?, ?)',
                [title, content, type || 'general', priority || 'medium', created_by]
            );
            
            // Create notifications for all students
            try {
                console.log('🔍 Fetching students for notifications...');
                const [students] = await db.query('SELECT id, email, name FROM users WHERE role = ?', ['student']);
                console.log(`📊 Found ${students.length} students`);
                
                if (students.length > 0) {
                    // Determine notification type based on priority
                    const notificationType = priority === 'high' ? 'warning' : 'info';
                    
                    // Create professional notification message
                    const priorityEmoji = priority === 'high' ? '🔴 ' : priority === 'medium' ? '🟡 ' : '🟢 ';
                    const typeLabel = type === 'academic' ? '📚 Academic' : 
                                     type === 'hostel' ? '🏠 Hostel' : 
                                     type === 'library' ? '📖 Library' : 
                                     type === 'students' ? '👥 Students' : 
                                     '📢 General';
                    
                    const notificationValues = students.map(student => [
                        student.id,
                        `${priorityEmoji}New ${typeLabel} Announcement`,
                        title,
                        notificationType,
                        false
                    ]);
                    
                    console.log('💾 Inserting notifications into database...');
                    const [insertResult] = await db.query(
                        'INSERT INTO notifications (user_id, title, message, type, is_read) VALUES ?',
                        [notificationValues]
                    );
                    
                    console.log(`✅ Successfully created ${insertResult.affectedRows} notifications for announcement: ${title}`);
                } else {
                    console.log('⚠️ No students found to notify');
                }
            } catch (notifError) {
                console.error('❌ Failed to create notifications:', notifError);
                console.error('Error details:', notifError.message);
                // Don't fail the announcement creation if notifications fail
            }
            
            res.status(201).json({ 
                message: 'Announcement created successfully', 
                id: result.insertId,
                notificationsCreated: true
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.put('/:id', async (req, res) => {
        try {
            const { title, content, type, priority } = req.body;
            
            // Update announcement
            await db.query(
                'UPDATE announcements SET title = ?, content = ?, type = ?, priority = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [title, content, type, priority, req.params.id]
            );
            
            // Clear all read statuses - make it unread for everyone
            await db.query('DELETE FROM announcement_reads WHERE announcement_id = ?', [req.params.id]);
            
            // Create notifications for all students about the update
            try {
                console.log('🔍 Fetching students for update notifications...');
                const [students] = await db.query('SELECT id, email, name FROM users WHERE role = ?', ['student']);
                console.log(`📊 Found ${students.length} students`);
                
                if (students.length > 0) {
                    // Determine notification type based on priority
                    const notificationType = priority === 'high' ? 'warning' : 'info';
                    
                    // Create professional notification message
                    const priorityEmoji = priority === 'high' ? '🔴 ' : priority === 'medium' ? '🟡 ' : '🟢 ';
                    const typeLabel = type === 'academic' ? '📚 Academic' : 
                                     type === 'hostel' ? '🏠 Hostel' : 
                                     type === 'library' ? '📖 Library' : 
                                     type === 'students' ? '👥 Students' : 
                                     '📢 General';
                    
                    const notificationValues = students.map(student => [
                        student.id,
                        `${priorityEmoji}Updated ${typeLabel} Announcement`,
                        title,
                        notificationType,
                        false
                    ]);
                    
                    console.log('💾 Inserting update notifications into database...');
                    const [insertResult] = await db.query(
                        'INSERT INTO notifications (user_id, title, message, type, is_read) VALUES ?',
                        [notificationValues]
                    );
                    
                    console.log(`✅ Successfully created ${insertResult.affectedRows} notifications for updated announcement: ${title}`);
                } else {
                    console.log('⚠️ No students found to notify');
                }
            } catch (notifError) {
                console.error('❌ Failed to create notifications:', notifError);
                console.error('Error details:', notifError.message);
            }
            
            res.json({ 
                message: 'Announcement updated successfully. All users will see it as unread.',
                unreadReset: true,
                notificationsCreated: true
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.delete('/:id', async (req, res) => {
        try {
            // Delete announcement (reads will be deleted automatically due to CASCADE)
            await db.query('DELETE FROM announcements WHERE id = ?', [req.params.id]);
            res.json({ message: 'Announcement deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Mark announcement as read
    router.post('/:id/read', async (req, res) => {
        try {
            const { user_id } = req.body;
            
            if (!user_id) {
                return res.status(400).json({ error: 'User ID required' });
            }
            
            // Insert or ignore if already read
            await db.query(
                'INSERT IGNORE INTO announcement_reads (announcement_id, user_id) VALUES (?, ?)',
                [req.params.id, user_id]
            );
            
            res.json({ message: 'Announcement marked as read' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Get unread count for user
    router.get('/unread/count', async (req, res) => {
        try {
            const userId = req.query.user_id;
            
            if (!userId) {
                return res.status(400).json({ error: 'User ID required' });
            }
            
            const [result] = await db.query(`
                SELECT COUNT(*) as unread_count
                FROM announcements a
                LEFT JOIN announcement_reads ar ON a.id = ar.announcement_id AND ar.user_id = ?
                WHERE ar.user_id IS NULL
            `, [userId]);
            
            res.json({ unread_count: result[0].unread_count });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Get unread announcements for user
    router.get('/unread/list', async (req, res) => {
        try {
            const userId = req.query.user_id;
            
            if (!userId) {
                return res.status(400).json({ error: 'User ID required' });
            }
            
            const [announcements] = await db.query(`
                SELECT a.*, u.name as created_by_name
                FROM announcements a
                LEFT JOIN users u ON a.created_by = u.id
                LEFT JOIN announcement_reads ar ON a.id = ar.announcement_id AND ar.user_id = ?
                WHERE ar.user_id IS NULL
                ORDER BY a.created_at DESC
            `, [userId]);
            
            res.json(announcements);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Debug endpoint to check notification creation
    router.get('/debug/check-students', async (req, res) => {
        try {
            const [students] = await db.query('SELECT id, email, name, role FROM users WHERE role = ?', ['student']);
            const [allUsers] = await db.query('SELECT id, email, name, role FROM users');
            const [notifications] = await db.query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10');
            
            res.json({
                studentsFound: students.length,
                students: students,
                allUsers: allUsers,
                recentNotifications: notifications
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
