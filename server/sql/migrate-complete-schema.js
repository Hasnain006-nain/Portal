require('dotenv').config();
const { initializeDatabase } = require('./config/database');

async function migrateCompleteSchema() {
    try {
        console.log('🔄 Starting migration to add missing columns to users table...\n');
        
        const db = await initializeDatabase();
        console.log('✓ Connected to MySQL\n');

        // Get existing columns
        const [existingCols] = await db.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
        `, [process.env.DB_NAME || 'studentportal']);

        const existingColumns = existingCols.map(c => c.COLUMN_NAME);
        console.log('Existing columns:', existingColumns.join(', '), '\n');

        // Define columns to add
        const columnsToAdd = [
            { name: 'phone', definition: 'VARCHAR(20) AFTER role' },
            { name: 'department', definition: 'VARCHAR(100) AFTER phone' },
            { name: 'year', definition: 'INT AFTER department' },
            { name: 'hostel_id', definition: 'INT AFTER year' },
            { name: 'room_id', definition: 'INT AFTER hostel_id' },
            { name: 'approved', definition: 'BOOLEAN DEFAULT FALSE AFTER room_id' }
        ];

        // Add missing columns
        for (const col of columnsToAdd) {
            if (!existingColumns.includes(col.name)) {
                console.log(`Adding ${col.name} column...`);
                await db.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.definition}`);
                console.log(`✓ Added ${col.name} column`);
            } else {
                console.log(`✓ Column ${col.name} already exists`);
            }
        }

        // Update approved status for existing users (admin, teacher, student should be approved)
        console.log('\nUpdating approved status for existing users...');
        await db.query(`
            UPDATE users 
            SET approved = TRUE 
            WHERE role IN ('admin', 'teacher', 'student') AND approved IS NULL
        `);
        console.log('✓ Updated approved status');

        console.log('\n✅ Migration completed successfully!\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrateCompleteSchema();
