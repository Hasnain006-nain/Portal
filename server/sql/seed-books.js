require('dotenv').config();
const mysql = require('mysql2/promise');

async function seedBooks() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'studentportal',
        port: process.env.DB_PORT || 3306
    });

    try {
        console.log('Starting books seeding...');

        // Clear existing books
        await connection.query('DELETE FROM books');
        console.log('✓ Cleared existing books');

        // Add books with proper copies
        const books = [
            // Computer Science
            { isbn: '978-0262033848', title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', publisher: 'MIT Press', category: 'Computer Science', total_copies: 5, available_copies: 5 },
            { isbn: '978-0132350884', title: 'Clean Code', author: 'Robert C. Martin', publisher: 'Prentice Hall', category: 'Software Engineering', total_copies: 3, available_copies: 3 },
            { isbn: '978-0201633610', title: 'Design Patterns', author: 'Gang of Four', publisher: 'Addison-Wesley', category: 'Software Engineering', total_copies: 4, available_copies: 4 },
            { isbn: '978-0070702912', title: 'Database System Concepts', author: 'Abraham Silberschatz', publisher: 'McGraw-Hill', category: 'Computer Science', total_copies: 6, available_copies: 6 },
            { isbn: '978-0321573513', title: 'Algorithms', author: 'Robert Sedgewick', publisher: 'Addison-Wesley', category: 'Computer Science', total_copies: 4, available_copies: 4 },
            
            // Engineering
            { isbn: '978-1118807330', title: 'Engineering Mechanics', author: 'J.L. Meriam', publisher: 'Wiley', category: 'Engineering', total_copies: 8, available_copies: 8 },
            { isbn: '978-0073398235', title: 'Thermodynamics', author: 'Yunus Cengel', publisher: 'McGraw-Hill', category: 'Engineering', total_copies: 5, available_copies: 5 },
            { isbn: '978-0134685991', title: 'Electric Circuits', author: 'James Nilsson', publisher: 'Pearson', category: 'Engineering', total_copies: 6, available_copies: 6 },
            
            // Business & Economics
            { isbn: '978-0133023893', title: 'Principles of Economics', author: 'N. Gregory Mankiw', publisher: 'Cengage', category: 'Economics', total_copies: 7, available_copies: 7 },
            { isbn: '978-0134472089', title: 'Financial Accounting', author: 'Walter Harrison', publisher: 'Pearson', category: 'Business', total_copies: 5, available_copies: 5 },
            { isbn: '978-0134729329', title: 'Marketing Management', author: 'Philip Kotler', publisher: 'Pearson', category: 'Business', total_copies: 4, available_copies: 4 },
            { isbn: '978-1259720697', title: 'Corporate Finance', author: 'Stephen Ross', publisher: 'McGraw-Hill', category: 'Business', total_copies: 6, available_copies: 6 },
            
            // Literature
            { isbn: '978-0141439518', title: 'Pride and Prejudice', author: 'Jane Austen', publisher: 'Penguin Classics', category: 'Literature', total_copies: 10, available_copies: 10 },
            { isbn: '978-0743273565', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', publisher: 'Scribner', category: 'Literature', total_copies: 8, available_copies: 8 },
            { isbn: '978-0451524935', title: '1984', author: 'George Orwell', publisher: 'Signet Classic', category: 'Literature', total_copies: 7, available_copies: 7 },
            { isbn: '978-0060935467', title: 'To Kill a Mockingbird', author: 'Harper Lee', publisher: 'Harper Perennial', category: 'Literature', total_copies: 9, available_copies: 9 },
            
            // Science
            { isbn: '978-0321976444', title: 'Campbell Biology', author: 'Jane Reece', publisher: 'Pearson', category: 'Science', total_copies: 6, available_copies: 6 },
            { isbn: '978-0321910417', title: 'General Chemistry', author: 'Darrell Ebbing', publisher: 'Cengage', category: 'Science', total_copies: 7, available_copies: 7 },
            { isbn: '978-0321897930', title: 'Physics for Scientists', author: 'Douglas Giancoli', publisher: 'Pearson', category: 'Science', total_copies: 5, available_copies: 5 },
            
            // Multimedia & Arts
            { isbn: '978-0321934062', title: 'The Non-Designer\'s Design Book', author: 'Robin Williams', publisher: 'Peachpit Press', category: 'Multimedia', total_copies: 4, available_copies: 4 },
            { isbn: '978-0321929044', title: 'Digital Photography', author: 'Scott Kelby', publisher: 'Peachpit Press', category: 'Multimedia', total_copies: 3, available_copies: 3 },
            { isbn: '978-0321815385', title: 'Video Production Handbook', author: 'Jim Owens', publisher: 'Focal Press', category: 'Multimedia', total_copies: 5, available_copies: 5 },
            
            // Testing books with limited copies
            { isbn: '978-testingx1', title: 'testing', author: 'tester', publisher: 'Test Publisher', category: 'testing', total_copies: 1, available_copies: 0 }, // Already borrowed
            { isbn: '978-testingx2', title: 'Advanced Testing', author: 'Test Author', publisher: 'Test Publisher', category: 'testing', total_copies: 2, available_copies: 1 } // One available
        ];

        for (const book of books) {
            await connection.query(
                'INSERT INTO books (isbn, title, author, publisher, category, total_copies, available_copies) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [book.isbn, book.title, book.author, book.publisher, book.category, book.total_copies, book.available_copies]
            );
        }

        console.log(`✓ Added ${books.length} books with proper copies`);
        console.log('\n✓ Books seeding completed successfully!');
        
        // Show summary
        const [summary] = await connection.query(`
            SELECT category, COUNT(*) as count, SUM(total_copies) as total_copies, SUM(available_copies) as available_copies
            FROM books
            GROUP BY category
        `);
        
        console.log('\nBooks Summary:');
        console.table(summary);
        
    } catch (error) {
        console.error('Seeding error:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

seedBooks();
