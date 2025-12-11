const express = require('express');

module.exports = (db) => {
    const router = express.Router();

    router.get('/', async (req, res) => {
        try {
            const [hostels] = await db.query('SELECT * FROM hostels ORDER BY name');
            // Add default facilities array for frontend compatibility
            const hostelsWithFacilities = hostels.map(hostel => ({
                ...hostel,
                facilities: hostel.facilities || ['WiFi', 'Common Room', 'Security'],
                address: hostel.address || 'Campus',
                phone: hostel.warden_contact || hostel.phone || ''
            }));
            res.json(hostelsWithFacilities);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.get('/:id', async (req, res) => {
        try {
            const [hostels] = await db.query('SELECT * FROM hostels WHERE id = ?', [req.params.id]);
            if (hostels.length === 0) return res.status(404).json({ error: 'Hostel not found' });
            
            // Add default facilities array for frontend compatibility
            const hostel = {
                ...hostels[0],
                facilities: hostels[0].facilities || ['WiFi', 'Common Room', 'Security'],
                address: hostels[0].address || 'Campus',
                phone: hostels[0].warden_contact || hostels[0].phone || ''
            };
            
            res.json(hostel);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.post('/', async (req, res) => {
        try {
            const { 
                name, 
                type, 
                totalRooms, 
                total_rooms,
                warden_name, 
                wardenName,
                warden_contact,
                wardenContact,
                phone,
                address,
                facilities,
                totalFloors,
                floorsData
            } = req.body;
            
            // Handle both camelCase and snake_case
            const hostelType = type || 'mixed';
            const rooms = totalRooms || total_rooms || 0;
            const wardenNameValue = warden_name || wardenName || 'TBD';
            const wardenContactValue = warden_contact || wardenContact || phone || '';
            
            const [result] = await db.query(
                'INSERT INTO hostels (name, type, total_rooms, warden_name, warden_contact) VALUES (?, ?, ?, ?, ?)',
                [name, hostelType, rooms, wardenNameValue, wardenContactValue]
            );
            
            res.status(201).json({ 
                message: 'Hostel created successfully', 
                id: result.insertId 
            });
        } catch (error) {
            console.error('Hostel creation error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    router.put('/:id', async (req, res) => {
        try {
            const { 
                name, 
                type, 
                totalRooms,
                total_rooms, 
                occupied_rooms,
                occupiedRooms,
                warden_name,
                wardenName, 
                warden_contact,
                wardenContact,
                phone
            } = req.body;
            
            // Handle both camelCase and snake_case
            const rooms = totalRooms || total_rooms || 0;
            const occupied = occupiedRooms || occupied_rooms || 0;
            const wardenNameValue = warden_name || wardenName || 'TBD';
            const wardenContactValue = warden_contact || wardenContact || phone || '';
            
            await db.query(
                'UPDATE hostels SET name = ?, type = ?, total_rooms = ?, occupied_rooms = ?, warden_name = ?, warden_contact = ? WHERE id = ?',
                [name, type, rooms, occupied, wardenNameValue, wardenContactValue, req.params.id]
            );
            res.json({ message: 'Hostel updated successfully' });
        } catch (error) {
            console.error('Hostel update error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    router.delete('/:id', async (req, res) => {
        try {
            await db.query('DELETE FROM hostels WHERE id = ?', [req.params.id]);
            res.json({ message: 'Hostel deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
