const express = require('express');

module.exports = (db) => {
    const router = express.Router();

    router.get('/', async (req, res) => {
        try {
            const [borrowings] = await db.query(`
                SELECT b.*, s.name as student_name, s.student_id, bk.title as book_title, bk.isbn
                FROM borrowings b
                JOIN students s ON b.student_id = s.id
                JOIN books bk ON b.book_id = bk.id
                ORDER BY b.borrow_date DESC
            `);
            res.json(borrowings);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.get('/student/:studentId', async (req, res) => {
        try {
            const [borrowings] = await db.query(`
                SELECT b.*, bk.title, bk.author, bk.isbn
                FROM borrowings b
                JOIN books bk ON b.book_id = bk.id
                WHERE b.student_id = ?
                ORDER BY b.borrow_date DESC
            `, [req.params.studentId]);
            res.json(borrowings);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Get only active (borrowed) books for a student
    router.get('/student/:studentId/active', async (req, res) => {
        try {
            const [borrowings] = await db.query(`
                SELECT b.*, bk.title, bk.author, bk.isbn
                FROM borrowings b
                JOIN books bk ON b.book_id = bk.id
                WHERE b.student_id = ? AND b.status = 'borrowed'
                ORDER BY b.due_date ASC
            `, [req.params.studentId]);
            res.json(borrowings);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.post('/', async (req, res) => {
        try {
            const { student_id, book_id, borrow_date, due_date } = req.body;
            
            // Check if student already has this book borrowed (not returned)
            const [activeBorrowings] = await db.query(
                'SELECT id FROM borrowings WHERE student_id = ? AND book_id = ? AND status = ?',
                [student_id, book_id, 'borrowed']
            );
            
            if (activeBorrowings.length > 0) {
                return res.status(400).json({ error: 'You already have this book borrowed. Please return it first.' });
            }
            
            // Check if book is available
            const [books] = await db.query('SELECT available_copies, title FROM books WHERE id = ?', [book_id]);
            if (books.length === 0) {
                return res.status(404).json({ error: 'Book not found' });
            }
            
            if (books[0].available_copies <= 0) {
                return res.status(400).json({ error: 'Book not available. All copies are currently borrowed.' });
            }
            
            // Create borrowing record
            const [result] = await db.query(
                'INSERT INTO borrowings (student_id, book_id, borrow_date, due_date, status) VALUES (?, ?, ?, ?, ?)',
                [student_id, book_id, borrow_date, due_date, 'borrowed']
            );
            
            // Decrease available copies
            await db.query('UPDATE books SET available_copies = available_copies - 1 WHERE id = ?', [book_id]);
            
            res.status(201).json({ 
                message: `Successfully borrowed "${books[0].title}"`, 
                id: result.insertId 
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.put('/:id', async (req, res) => {
        try {
            const { return_date, status, fine } = req.body;
            
            // Get borrowing details
            const [borrowings] = await db.query(
                'SELECT b.book_id, b.status, bk.title FROM borrowings b JOIN books bk ON b.book_id = bk.id WHERE b.id = ?',
                [req.params.id]
            );
            
            if (borrowings.length === 0) {
                return res.status(404).json({ error: 'Borrowing record not found' });
            }
            
            const borrowing = borrowings[0];
            
            // Check if already returned
            if (borrowing.status === 'returned') {
                return res.status(400).json({ error: 'This book has already been returned' });
            }
            
            // Update borrowing record
            await db.query(
                'UPDATE borrowings SET return_date = ?, status = ?, fine = ? WHERE id = ?',
                [return_date, status, fine || 0, req.params.id]
            );
            
            // If returned, increase available copies so it can be borrowed again
            if (status === 'returned') {
                await db.query(
                    'UPDATE books SET available_copies = available_copies + 1 WHERE id = ?',
                    [borrowing.book_id]
                );
                
                res.json({ 
                    message: `"${borrowing.title}" returned successfully. You can borrow it again anytime!` 
                });
            } else {
                res.json({ message: 'Borrowing updated successfully' });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Simple return book endpoint
    router.post('/:id/return', async (req, res) => {
        try {
            // Get borrowing details
            const [borrowings] = await db.query(
                'SELECT b.book_id, b.status, b.student_id, bk.title, s.name as student_name FROM borrowings b JOIN books bk ON b.book_id = bk.id JOIN students s ON b.student_id = s.id WHERE b.id = ?',
                [req.params.id]
            );
            
            if (borrowings.length === 0) {
                return res.status(404).json({ error: 'Borrowing record not found' });
            }
            
            const borrowing = borrowings[0];
            
            // Check if already returned
            if (borrowing.status === 'returned') {
                return res.status(400).json({ error: 'This book has already been returned' });
            }
            
            // Update borrowing record to returned
            const returnDate = new Date().toISOString().split('T')[0];
            await db.query(
                'UPDATE borrowings SET return_date = ?, status = ? WHERE id = ?',
                [returnDate, 'returned', req.params.id]
            );
            
            // Increase available copies
            await db.query(
                'UPDATE books SET available_copies = available_copies + 1 WHERE id = ?',
                [borrowing.book_id]
            );
            
            res.json({ 
                message: `"${borrowing.title}" returned successfully by ${borrowing.student_name}!`,
                canBorrowAgain: true
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.delete('/:id', async (req, res) => {
        try {
            // Get borrowing to restore book count if it was borrowed
            const [borrowings] = await db.query('SELECT book_id, status FROM borrowings WHERE id = ?', [req.params.id]);
            
            if (borrowings.length > 0 && borrowings[0].status === 'borrowed') {
                // Restore available copies if deleting an active borrowing
                await db.query('UPDATE books SET available_copies = available_copies + 1 WHERE id = ?', [borrowings[0].book_id]);
            }
            
            await db.query('DELETE FROM borrowings WHERE id = ?', [req.params.id]);
            res.json({ message: 'Borrowing record deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
