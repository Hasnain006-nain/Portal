const express = require('express');

module.exports = (db) => {
    const router = express.Router();

    router.get('/', async (req, res) => {
        try {
            const [rooms] = await db.query(`
                SELECT r.*, h.name as hostel_name, h.type as hostel_type
                FROM rooms r
                JOIN hostels h ON r.hostel_id = h.id
                ORDER BY h.name, r.room_number
            `);
            res.json(rooms);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.get('/:id', async (req, res) => {
        try {
            const [rooms] = await db.query(`
                SELECT r.*, h.name as hostel_name
                FROM rooms r
                JOIN hostels h ON r.hostel_id = h.id
                WHERE r.id = ?
            `, [req.params.id]);
            
            if (rooms.length === 0) return res.status(404).json({ error: 'Room not found' });
            
            // Get residents
            const [residents] = await db.query(`
                SELECT rr.*, s.name, s.student_id, s.email, s.phone
                FROM room_residents rr
                JOIN students s ON rr.student_id = s.id
                WHERE rr.room_id = ? AND rr.status = 'active'
            `, [req.params.id]);
            
            const room = rooms[0];
            room.residents = residents;
            
            res.json(room);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.get('/hostel/:hostelId', async (req, res) => {
        try {
            const [rooms] = await db.query('SELECT * FROM rooms WHERE hostel_id = ? ORDER BY room_number', [req.params.hostelId]);
            res.json(rooms);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.post('/', async (req, res) => {
        try {
            const { hostel_id, hostelId, room_number, roomNumber, floor, capacity, status } = req.body;
            
            // Handle both camelCase and snake_case
            const finalHostelId = hostel_id || hostelId;
            const finalRoomNumber = room_number || roomNumber;
            
            if (!finalHostelId || !finalRoomNumber) {
                return res.status(400).json({ error: 'Hostel ID and room number are required' });
            }
            
            const [result] = await db.query(
                'INSERT INTO rooms (hostel_id, room_number, floor, capacity, occupied, status) VALUES (?, ?, ?, ?, ?, ?)',
                [finalHostelId, finalRoomNumber, floor || 1, capacity || 2, 0, status || 'available']
            );
            
            // Update hostel's total rooms count
            await db.query(
                'UPDATE hostels SET total_rooms = total_rooms + 1 WHERE id = ?',
                [finalHostelId]
            );
            
            res.status(201).json({ message: 'Room created successfully', id: result.insertId });
        } catch (error) {
            console.error('Room creation error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // Bulk create rooms for a hostel
    router.post('/bulk', async (req, res) => {
        try {
            const { hostel_id, floor, room_count, capacity } = req.body;
            
            if (!hostel_id || !floor || !room_count) {
                return res.status(400).json({ error: 'Hostel ID, floor, and room count are required' });
            }
            
            const roomsCreated = [];
            
            for (let i = 1; i <= room_count; i++) {
                const roomNumber = `${floor}${i.toString().padStart(2, '0')}`;
                
                const [result] = await db.query(
                    'INSERT INTO rooms (hostel_id, room_number, floor, capacity, occupied, status) VALUES (?, ?, ?, ?, ?, ?)',
                    [hostel_id, roomNumber, floor, capacity || 2, 0, 'available']
                );
                
                roomsCreated.push({ id: result.insertId, roomNumber });
            }
            
            // Update hostel's total rooms count
            await db.query(
                'UPDATE hostels SET total_rooms = total_rooms + ? WHERE id = ?',
                [room_count, hostel_id]
            );
            
            res.status(201).json({ 
                message: `${room_count} rooms created successfully`, 
                rooms: roomsCreated 
            });
        } catch (error) {
            console.error('Bulk room creation error:', error);
            res.status(500).json({ error: error.message });
        }
    });

    router.put('/:id', async (req, res) => {
        try {
            const { room_number, floor, capacity, occupied, status } = req.body;
            await db.query(
                'UPDATE rooms SET room_number = ?, floor = ?, capacity = ?, occupied = ?, status = ? WHERE id = ?',
                [room_number, floor, capacity, occupied, status, req.params.id]
            );
            res.json({ message: 'Room updated successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.delete('/:id', async (req, res) => {
        try {
            await db.query('DELETE FROM rooms WHERE id = ?', [req.params.id]);
            res.json({ message: 'Room deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Add resident to room
    router.post('/:id/residents', async (req, res) => {
        try {
            const { student_id, check_in_date } = req.body;
            const [result] = await db.query(
                'INSERT INTO room_residents (room_id, student_id, check_in_date, status) VALUES (?, ?, ?, ?)',
                [req.params.id, student_id, check_in_date, 'active']
            );
            
            // Update room occupied count
            await db.query('UPDATE rooms SET occupied = occupied + 1 WHERE id = ?', [req.params.id]);
            
            res.status(201).json({ message: 'Resident added successfully', id: result.insertId });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Remove resident from room
    router.delete('/:id/residents/:residentId', async (req, res) => {
        try {
            await db.query(
                'UPDATE room_residents SET status = ?, check_out_date = CURDATE() WHERE id = ?',
                ['checked_out', req.params.residentId]
            );
            
            // Update room occupied count
            await db.query('UPDATE rooms SET occupied = occupied - 1 WHERE id = ?', [req.params.id]);
            
            res.json({ message: 'Resident removed successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
