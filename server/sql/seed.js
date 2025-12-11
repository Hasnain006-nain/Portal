require('dotenv').config();
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function seedDatabase() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        const db = client.db();

        // Clear existing data
        await db.collection('users').deleteMany({});
        await db.collection('hostels').deleteMany({});
        await db.collection('rooms').deleteMany({});
        await db.collection('books').deleteMany({});
        await db.collection('courses').deleteMany({});
        await db.collection('students').deleteMany({});
        await db.collection('enrollments').deleteMany({});

        console.log('Cleared existing data');

        // Create admin user
        const adminPassword = await bcrypt.hash('admin123', 10);
        await db.collection('users').insertOne({
            email: 'admin@university.edu',
            password: adminPassword,
            name: 'Admin User',
            role: 'admin',
            createdAt: new Date()
        });

        // Create student user
        const studentPassword = await bcrypt.hash('student123', 10);
        await db.collection('users').insertOne({
            email: 'john.doe@university.edu',
            password: studentPassword,
            name: 'John Doe',
            role: 'student',
            createdAt: new Date()
        });

        console.log('✓ Created users');

        // Seed hostels
        const hostels = [
            { name: 'North Hall', totalRooms: 50, facilities: ['WiFi', 'Gym', 'Cafeteria'], address: '123 Campus Road' },
            { name: 'South Hall', totalRooms: 45, facilities: ['WiFi', 'Library', 'Laundry'], address: '456 Campus Road' },
            { name: 'East Wing', totalRooms: 40, facilities: ['WiFi', 'Study Room'], address: '789 Campus Road' }
        ];
        const hostelResult = await db.collection('hostels').insertMany(hostels);
        console.log('✓ Created hostels');

        // Get hostel IDs
        const hostelIds = Object.values(hostelResult.insertedIds);
        const southHallId = hostelIds[1]; // South Hall

        // Seed rooms for South Hall
        const rooms = [
            {
                hostelId: southHallId.toString(),
                hostelName: 'South Hall',
                roomNumber: '101',
                floor: 1,
                capacity: 4,
                residents: [
                    { _id: new Date().getTime().toString() + '1', name: 'Alice Johnson', studentId: 'STU2024001', email: 'alice@university.edu', phone: '+1234567890', addedAt: new Date() },
                    { _id: new Date().getTime().toString() + '2', name: 'Bob Smith', studentId: 'STU2024002', email: 'bob@university.edu', phone: '+1234567891', addedAt: new Date() },
                    { _id: new Date().getTime().toString() + '3', name: 'Carol White', studentId: 'STU2024003', email: 'carol@university.edu', phone: '+1234567892', addedAt: new Date() },
                    { _id: new Date().getTime().toString() + '4', name: 'David Brown', studentId: 'STU2024004', email: 'david@university.edu', phone: '+1234567893', addedAt: new Date() }
                ],
                warnings: [
                    { title: 'Noise Complaint', description: 'Excessive noise reported after 10 PM', severity: 'Warning', issuedBy: 'Warden Smith', createdAt: new Date('2024-01-15') }
                ],
                lastChecked: new Date('2024-02-01'),
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                hostelId: southHallId.toString(),
                hostelName: 'South Hall',
                roomNumber: '102',
                floor: 1,
                capacity: 4,
                residents: [
                    { _id: new Date().getTime().toString() + '5', name: 'Emma Davis', studentId: 'STU2024005', email: 'emma@university.edu', phone: '+1234567894', addedAt: new Date() },
                    { _id: new Date().getTime().toString() + '6', name: 'Frank Miller', studentId: 'STU2024006', email: 'frank@university.edu', phone: '+1234567895', addedAt: new Date() }
                ],
                warnings: [],
                lastChecked: new Date('2024-02-05'),
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                hostelId: southHallId.toString(),
                hostelName: 'South Hall',
                roomNumber: '103',
                floor: 1,
                capacity: 4,
                residents: [],
                warnings: [],
                lastChecked: new Date('2024-02-10'),
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                hostelId: southHallId.toString(),
                hostelName: 'South Hall',
                roomNumber: '201',
                floor: 2,
                capacity: 4,
                residents: [
                    { _id: new Date().getTime().toString() + '7', name: 'Grace Lee', studentId: 'STU2024007', email: 'grace@university.edu', phone: '+1234567896', addedAt: new Date() },
                    { _id: new Date().getTime().toString() + '8', name: 'Henry Wilson', studentId: 'STU2024008', email: 'henry@university.edu', phone: '+1234567897', addedAt: new Date() },
                    { _id: new Date().getTime().toString() + '9', name: 'Ivy Martinez', studentId: 'STU2024009', email: 'ivy@university.edu', phone: '+1234567898', addedAt: new Date() }
                ],
                warnings: [],
                lastChecked: new Date('2024-02-08'),
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                hostelId: southHallId.toString(),
                hostelName: 'South Hall',
                roomNumber: '202',
                floor: 2,
                capacity: 4,
                residents: [],
                warnings: [],
                lastChecked: new Date('2024-02-12'),
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];
        await db.collection('rooms').insertMany(rooms);
        console.log('✓ Created rooms');

        // Seed books
        const books = [
            { title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', isbn: '978-0262033848', available: 5, total: 10, category: 'Computer Science' },
            { title: 'Clean Code', author: 'Robert C. Martin', isbn: '978-0132350884', available: 3, total: 8, category: 'Software Engineering' },
            { title: 'Design Patterns', author: 'Gang of Four', isbn: '978-0201633610', available: 4, total: 6, category: 'Software Engineering' }
        ];
        await db.collection('books').insertMany(books);
        console.log('✓ Created books');

        // Seed courses with faculty categories and course types
        const courses = [
            // Science Faculty
            { code: 'SCI101', name: 'General Physics', credits: 4, instructor: 'Dr. Smith', semester: 'Fall 2024', enrolled: 45, capacity: 50, category: 'science', courseType: 'major' },
            { code: 'SCI201', name: 'Organic Chemistry', credits: 4, instructor: 'Dr. Johnson', semester: 'Fall 2024', enrolled: 40, capacity: 45, category: 'science', courseType: 'major' },
            { code: 'SCI301', name: 'Molecular Biology', credits: 3, instructor: 'Dr. Williams', semester: 'Fall 2024', enrolled: 35, capacity: 40, category: 'science', courseType: 'minor' },

            // Economics Faculty
            { code: 'ECO101', name: 'Microeconomics', credits: 3, instructor: 'Prof. Anderson', semester: 'Fall 2024', enrolled: 50, capacity: 60, category: 'economics', courseType: 'major' },
            { code: 'ECO201', name: 'Macroeconomics', credits: 3, instructor: 'Prof. Taylor', semester: 'Fall 2024', enrolled: 48, capacity: 60, category: 'economics', courseType: 'major' },
            { code: 'ECO301', name: 'International Trade', credits: 4, instructor: 'Dr. Martinez', semester: 'Fall 2024', enrolled: 30, capacity: 40, category: 'economics', courseType: 'minor' },

            // Business Faculty
            { code: 'BUS101', name: 'Business Management', credits: 3, instructor: 'Prof. Davis', semester: 'Fall 2024', enrolled: 55, capacity: 60, category: 'business', courseType: 'major' },
            { code: 'BUS201', name: 'Marketing Principles', credits: 3, instructor: 'Dr. Wilson', semester: 'Fall 2024', enrolled: 42, capacity: 50, category: 'business', courseType: 'major' },
            { code: 'BUS301', name: 'Financial Accounting', credits: 4, instructor: 'Prof. Brown', semester: 'Fall 2024', enrolled: 38, capacity: 45, category: 'business', courseType: 'minor' },

            // Multimedia Faculty
            { code: 'MUL101', name: 'Digital Design Fundamentals', credits: 3, instructor: 'Prof. Garcia', semester: 'Fall 2024', enrolled: 35, capacity: 40, category: 'multimedia', courseType: 'major' },
            { code: 'MUL201', name: 'Video Production', credits: 4, instructor: 'Dr. Lee', semester: 'Fall 2024', enrolled: 28, capacity: 35, category: 'multimedia', courseType: 'minor' },
            { code: 'MUL301', name: '3D Animation', credits: 4, instructor: 'Prof. Chen', semester: 'Fall 2024', enrolled: 25, capacity: 30, category: 'multimedia', courseType: 'major' },

            // Literature Faculty
            { code: 'LIT101', name: 'World Literature', credits: 3, instructor: 'Prof. Thompson', semester: 'Fall 2024', enrolled: 40, capacity: 50, category: 'literature', courseType: 'major' },
            { code: 'LIT201', name: 'Modern Poetry', credits: 3, instructor: 'Dr. White', semester: 'Fall 2024', enrolled: 32, capacity: 40, category: 'literature', courseType: 'minor' },
            { code: 'LIT301', name: 'Shakespeare Studies', credits: 4, instructor: 'Prof. Harris', semester: 'Fall 2024', enrolled: 28, capacity: 35, category: 'literature', courseType: 'major' },

            // Acting & Theatre Faculty
            { code: 'ACT101', name: 'Introduction to Acting', credits: 3, instructor: 'Prof. Rodriguez', semester: 'Fall 2024', enrolled: 30, capacity: 35, category: 'acting', courseType: 'major' },
            { code: 'ACT201', name: 'Stage Performance', credits: 4, instructor: 'Dr. Miller', semester: 'Fall 2024', enrolled: 25, capacity: 30, category: 'acting', courseType: 'minor' },
            { code: 'ACT301', name: 'Theatre Production', credits: 4, instructor: 'Prof. Clark', semester: 'Fall 2024', enrolled: 20, capacity: 25, category: 'acting', courseType: 'major' }
        ];
        await db.collection('courses').insertMany(courses);
        console.log('✓ Created courses with faculty categories');

        // Seed students
        const students = [
            { studentId: 'S001', name: 'John Doe', email: 'john.doe@university.edu', major: 'Computer Science', year: 3 },
            { studentId: 'S002', name: 'Jane Smith', email: 'jane.smith@university.edu', major: 'Software Engineering', year: 2 },
            { studentId: 'S003', name: 'Bob Johnson', email: 'bob.johnson@university.edu', major: 'Information Technology', year: 4 },
            { studentId: 'S004', name: 'Alice Williams', email: 'alice.williams@university.edu', major: 'Economics', year: 2 },
            { studentId: 'S005', name: 'Charlie Brown', email: 'charlie.brown@university.edu', major: 'Business', year: 3 },
            { studentId: 'S006', name: 'Diana Prince', email: 'diana.prince@university.edu', major: 'Literature', year: 1 },
            { studentId: 'S007', name: 'Ethan Hunt', email: 'ethan.hunt@university.edu', major: 'Acting', year: 2 },
            { studentId: 'S008', name: 'Fiona Green', email: 'fiona.green@university.edu', major: 'Multimedia', year: 3 }
        ];
        await db.collection('students').insertMany(students);
        console.log('✓ Created students');

        // Seed enrollments
        const enrollments = [
            { studentId: 'S001', studentName: 'John Doe', studentEmail: 'john.doe@university.edu', courseCode: 'SCI101', courseName: 'General Physics', enrolledAt: new Date('2024-09-01') },
            { studentId: 'S001', studentName: 'John Doe', studentEmail: 'john.doe@university.edu', courseCode: 'MUL101', courseName: 'Digital Design Fundamentals', enrolledAt: new Date('2024-09-01') },
            { studentId: 'S002', studentName: 'Jane Smith', studentEmail: 'jane.smith@university.edu', courseCode: 'SCI101', courseName: 'General Physics', enrolledAt: new Date('2024-09-02') },
            { studentId: 'S003', studentName: 'Bob Johnson', studentEmail: 'bob.johnson@university.edu', courseCode: 'BUS101', courseName: 'Business Management', enrolledAt: new Date('2024-09-03') },
            { studentId: 'S004', studentName: 'Alice Williams', studentEmail: 'alice.williams@university.edu', courseCode: 'ECO101', courseName: 'Microeconomics', enrolledAt: new Date('2024-09-01') },
            { studentId: 'S004', studentName: 'Alice Williams', studentEmail: 'alice.williams@university.edu', courseCode: 'ECO201', courseName: 'Macroeconomics', enrolledAt: new Date('2024-09-01') },
            { studentId: 'S005', studentName: 'Charlie Brown', studentEmail: 'charlie.brown@university.edu', courseCode: 'BUS101', courseName: 'Business Management', enrolledAt: new Date('2024-09-02') },
            { studentId: 'S006', studentName: 'Diana Prince', studentEmail: 'diana.prince@university.edu', courseCode: 'LIT101', courseName: 'World Literature', enrolledAt: new Date('2024-09-01') },
            { studentId: 'S007', studentName: 'Ethan Hunt', studentEmail: 'ethan.hunt@university.edu', courseCode: 'ACT101', courseName: 'Introduction to Acting', enrolledAt: new Date('2024-09-01') },
            { studentId: 'S008', studentName: 'Fiona Green', studentEmail: 'fiona.green@university.edu', courseCode: 'MUL101', courseName: 'Digital Design Fundamentals', enrolledAt: new Date('2024-09-02') }
        ];
        await db.collection('enrollments').insertMany(enrollments);
        console.log('✓ Created enrollments');

        console.log('\n✓ Database seeded successfully!');
        console.log('\nLogin credentials:');
        console.log('Admin: admin@university.edu / admin123');
        console.log('Student: john.doe@university.edu / student123');

    } catch (error) {
        console.error('Seeding error:', error);
    } finally {
        await client.close();
    }
}

seedDatabase();
