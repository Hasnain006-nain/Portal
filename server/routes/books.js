const express = require('express');

module.exports = (db) => {
    const router = express.Router();

    router.get('/', async (req, res) => {
        try {
            const [books] = await db.query('SELECT * FROM books ORDER BY title');
            res.json(books);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.get('/:id', async (req, res) => {
        try {
            const [books] = await db.query('SELECT * FROM books WHERE id = ?', [req.params.id]);
            if (books.length === 0) return res.status(404).json({ error: 'Book not found' });
            res.json(books[0]);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.post('/', async (req, res) => {
        try {
            const { isbn, title, author, publisher, category, total_copies } = req.body;
            const [result] = await db.query(
                'INSERT INTO books (isbn, title, author, publisher, category, total_copies, available_copies) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [isbn, title, author, publisher, category, total_copies || 1, total_copies || 1]
            );
            res.status(201).json({ message: 'Book created successfully', id: result.insertId });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.put('/:id', async (req, res) => {
        try {
            const { isbn, title, author, publisher, category, total_copies, available_copies } = req.body;
            await db.query(
                'UPDATE books SET isbn = ?, title = ?, author = ?, publisher = ?, category = ?, total_copies = ?, available_copies = ? WHERE id = ?',
                [isbn, title, author, publisher, category, total_copies, available_copies, req.params.id]
            );
            res.json({ message: 'Book updated successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Check if a student can borrow a book
    router.get('/:id/can-borrow/:studentId', async (req, res) => {
        try {
            const { id, studentId } = req.params;
            
            // Check if book exists and is available
            const [books] = await db.query('SELECT title, available_copies FROM books WHERE id = ?', [id]);
            if (books.length === 0) {
                return res.json({ canBorrow: false, reason: 'Book not found' });
            }
            
            const book = books[0];
            
            // Check if student already has this book borrowed
            const [activeBorrowings] = await db.query(
                'SELECT id FROM borrowings WHERE student_id = ? AND book_id = ? AND status = ?',
                [studentId, id, 'borrowed']
            );
            
            if (activeBorrowings.length > 0) {
                return res.json({ 
                    canBorrow: false, 
                    reason: 'You already have this book borrowed. Please return it first.',
                    hasBorrowed: true
                });
            }
            
            // Check if book is available
            if (book.available_copies <= 0) {
                return res.json({ 
                    canBorrow: false, 
                    reason: 'All copies are currently borrowed',
                    isAvailable: false
                });
            }
            
            res.json({ 
                canBorrow: true, 
                reason: 'Book is available for borrowing',
                availableCopies: book.available_copies
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    router.delete('/:id', async (req, res) => {
        try {
            // Check if book has active borrowings
            const [activeBorrowings] = await db.query(
                'SELECT COUNT(*) as count FROM borrowings WHERE book_id = ? AND status = ?',
                [req.params.id, 'borrowed']
            );
            
            if (activeBorrowings[0].count > 0) {
                return res.status(400).json({ 
                    error: 'Cannot delete book with active borrowings. Please wait for all copies to be returned.' 
                });
            }
            
            await db.query('DELETE FROM books WHERE id = ?', [req.params.id]);
            res.json({ message: 'Book deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
