require('dotenv').config();
const { initializeDatabase } = require('./config/database');

async function migrateAddNames() {
    try {
        console.log('🔄 Starting migration to add first_name and last_name columns...\n');
        
        const db = await initializeDatabase();
        console.log('✓ Connected to MySQL\n');

        // Check if columns already exist
        const [columns] = await db.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME IN ('first_name', 'last_name')
        `, [process.env.DB_NAME || 'studentportal']);

        if (columns.length === 2) {
            console.log('✓ Columns first_name and last_name already exist. No migration needed.');
            process.exit(0);
        }

        // Add first_name column if it doesn't exist
        if (!columns.find(c => c.COLUMN_NAME === 'first_name')) {
            console.log('Adding first_name column...');
            await db.query(`
                ALTER TABLE users 
                ADD COLUMN first_name VARCHAR(100) AFTER password
            `);
            console.log('✓ Added first_name column');
        }

        // Add last_name column if it doesn't exist
        if (!columns.find(c => c.COLUMN_NAME === 'last_name')) {
            console.log('Adding last_name column...');
            await db.query(`
                ALTER TABLE users 
                ADD COLUMN last_name VARCHAR(100) AFTER first_name
            `);
            console.log('✓ Added last_name column');
        }

        // Populate first_name and last_name from name field
        console.log('\nPopulating first_name and last_name from name field...');
        await db.query(`
            UPDATE users 
            SET 
                first_name = SUBSTRING_INDEX(name, ' ', 1),
                last_name = SUBSTRING_INDEX(name, ' ', -1)
            WHERE first_name IS NULL OR last_name IS NULL
        `);
        console.log('✓ Populated first_name and last_name fields');

        console.log('\n✅ Migration completed successfully!\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrateAddNames();
