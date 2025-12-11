require('dotenv').config();
const { createPool } = require('./config/database');

async function seedAppointments() {
    const pool = await createPool();
    
    try {
        console.log('Seeding appointment system data...');

        // Insert sample services
        const services = [
            { name: 'Academic Counseling', description: 'Meet with academic advisors for course planning and guidance', duration: 30, department: 'Academic Affairs' },
            { name: 'Career Guidance', description: 'Career counseling and job placement assistance', duration: 45, department: 'Career Services' },
            { name: 'Financial Aid Consultation', description: 'Discuss scholarships, loans, and financial assistance', duration: 30, department: 'Financial Aid' },
            { name: 'Health Services', description: 'General health checkup and medical consultation', duration: 20, department: 'Health Center' },
            { name: 'Library Assistance', description: 'Research help and library resource guidance', duration: 30, department: 'Library' },
            { name: 'IT Support', description: 'Technical support for student accounts and systems', duration: 15, department: 'IT Services' },
            { name: 'Hostel Allocation', description: 'Hostel room allocation and accommodation queries', duration: 20, department: 'Hostel Management' },
            { name: 'Document Verification', description: 'Verification of academic documents and certificates', duration: 15, department: 'Administration' }
        ];

        for (const service of services) {
            await pool.query(`
                INSERT INTO services (name, description, duration, department, is_active)
                VALUES (?, ?, ?, ?, TRUE)
                ON DUPLICATE KEY UPDATE name = name
            `, [service.name, service.description, service.duration, service.department]);
        }

        console.log('✓ Services seeded successfully');

        // Get admin and student users for sample appointments
        const [users] = await pool.query(`
            SELECT id, role FROM users WHERE role IN ('admin', 'student') LIMIT 5
        `);

        const [serviceIds] = await pool.query('SELECT id FROM services LIMIT 3');

        if (users.length > 0 && serviceIds.length > 0) {
            // Create sample appointments
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const students = users.filter(u => u.role === 'student');
            
            if (students.length > 0) {
                // Sample appointment 1 - Pending
                await pool.query(`
                    INSERT INTO appointments (student_id, service_id, appointment_date, appointment_time, token_number, status, notes)
                    VALUES (?, ?, ?, '10:00:00', ?, 'pending', 'Need help with course selection for next semester')
                    ON DUPLICATE KEY UPDATE token_number = token_number
                `, [students[0].id, serviceIds[0].id, tomorrow.toISOString().split('T')[0], `APT${tomorrow.toISOString().split('T')[0].replace(/-/g, '')}001`]);

                // Sample appointment 2 - Approved
                if (students.length > 1) {
                    await pool.query(`
                        INSERT INTO appointments (student_id, service_id, appointment_date, appointment_time, token_number, status, notes)
                        VALUES (?, ?, ?, '11:00:00', ?, 'approved', 'Career counseling session')
                        ON DUPLICATE KEY UPDATE token_number = token_number
                    `, [students[1].id, serviceIds[1] ? serviceIds[1].id : serviceIds[0].id, tomorrow.toISOString().split('T')[0], `APT${tomorrow.toISOString().split('T')[0].replace(/-/g, '')}002`]);
                }

                console.log('✓ Sample appointments created');
            }
        }

        console.log('\n✓ Appointment system seeded successfully!');
        console.log('\nAvailable Services:');
        services.forEach(s => console.log(`  - ${s.name} (${s.department})`));

    } catch (error) {
        console.error('Error seeding appointments:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

seedAppointments()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
