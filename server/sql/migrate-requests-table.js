require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrateRequestsTable() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'studentportal',
        port: process.env.DB_PORT || 3306
    });

    try {
        console.log('Starting requests table migration...');

        // Check if columns exist before adding them
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'requests'
        `);

        const existingColumns = columns.map(c => c.COLUMN_NAME);
        console.log('Existing columns:', existingColumns);

        // Drop foreign key constraint if it exists
        console.log('Checking for foreign key constraints...');
        const [constraints] = await connection.query(`
            SELECT CONSTRAINT_NAME 
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'requests' 
            AND COLUMN_NAME = 'student_id'
            AND REFERENCED_TABLE_NAME IS NOT NULL
        `);

        if (constraints.length > 0) {
            const constraintName = constraints[0].CONSTRAINT_NAME;
            console.log(`Dropping foreign key constraint ${constraintName}...`);
            await connection.query(`
                ALTER TABLE requests 
                DROP FOREIGN KEY ${constraintName}
            `);
            console.log('✓ Dropped foreign key constraint');
        }

        // Modify student_id to VARCHAR if it's INT
        if (existingColumns.includes('student_id')) {
            console.log('Modifying student_id column to VARCHAR...');
            await connection.query(`
                ALTER TABLE requests 
                MODIFY COLUMN student_id VARCHAR(255) NOT NULL
            `);
            console.log('✓ Modified student_id column');
        }

        // Add new columns if they don't exist
        const columnsToAdd = [
            { name: 'book_id', type: 'INT' },
            { name: 'book_title', type: 'VARCHAR(255)' },
            { name: 'book_author', type: 'VARCHAR(255)' },
            { name: 'course_id', type: 'INT' },
            { name: 'course_code', type: 'VARCHAR(50)' },
            { name: 'course_name', type: 'VARCHAR(255)' },
            { name: 'borrowing_id', type: 'INT' },
            { name: 'enrollment_id', type: 'INT' },
            { name: 'student_email', type: 'VARCHAR(255)' },
            { name: 'student_name', type: 'VARCHAR(255)' }
        ];

        for (const column of columnsToAdd) {
            if (!existingColumns.includes(column.name)) {
                console.log(`Adding column ${column.name}...`);
                await connection.query(`
                    ALTER TABLE requests 
                    ADD COLUMN ${column.name} ${column.type}
                `);
                console.log(`✓ Added ${column.name} column`);
            } else {
                console.log(`Column ${column.name} already exists, skipping...`);
            }
        }

        // Update type enum to include new types
        console.log('Updating type enum...');
        await connection.query(`
            ALTER TABLE requests 
            MODIFY COLUMN type ENUM('hostel', 'library', 'course', 'other', 'borrow', 'return', 'enroll', 'unenroll', 'new_user') NOT NULL
        `);
        console.log('✓ Updated type enum');

        console.log('\n✓ Migration completed successfully!');
    } catch (error) {
        console.error('Migration error:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

migrateRequestsTable();
