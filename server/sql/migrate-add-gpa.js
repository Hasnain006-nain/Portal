require('dotenv').config();
const { initializeDatabase } = require('./config/database');

async function addGpaColumn() {
    try {
        console.log('🔄 Adding GPA column to students table...\n');
        
        const db = await initializeDatabase();
        console.log('✓ Connected to MySQL\n');

        // Check if column already exists
        const [columns] = await db.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'students' AND COLUMN_NAME = 'gpa'
        `, [process.env.DB_NAME || 'studentportal']);

        if (columns.length > 0) {
            console.log('✓ GPA column already exists\n');
        } else {
            // Add GPA column
            await db.query(`
                ALTER TABLE students 
                ADD COLUMN gpa DECIMAL(3,2) AFTER year
            `);
            console.log('✓ GPA column added successfully\n');
        }

        console.log('✅ Migration completed!\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

addGpaColumn();
