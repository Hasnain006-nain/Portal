const express = require('express');

module.exports = (db) => {
    const router = express.Router();

    // Get notifications for a specific user
    router.get('/user/:userId', async (req, res) => {
        try {
            const [notifications] = await db.query(
                'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
                [req.params.userId]
            );
            res.json(notifications);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Get notifications by email
    router.get('/email/:email', async (req, res) => {
        try {
            const [users] = await db.query('SELECT id FROM users WHERE email = ?', [req.params.email]);
            if (users.length === 0) {
                return res.json([]);
            }
            
            const [notifications] = await db.query(
                'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
                [users[0].id]
            );
            res.json(notifications);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.get('/', async (req, res) => {
        try {
            const [notifications] = await db.query('SELECT * FROM notifications ORDER BY created_at DESC');
            res.json(notifications);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.get('/unread', async (req, res) => {
        try {
            const [notifications] = await db.query(
                'SELECT * FROM notifications WHERE is_read = FALSE ORDER BY created_at DESC'
            );
            res.json(notifications);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.get('/unread/count/:email', async (req, res) => {
        try {
            const [users] = await db.query('SELECT id FROM users WHERE email = ?', [req.params.email]);
            if (users.length === 0) {
                return res.json({ count: 0 });
            }
            
            const [result] = await db.query(
                'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
                [users[0].id]
            );
            res.json({ count: result[0].count });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.put('/:id/read', async (req, res) => {
        try {
            await db.query('UPDATE notifications SET is_read = TRUE WHERE id = ?', [req.params.id]);
            res.json({ message: 'Notification marked as read' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.put('/read-all', async (req, res) => {
        try {
            await db.query('UPDATE notifications SET is_read = TRUE WHERE is_read = FALSE');
            res.json({ message: 'All notifications marked as read' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.delete('/:id', async (req, res) => {
        try {
            await db.query('DELETE FROM notifications WHERE id = ?', [req.params.id]);
            res.json({ message: 'Notification deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
