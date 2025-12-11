const express = require('express');
const router = express.Router();

module.exports = (db) => {
    // Get all services
    router.get('/services', async (req, res) => {
        try {
            const [services] = await db.query(
                'SELECT * FROM services WHERE is_active = TRUE ORDER BY name'
            );
            res.json(services);
        } catch (error) {
            console.error('Error fetching services:', error);
            res.status(500).json({ error: 'Failed to fetch services' });
        }
    });

    // Get available time slots for a service
    router.get('/available-slots', async (req, res) => {
        try {
            const { serviceId, date } = req.query;
            
            if (!serviceId || !date) {
                return res.status(400).json({ error: 'Service ID and date are required' });
            }

            // Get day of week from date
            const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });

            // Get available staff for this service on this day
            const [availability] = await db.query(`
                SELECT sa.*, u.name as staff_name
                FROM staff_availability sa
                JOIN users u ON sa.staff_id = u.id
                WHERE sa.day_of_week = ? AND sa.is_available = TRUE
                ORDER BY sa.start_time
            `, [dayOfWeek]);

            // Get existing appointments for this date
            const [existingAppointments] = await db.query(`
                SELECT appointment_time, staff_id
                FROM appointments
                WHERE service_id = ? AND appointment_date = ? AND status NOT IN ('cancelled', 'rejected')
            `, [serviceId, date]);

            // Generate time slots (9 AM to 5 PM, 30-minute intervals)
            const slots = [];
            for (let hour = 9; hour < 17; hour++) {
                for (let minute = 0; minute < 60; minute += 30) {
                    const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
                    
                    // Check if slot is available
                    const isBooked = existingAppointments.some(apt => apt.appointment_time === time);
                    
                    slots.push({
                        time,
                        available: !isBooked,
                        displayTime: new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                        })
                    });
                }
            }

            res.json(slots);
        } catch (error) {
            console.error('Error fetching available slots:', error);
            res.status(500).json({ error: 'Failed to fetch available slots' });
        }
    });

    // Create new appointment
    router.post('/', async (req, res) => {
        try {
            const { studentId, serviceId, appointmentDate, appointmentTime, notes } = req.body;

            if (!studentId || !serviceId || !appointmentDate || !appointmentTime) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Generate token number
            const date = new Date(appointmentDate);
            const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
            const [countResult] = await db.query(
                'SELECT COUNT(*) as count FROM appointments WHERE appointment_date = ?',
                [appointmentDate]
            );
            const tokenNumber = `APT${dateStr}${(countResult[0].count + 1).toString().padStart(3, '0')}`;

            // Insert appointment
            const [result] = await db.query(`
                INSERT INTO appointments (student_id, service_id, appointment_date, appointment_time, token_number, notes, status)
                VALUES (?, ?, ?, ?, ?, ?, 'pending')
            `, [studentId, serviceId, appointmentDate, appointmentTime, tokenNumber, notes || null]);

            const appointmentId = result.insertId;

            // Create notification for student
            await db.query(`
                INSERT INTO notifications (user_id, title, message, type)
                VALUES (?, ?, ?, 'info')
            `, [
                studentId,
                'Appointment Booked',
                `Your appointment has been booked for ${appointmentDate} at ${appointmentTime}. Token: ${tokenNumber}`
            ]);

            // Create appointment notification
            await db.query(`
                INSERT INTO appointment_notifications (appointment_id, user_id, notification_type, message)
                VALUES (?, ?, 'confirmation', ?)
            `, [
                appointmentId,
                studentId,
                `Appointment confirmed for ${appointmentDate} at ${appointmentTime}. Your token number is ${tokenNumber}.`
            ]);

            // Get the created appointment with student details
            const [appointments] = await db.query(`
                SELECT a.*, s.name as service_name, s.department, u.name as student_name, u.email as student_email
                FROM appointments a
                JOIN services s ON a.service_id = s.id
                JOIN users u ON a.student_id = u.id
                WHERE a.id = ?
            `, [appointmentId]);

            const appointment = appointments[0];

            // Notify all admins about new appointment
            const [admins] = await db.query(`
                SELECT id FROM users WHERE role = 'admin'
            `);

            for (const admin of admins) {
                await db.query(`
                    INSERT INTO notifications (user_id, title, message, type)
                    VALUES (?, ?, ?, 'info')
                `, [
                    admin.id,
                    'New Appointment Request',
                    `${appointment.student_name} requested ${appointment.service_name} on ${appointmentDate} at ${appointmentTime}. Token: ${tokenNumber}`
                ]);
            }

            res.status(201).json(appointment);
        } catch (error) {
            console.error('Error creating appointment:', error);
            res.status(500).json({ error: 'Failed to create appointment' });
        }
    });

    // Get all appointments (admin view)
    router.get('/', async (req, res) => {
        try {
            const { status, date } = req.query;
            
            let query = `
                SELECT a.*, 
                       s.name as service_name, 
                       s.department,
                       u.name as student_name, 
                       u.email as student_email,
                       u.phone as student_phone
                FROM appointments a
                JOIN services s ON a.service_id = s.id
                JOIN users u ON a.student_id = u.id
                WHERE 1=1
            `;
            const params = [];

            if (status) {
                query += ' AND a.status = ?';
                params.push(status);
            }

            if (date) {
                query += ' AND a.appointment_date = ?';
                params.push(date);
            }

            query += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';

            const [appointments] = await db.query(query, params);
            res.json(appointments);
        } catch (error) {
            console.error('Error fetching appointments:', error);
            res.status(500).json({ error: 'Failed to fetch appointments' });
        }
    });

    // Get student's appointments
    router.get('/student/:studentId', async (req, res) => {
        try {
            const { studentId } = req.params;
            
            const [appointments] = await db.query(`
                SELECT a.*, 
                       s.name as service_name, 
                       s.department,
                       s.duration
                FROM appointments a
                JOIN services s ON a.service_id = s.id
                WHERE a.student_id = ?
                ORDER BY a.appointment_date DESC, a.appointment_time DESC
            `, [studentId]);

            res.json(appointments);
        } catch (error) {
            console.error('Error fetching student appointments:', error);
            res.status(500).json({ error: 'Failed to fetch appointments' });
        }
    });

    // Get queue status for today
    router.get('/queue/today', async (req, res) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            
            const [queue] = await db.query(`
                SELECT a.*, 
                       s.name as service_name,
                       u.name as student_name,
                       u.email as student_email
                FROM appointments a
                JOIN services s ON a.service_id = s.id
                JOIN users u ON a.student_id = u.id
                WHERE a.appointment_date = ? AND a.status IN ('approved', 'pending')
                ORDER BY a.appointment_time ASC
            `, [today]);

            // Assign queue positions
            queue.forEach((apt, index) => {
                apt.queue_position = index + 1;
            });

            res.json(queue);
        } catch (error) {
            console.error('Error fetching queue:', error);
            res.status(500).json({ error: 'Failed to fetch queue' });
        }
    });

    // Update appointment status (admin)
    router.patch('/:id/status', async (req, res) => {
        try {
            const { id } = req.params;
            const { status, adminNotes } = req.body;

            if (!status) {
                return res.status(400).json({ error: 'Status is required' });
            }

            // Update appointment
            await db.query(`
                UPDATE appointments 
                SET status = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [status, adminNotes || null, id]);

            // Get appointment details
            const [appointments] = await db.query(`
                SELECT a.*, u.name as student_name, u.email as student_email, s.name as service_name, s.department
                FROM appointments a
                JOIN users u ON a.student_id = u.id
                JOIN services s ON a.service_id = s.id
                WHERE a.id = ?
            `, [id]);

            const appointment = appointments[0];

            // Create notification for student
            let notificationMessage = '';
            switch (status) {
                case 'approved':
                    notificationMessage = `Your appointment for ${appointment.service_name} on ${appointment.appointment_date} has been approved.`;
                    break;
                case 'rejected':
                    notificationMessage = `Your appointment for ${appointment.service_name} on ${appointment.appointment_date} has been rejected.`;
                    break;
                case 'completed':
                    notificationMessage = `Your appointment for ${appointment.service_name} has been completed.`;
                    break;
                case 'cancelled':
                    notificationMessage = `Your appointment for ${appointment.service_name} has been cancelled.`;
                    break;
            }

            await db.query(`
                INSERT INTO notifications (user_id, title, message, type)
                VALUES (?, ?, ?, ?)
            `, [
                appointment.student_id,
                'Appointment Status Update',
                notificationMessage,
                status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'info'
            ]);

            // Create appointment notification
            await db.query(`
                INSERT INTO appointment_notifications (appointment_id, user_id, notification_type, message)
                VALUES (?, ?, 'status_change', ?)
            `, [id, appointment.student_id, notificationMessage]);

            res.json(appointment);
        } catch (error) {
            console.error('Error updating appointment status:', error);
            res.status(500).json({ error: 'Failed to update appointment status' });
        }
    });

    // Cancel appointment (student)
    router.patch('/:id/cancel', async (req, res) => {
        try {
            const { id } = req.params;
            const { studentId } = req.body;

            // Verify appointment belongs to student
            const [appointments] = await db.query(
                'SELECT * FROM appointments WHERE id = ? AND student_id = ?',
                [id, studentId]
            );

            if (appointments.length === 0) {
                return res.status(404).json({ error: 'Appointment not found' });
            }

            // Update status
            await db.query(
                'UPDATE appointments SET status = "cancelled", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [id]
            );

            res.json({ message: 'Appointment cancelled successfully' });
        } catch (error) {
            console.error('Error cancelling appointment:', error);
            res.status(500).json({ error: 'Failed to cancel appointment' });
        }
    });

    // Get appointment statistics (admin)
    router.get('/stats/overview', async (req, res) => {
        try {
            const [stats] = await db.query(`
                SELECT 
                    COUNT(*) as total_appointments,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                    SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                    SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
                    SUM(CASE WHEN appointment_date = CURDATE() THEN 1 ELSE 0 END) as today
                FROM appointments
            `);

            const [serviceStats] = await db.query(`
                SELECT s.name, COUNT(a.id) as count
                FROM services s
                LEFT JOIN appointments a ON s.id = a.service_id
                GROUP BY s.id, s.name
                ORDER BY count DESC
            `);

            res.json({
                overview: stats[0],
                byService: serviceStats
            });
        } catch (error) {
            console.error('Error fetching statistics:', error);
            res.status(500).json({ error: 'Failed to fetch statistics' });
        }
    });

    return router;
};
