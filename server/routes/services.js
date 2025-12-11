const express = require('express');
const router = express.Router();

module.exports = (db) => {
    // Get all services
    router.get('/', async (req, res) => {
        try {
            const [services] = await db.query(
                'SELECT * FROM services ORDER BY name'
            );
            res.json(services);
        } catch (error) {
            console.error('Error fetching services:', error);
            res.status(500).json({ error: 'Failed to fetch services' });
        }
    });

    // Create service (admin)
    router.post('/', async (req, res) => {
        try {
            const { name, description, duration, department } = req.body;

            if (!name) {
                return res.status(400).json({ error: 'Service name is required' });
            }

            const [result] = await db.query(`
                INSERT INTO services (name, description, duration, department)
                VALUES (?, ?, ?, ?)
            `, [name, description || null, duration || 30, department || null]);

            const [services] = await db.query('SELECT * FROM services WHERE id = ?', [result.insertId]);
            res.status(201).json(services[0]);
        } catch (error) {
            console.error('Error creating service:', error);
            res.status(500).json({ error: 'Failed to create service' });
        }
    });

    // Update service (admin)
    router.put('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { name, description, duration, department, is_active } = req.body;

            await db.query(`
                UPDATE services 
                SET name = ?, description = ?, duration = ?, department = ?, is_active = ?
                WHERE id = ?
            `, [name, description, duration, department, is_active, id]);

            const [services] = await db.query('SELECT * FROM services WHERE id = ?', [id]);
            res.json(services[0]);
        } catch (error) {
            console.error('Error updating service:', error);
            res.status(500).json({ error: 'Failed to update service' });
        }
    });

    // Delete service (admin)
    router.delete('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            await db.query('DELETE FROM services WHERE id = ?', [id]);
            res.json({ message: 'Service deleted successfully' });
        } catch (error) {
            console.error('Error deleting service:', error);
            res.status(500).json({ error: 'Failed to delete service' });
        }
    });

    return router;
};
