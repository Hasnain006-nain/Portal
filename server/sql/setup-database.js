require('dotenv').config();
const mysql = require('mysql2/promise');

async function setupDatabase() {
    try {
        console.log('Setting up database...');
        
        // Connect without database to create it
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            port: process.env.DB_PORT || 3306
        });

        console.log('✓ Connected to MySQL');

        // Create database if it doesn't exist
        const dbName = process.env.DB_NAME || 'studentportal';
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
        console.log(`✓ Database '${dbName}' created/verified`);

        await connection.end();
        console.log('\n✓ Database setup complete!');
        console.log('You can now run: npm start');
        
    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        console.error('\nMake sure:');
        console.error('1. XAMPP MySQL is running');
        console.error('2. MySQL is accessible on port 3306');
        console.error('3. User credentials in .env are correct');
        process.exit(1);
    }
}

setupDatabase();
