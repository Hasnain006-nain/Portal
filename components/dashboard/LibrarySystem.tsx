import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { booksApi, borrowingsApi, studentsApi } from '../../lib/apiClient';
import { Search, BookOpen, AlertCircle, Loader2, ArrowLeft, X, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { ExportButton } from '../ui/export-button';
import { exportLibrary } from '../../lib/exportUtils';

interface LibrarySystemProps {
  onTabChange?: (tab: string) => void;
}

export function LibrarySystem({ onTabChange }: LibrarySystemProps = {}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [books, setBooks] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [borrowings, setBorrowings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBorrowDialogOpen, setIsBorrowDialogOpen] = useState(false);
  const [isBookDialogOpen, setIsBookDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isQuickBorrowDialogOpen, setIsQuickBorrowDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<any>(null);
  const [viewingBook, setViewingBook] = useState<any>(null);
  const [selectedBookForBorrow, setSelectedBookForBorrow] = useState<any>(null);
  const [borrowForm, setBorrowForm] = useState({
    studentId: '',
    bookId: '',
    borrowDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });
  const [quickBorrowForm, setQuickBorrowForm] = useState({
    studentId: '',
    manualStudentName: '',
    borrowDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    isbn: '',
    category: '',
    total: 1,
    available: 1,
  });

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const isAdmin = currentUser.role === 'admin';

  // Fetch books, students, and borrowings from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch sequentially with small delays to avoid SSL connection pool issues
        const booksData = await booksApi.getAll();
        setBooks(booksData);

        await new Promise(resolve => setTimeout(resolve, 100));

        const studentsData = isAdmin ? await studentsApi.getAll() : [];
        setStudents(studentsData);

        await new Promise(resolve => setTimeout(resolve, 100));

        const borrowingsData = await borrowingsApi.getAll();
        setBorrowings(borrowingsData);
      } catch (error: any) {
        toast.error('Failed to load data');
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin]);

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(books.map(b => b.category)))];

  // Filter books
  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || book.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Filter borrowings
  const borrowedBooks = borrowings.filter(b => b.status === 'borrowed');
  const borrowHistory = borrowings.filter(b => b.status === 'returned');

  const handleBorrow = (_bookId: string) => {
    toast.success('Book borrow request submitted!');
  };

  const handleMarkAsReturned = async (borrowingId: string) => {
    try {
      await borrowingsApi.update(borrowingId, { status: 'returned', returnDate: new Date().toISOString() });
      toast.success('Book marked as returned!');
      // Refresh data
      const [booksData, borrowingsData] = await Promise.all([
        booksApi.getAll(),
        borrowingsApi.getAll()
      ]);
      setBooks(booksData);
      setBorrowings(borrowingsData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark as returned');
    }
  };

  const handleDeleteBorrowing = async (borrowingId: string) => {
    if (!confirm('Are you sure you want to delete this borrowing record?')) return;
    try {
      await borrowingsApi.delete(borrowingId);
      toast.success('Borrowing record deleted!');
      const borrowingsData = await borrowingsApi.getAll();
      setBorrowings(borrowingsData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete borrowing');
    }
  };

  const handleCreateBorrowing = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Check if student already has this book borrowed
      const studentBorrowings = borrowings.filter(
        (b: any) => b.studentId === borrowForm.studentId && b.status === 'borrowed'
      );

      const alreadyBorrowed = studentBorrowings.some(
        (b: any) => b.bookId === borrowForm.bookId
      );

      if (alreadyBorrowed) {
        const book = books.find((b: any) => b._id === borrowForm.bookId);
        toast.error(`This student has already borrowed "${book?.title || 'this book'}". Please return it first or choose another book.`);
        return;
      }

      await borrowingsApi.create({
        studentId: borrowForm.studentId,
        bookId: borrowForm.bookId,
        borrowDate: borrowForm.borrowDate,
        dueDate: borrowForm.dueDate,
        status: 'borrowed'
      });
      toast.success('Borrowing record created successfully!');
      setIsBorrowDialogOpen(false);
      setBorrowForm({
        studentId: '',
        bookId: '',
        borrowDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      // Refresh data
      const [booksData, borrowingsData] = await Promise.all([
        booksApi.getAll(),
        borrowingsApi.getAll()
      ]);
      setBooks(booksData);
      setBorrowings(borrowingsData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create borrowing');
    }
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBook) {
        await booksApi.update(editingBook._id, bookForm);
        toast.success('Book updated successfully!');
      } else {
        await booksApi.create(bookForm);
        toast.success('Book added successfully!');
      }
      setIsBookDialogOpen(false);
      setEditingBook(null);
      setBookForm({
        title: '',
        author: '',
        isbn: '',
        category: '',
        total: 1,
        available: 1,
      });
      // Refresh books
      const booksData = await booksApi.getAll();
      setBooks(booksData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save book');
    }
  };

  const handleEditBook = (book: any) => {
    setEditingBook(book);
    setBookForm({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category,
      total: book.total,
      available: book.available,
    });
    setIsBookDialogOpen(true);
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!confirm('Are you sure you want to delete this book?')) return;
    try {
      await booksApi.delete(bookId);
      toast.success('Book deleted successfully!');
      const booksData = await booksApi.getAll();
      setBooks(booksData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete book');
    }
  };

  const handleViewBook = (book: any) => {
    setViewingBook(book);
    setIsViewDialogOpen(true);
  };

  const handleAddNewBook = () => {
    setEditingBook(null);
    setBookForm({
      title: '',
      author: '',
      isbn: '',
      category: '',
      total: 1,
      available: 1,
    });
    setIsBookDialogOpen(true);
  };

  const handleQuickBorrow = (book: any) => {
    setSelectedBookForBorrow(book);
    setQuickBorrowForm({
      studentId: '',
      manualStudentName: '',
      borrowDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setIsQuickBorrowDialogOpen(true);
  };

  const handleSubmitQuickBorrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookForBorrow) return;

    try {
      const studentIdToUse = quickBorrowForm.studentId || quickBorrowForm.manualStudentName;
      if (!studentIdToUse) {
        toast.error('Please select a student or enter a student ID');
        return;
      }

      // Check if student already has this book borrowed
      const studentBorrowings = borrowings.filter(
        (b: any) => b.studentId === studentIdToUse && b.status === 'borrowed'
      );

      const alreadyBorrowed = studentBorrowings.some(
        (b: any) => b.bookId === selectedBookForBorrow._id
      );

      if (alreadyBorrowed) {
        toast.error(`This student has already borrowed "${selectedBookForBorrow.title}". Please return it first or choose another book.`);
        return;
      }

      await borrowingsApi.create({
        studentId: studentIdToUse,
        bookId: selectedBookForBorrow._id,
        borrowDate: quickBorrowForm.borrowDate,
        dueDate: quickBorrowForm.dueDate,
        status: 'borrowed'
      });

      toast.success('Book borrowed successfully!');
      setIsQuickBorrowDialogOpen(false);
      setSelectedBookForBorrow(null);
      setQuickBorrowForm({
        studentId: '',
        manualStudentName: '',
        borrowDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });

      // Refresh data
      const [booksData, borrowingsData] = await Promise.all([
        booksApi.getAll(),
        borrowingsApi.getAll()
      ]);
      setBooks(booksData);
      setBorrowings(borrowingsData);
    } catch (error: any) {
      toast.error(error.message || 'Failed to borrow book');
    }
  };

  const overdueCount = borrowedBooks.filter((b: any) => new Date(b.dueDate) < new Date()).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Detail View
  if (selectedBook) {
    const isAvailable = selectedBook.available > 0;

    return (
      <div className="space-y-6 w-full max-w-full">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setSelectedBook(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Library
          </Button>
          {isAdmin && (
            <div className="flex gap-2">
              <Button variant="outline">
                <BookOpen className="h-4 w-4 mr-2" />
                Edit Book
              </Button>
            </div>
          )}
        </div>

        <Card className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant={isAvailable ? "outline" : "destructive"}>
                  {isAvailable ? 'Available' : 'Out of Stock'}
                </Badge>
                <Badge variant="secondary">{selectedBook.category}</Badge>
              </div>
              <h1 className="mb-2">{selectedBook.title}</h1>
              <p className="text-lg text-muted-foreground mb-1">{selectedBook.author}</p>
              <p className="text-sm text-muted-foreground">ISBN: {selectedBook.isbn}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSelectedBook(null)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-4 bg-primary/5">
              <p className="text-muted-foreground text-sm mb-1">Total Copies</p>
              <h2>{Number(selectedBook.total) || 0}</h2>
            </Card>
            <Card className="p-4 bg-green-500/5">
              <p className="text-muted-foreground text-sm mb-1">Available</p>
              <h2 className="text-green-600">{Number(selectedBook.available) || 0}</h2>
            </Card>
            <Card className="p-4 bg-blue-500/5">
              <p className="text-muted-foreground text-sm mb-1">Borrowed</p>
              <h2 className="text-blue-600">{(Number(selectedBook.total) || 0) - (Number(selectedBook.available) || 0)}</h2>
            </Card>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="mb-4">Availability</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Copies Available</span>
                  <span className="font-medium">{selectedBook.available} / {selectedBook.total}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-4">
                  <div
                    className="bg-green-500 rounded-full h-4 transition-all"
                    style={{ width: `${(selectedBook.available / selectedBook.total) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-4">Book Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-muted-foreground text-sm mb-1">Title</p>
                  <p className="font-medium">{selectedBook.title}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-muted-foreground text-sm mb-1">Author</p>
                  <p className="font-medium">{selectedBook.author}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-muted-foreground text-sm mb-1">ISBN</p>
                  <p className="font-medium">{selectedBook.isbn}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-muted-foreground text-sm mb-1">Category</p>
                  <Badge variant="secondary">{selectedBook.category}</Badge>
                </div>
              </div>
            </div>

            {isAvailable && (
              <div className="pt-4">
                <Button className="w-full" size="lg" onClick={() => handleBorrow(selectedBook._id)}>
                  <BookOpen className="h-5 w-5 mr-2" />
                  Borrow This Book
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6 w-full max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl">Library System</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-xs sm:text-sm md:text-base">Browse, borrow, and manage your library books</p>
        </div>
        <div className="flex items-center gap-2">
          {onTabChange && (
            <Button variant="outline" onClick={() => onTabChange('dashboard')} className="flex-shrink-0">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          )}
          {isAdmin && (
            <Dialog open={isBorrowDialogOpen} onOpenChange={setIsBorrowDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex-shrink-0">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Add Borrowing</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="!w-[90%] sm:!w-[550px] !max-w-[600px] max-h-[90vh] overflow-hidden p-0 !rounded-2xl">
                <div className="p-6 border-b">
                  <DialogHeader className="text-left">
                    <DialogTitle className="text-xl font-semibold">Create Borrowing Record</DialogTitle>
                    <DialogDescription className="text-sm mt-1">
                      Assign a book to a student
                    </DialogDescription>
                  </DialogHeader>
                </div>

                <form onSubmit={handleCreateBorrowing} className="flex flex-col h-full">
                  <div className="p-6 overflow-y-auto flex-1 space-y-4">
                    <div>
                      <Label htmlFor="student" className="text-sm font-medium mb-2 block">Student</Label>
                      <select
                        id="student"
                        value={borrowForm.studentId}
                        onChange={(e) => setBorrowForm({ ...borrowForm, studentId: e.target.value })}
                        className="flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                        required
                      >
                        <option value="">Select a student</option>
                        {students.map((student) => (
                          <option key={student._id} value={student.studentId}>
                            {student.name} ({student.studentId})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="book" className="text-sm font-medium mb-2 block">Book</Label>
                      <select
                        id="book"
                        value={borrowForm.bookId}
                        onChange={(e) => setBorrowForm({ ...borrowForm, bookId: e.target.value })}
                        className="flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                        required
                      >
                        <option value="">Select a book</option>
                        {books.filter(b => b.available > 0).map((book) => (
                          <option key={book._id} value={book._id}>
                            {book.title} ({book.available} available)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="borrowDate" className="text-sm font-medium mb-2 block">Borrow Date</Label>
                        <Input
                          id="borrowDate"
                          type="date"
                          value={borrowForm.borrowDate}
                          onChange={(e) => setBorrowForm({ ...borrowForm, borrowDate: e.target.value })}
                          className="h-11 rounded-lg"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="dueDate" className="text-sm font-medium mb-2 block">Due Date</Label>
                        <Input
                          id="dueDate"
                          type="date"
                          value={borrowForm.dueDate}
                          onChange={(e) => setBorrowForm({ ...borrowForm, dueDate: e.target.value })}
                          className="h-11 rounded-lg"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border-t bg-muted/30 flex gap-3 justify-end">
                    <Button type="button" variant="outline" onClick={() => setIsBorrowDialogOpen(false)} className="px-6">
                      Cancel
                    </Button>
                    <Button type="submit" className="px-6">Create Borrowing</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Library Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 xl:gap-6 w-full">
        <Card className="p-3 sm:p-4 md:p-6">
          <p className="text-muted-foreground text-xs sm:text-sm">Total Books</p>
          <h2 className="mt-1 sm:mt-2 text-xl sm:text-2xl md:text-3xl">{books.length}</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {books.reduce((sum, b) => sum + (Number(b.total) || 0), 0)} total copies
          </p>
        </Card>
        <Card className="p-3 sm:p-4 md:p-6">
          <p className="text-muted-foreground text-xs sm:text-sm">Available Copies</p>
          <h2 className="mt-1 sm:mt-2 text-xl sm:text-2xl md:text-3xl text-green-600">{books.reduce((sum, b) => sum + (Number(b.available) || 0), 0)}</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Ready to borrow
          </p>
        </Card>
        <Card className="p-3 sm:p-4 md:p-6">
          <p className="text-muted-foreground text-xs sm:text-sm">Borrowed Copies</p>
          <h2 className="mt-1 sm:mt-2 text-xl sm:text-2xl md:text-3xl text-blue-600">{books.reduce((sum, b) => sum + ((Number(b.total) || 0) - (Number(b.available) || 0)), 0)}</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Currently out
          </p>
        </Card>
        <Card className="p-3 sm:p-4 md:p-6">
          <p className="text-muted-foreground text-xs sm:text-sm">Overdue Books</p>
          <h2 className="mt-1 sm:mt-2 text-xl sm:text-2xl md:text-3xl text-destructive">{overdueCount}</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Need attention
          </p>
        </Card>
      </div>

      {/* Overdue Warning */}
      {overdueCount > 0 && (
        <Card className="p-4 bg-destructive/10 border-destructive/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <h4 className="text-destructive">You have {overdueCount} overdue book(s)</h4>
              <p className="text-muted-foreground mt-1">Please return them as soon as possible to avoid fines.</p>
            </div>
          </div>
        </Card>
      )}

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="browse">Browse Books</TabsTrigger>
          <TabsTrigger value="borrow-now">Borrow Now</TabsTrigger>
          <TabsTrigger value="borrowed">Borrowed Books</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4 mt-6">
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by title or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(category)}
                  className="shrink-0"
                >
                  {category}
                </Button>
              ))}
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <ExportButton
                  onExport={() => exportLibrary(books, borrowings)}
                  label="Export"
                />
                <Button onClick={handleAddNewBook}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Book
                </Button>
              </div>
            )}
          </div>

          {/* Books Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left p-4 font-medium">Book Name</th>
                    <th className="text-left p-4 font-medium">Category</th>
                    <th className="text-left p-4 font-medium">Author</th>
                    <th className="text-left p-4 font-medium">Copies Available</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks.map((book) => (
                    <tr key={book._id || book.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="font-medium">{book.title}</div>
                        <div className="text-sm text-muted-foreground">ISBN: {book.isbn}</div>
                      </td>
                      <td className="p-4">
                        <Badge variant="secondary">{book.category}</Badge>
                      </td>
                      <td className="p-4 text-muted-foreground">{book.author}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={book.available > 0 ? 'text-green-600 font-medium' : 'text-destructive font-medium'}>
                            {book.available}
                          </span>
                          <span className="text-muted-foreground">/ {book.total}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewBook(book)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {isAdmin && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditBook(book)}
                                title="Edit Book"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteBook(book._id)}
                                title="Delete Book"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {filteredBooks.length === 0 && (
            <Card className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No books found matching your criteria</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="borrow-now" className="space-y-4 mt-6">
          {/* Available Books for Quick Borrowing */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Available Books</h3>
              <p className="text-sm text-muted-foreground">Quick borrow books that are currently available</p>
            </div>
          </div>

          {books.filter(book => book.available > 0).length > 0 ? (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left p-4 font-medium">Book Name</th>
                      <th className="text-left p-4 font-medium">Category</th>
                      <th className="text-left p-4 font-medium">Author</th>
                      <th className="text-left p-4 font-medium">Available Copies</th>
                      <th className="text-left p-4 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {books.filter(book => book.available > 0).map((book) => (
                      <tr key={book._id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <div className="font-medium">{book.title}</div>
                          <div className="text-sm text-muted-foreground">ISBN: {book.isbn}</div>
                        </td>
                        <td className="p-4">
                          <Badge variant="secondary">{book.category}</Badge>
                        </td>
                        <td className="p-4 text-muted-foreground">{book.author}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="text-green-600 font-medium">{book.available}</span>
                            <span className="text-muted-foreground">/ {book.total}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Button
                            onClick={() => handleQuickBorrow(book)}
                            size="sm"
                          >
                            <BookOpen className="h-4 w-4 mr-2" />
                            Borrow Now
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No books available for borrowing at the moment</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="borrowed" className="space-y-4 mt-6">
          {borrowedBooks.length > 0 ? (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left p-4 font-medium">Book Name</th>
                      <th className="text-left p-4 font-medium">Category</th>
                      <th className="text-left p-4 font-medium">Borrowed By</th>
                      <th className="text-left p-4 font-medium">Borrow Date</th>
                      <th className="text-left p-4 font-medium">Due Date</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {borrowedBooks.map((borrowing: any) => {
                      const book = books.find(b => b._id === borrowing.bookId);
                      const student = students.find(s => s.studentId === borrowing.studentId);
                      const isOverdue = new Date(borrowing.dueDate) < new Date() && borrowing.status === 'borrowed';

                      return (
                        <tr key={borrowing._id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="p-4">
                            <div className="font-medium">{book?.title || 'Unknown Book'}</div>
                            <div className="text-sm text-muted-foreground">{book?.author || 'N/A'}</div>
                          </td>
                          <td className="p-4">
                            <Badge variant="secondary">{book?.category || 'N/A'}</Badge>
                          </td>
                          <td className="p-4">
                            <div className="font-medium">{student?.name || borrowing.studentId}</div>
                            <div className="text-sm text-muted-foreground">{borrowing.studentId}</div>
                          </td>
                          <td className="p-4 text-muted-foreground">
                            {new Date(borrowing.borrowDate).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <span className={isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                              {new Date(borrowing.dueDate).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="p-4">
                            <Badge variant={isOverdue ? 'destructive' : 'outline'}>
                              {isOverdue ? 'Overdue' : 'Borrowed'}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => book && handleViewBook(book)}
                                title="View Book"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {isAdmin && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleMarkAsReturned(borrowing._id)}
                                    title="Mark as Returned"
                                  >
                                    Return
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteBorrowing(borrowing._id)}
                                    title="Delete Record"
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No borrowed books at the moment</p>
              {!isAdmin && (
                <Button className="mt-4" onClick={() => (document.querySelector('[value="browse"]') as HTMLElement)?.click()}>
                  Browse Books
                </Button>
              )}
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4 mt-6">
          {borrowHistory.length > 0 ? (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left p-4 font-medium">Book Name</th>
                      <th className="text-left p-4 font-medium">Category</th>
                      <th className="text-left p-4 font-medium">Borrowed By</th>
                      <th className="text-left p-4 font-medium">Borrow Date</th>
                      <th className="text-left p-4 font-medium">Return Date</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {borrowHistory.map((borrowing: any) => {
                      const book = books.find(b => b._id === borrowing.bookId);
                      const student = students.find(s => s.studentId === borrowing.studentId);

                      return (
                        <tr key={borrowing._id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="p-4">
                            <div className="font-medium">{book?.title || 'Unknown Book'}</div>
                            <div className="text-sm text-muted-foreground">{book?.author || 'N/A'}</div>
                          </td>
                          <td className="p-4">
                            <Badge variant="secondary">{book?.category || 'N/A'}</Badge>
                          </td>
                          <td className="p-4">
                            <div className="font-medium">{student?.name || borrowing.studentId}</div>
                            <div className="text-sm text-muted-foreground">{borrowing.studentId}</div>
                          </td>
                          <td className="p-4 text-muted-foreground">
                            {new Date(borrowing.borrowDate).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-muted-foreground">
                            {borrowing.returnDate ? new Date(borrowing.returnDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="p-4">
                            <Badge variant="outline">Returned</Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => book && handleViewBook(book)}
                                title="View Book"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteBorrowing(borrowing._id)}
                                  title="Delete Record"
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No borrowing history yet</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Add/Edit Book Dialog */}
      <Dialog open={isBookDialogOpen} onOpenChange={setIsBookDialogOpen}>
        <DialogContent className="!w-[90%] sm:!w-[550px] !max-w-[600px] max-h-[90vh] overflow-hidden p-0 !rounded-2xl">
          <div className="p-6 border-b">
            <DialogHeader className="text-left">
              <DialogTitle className="text-xl font-semibold">{editingBook ? 'Edit Book' : 'Add New Book'}</DialogTitle>
              <DialogDescription className="text-sm mt-1">
                {editingBook ? 'Update book information' : 'Add a new book to the library'}
              </DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={handleSaveBook} className="flex flex-col h-full">
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div>
                <Label htmlFor="title">Book Title *</Label>
                <Input
                  id="title"
                  value={bookForm.title}
                  onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                  placeholder="Enter book title"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="author">Author *</Label>
                  <Input
                    id="author"
                    value={bookForm.author}
                    onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                    placeholder="Enter author name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="isbn">ISBN *</Label>
                  <Input
                    id="isbn"
                    value={bookForm.isbn}
                    onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                    placeholder="Enter ISBN"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Input
                    id="category"
                    value={bookForm.category}
                    onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                    placeholder="e.g., Fiction, Science, History"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="total">Total Copies *</Label>
                  <Input
                    id="total"
                    type="number"
                    min="1"
                    value={bookForm.total}
                    onChange={(e) => setBookForm({ ...bookForm, total: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="available">Available Copies *</Label>
                <Input
                  id="available"
                  type="number"
                  min="0"
                  max={bookForm.total}
                  value={bookForm.available}
                  onChange={(e) => setBookForm({ ...bookForm, available: parseInt(e.target.value) || 0 })}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Must be between 0 and {bookForm.total}
                </p>
              </div>
            </div>

            <div className="p-6 border-t bg-muted/30 flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsBookDialogOpen(false)} className="px-6">
                Cancel
              </Button>
              <Button type="submit" className="px-6">
                {editingBook ? 'Update Book' : 'Add Book'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Book Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="!w-[90%] sm:!w-[500px] !max-w-[550px] max-h-[90vh] overflow-hidden p-0 !rounded-2xl">
          {viewingBook && (
            <>
              <div className="p-6 border-b">
                <DialogHeader className="text-left">
                  <DialogTitle className="text-xl font-semibold">Book Details</DialogTitle>
                  <DialogDescription className="text-sm mt-1">
                    Complete information about {viewingBook.title}
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                {/* Book Info Card */}
                <Card className="p-4 bg-primary/5 border-primary/20">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-16 h-24 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg overflow-hidden shrink-0 flex items-center justify-center shadow-sm">
                      {viewingBook.coverImage ? (
                        <img
                          src={viewingBook.coverImage}
                          alt={viewingBook.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <BookOpen className="h-8 w-8 text-primary/40" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                        <Badge variant={viewingBook.available > 0 ? "default" : "destructive"} className="text-xs">
                          {viewingBook.available > 0 ? 'Available' : 'Out of Stock'}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">{viewingBook.category}</Badge>
                      </div>
                      <h3 className="font-bold text-base mb-1 line-clamp-2">{viewingBook.title}</h3>
                      <p className="text-sm text-muted-foreground">{viewingBook.author}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">ISBN:</span>
                      <span className="font-medium">{viewingBook.isbn}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Category:</span>
                      <span className="font-medium">{viewingBook.category}</span>
                    </div>
                  </div>
                </Card>

                {/* Stats Card */}
                <Card className="p-4 bg-blue-500/5 border-blue-500/20">
                  <h4 className="text-sm font-semibold mb-3">Availability Statistics</h4>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Total</p>
                      <p className="text-xl font-bold">{viewingBook.total}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Available</p>
                      <p className="text-xl font-bold text-green-600">{viewingBook.available}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground mb-1">Borrowed</p>
                      <p className="text-xl font-bold text-blue-600">{viewingBook.total - viewingBook.available}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Availability Rate</span>
                      <span className="font-medium">{Math.round((viewingBook.available / viewingBook.total) * 100)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-green-500 rounded-full h-2 transition-all"
                        style={{ width: `${(viewingBook.available / viewingBook.total) * 100}%` }}
                      />
                    </div>
                  </div>
                </Card>
              </div>

              <div className="p-6 border-t bg-muted/30 flex gap-3 justify-end">
                {viewingBook.available > 0 && !isAdmin && (
                  <Button onClick={() => {
                    handleQuickBorrow(viewingBook);
                    setIsViewDialogOpen(false);
                  }} className="px-6">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Borrow Now
                  </Button>
                )}
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)} className="px-6">
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Quick Borrow Dialog */}
      <Dialog open={isQuickBorrowDialogOpen} onOpenChange={setIsQuickBorrowDialogOpen}>
        <DialogContent className="!w-[90%] sm:!w-[550px] !max-w-[600px] max-h-[90vh] overflow-hidden p-0 !rounded-2xl">
          <div className="p-6 border-b">
            <DialogHeader className="text-left">
              <DialogTitle className="text-xl font-semibold">Borrow Book</DialogTitle>
              <DialogDescription className="text-sm mt-1">
                {selectedBookForBorrow && `Borrowing: ${selectedBookForBorrow.title}`}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex border-b">
            <button
              type="button"
              onClick={() => setQuickBorrowForm({ ...quickBorrowForm, studentId: '', manualStudentName: '' })}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${!quickBorrowForm.manualStudentName
                ? 'border-b-2 border-primary bg-primary/5 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
            >
              Select from List
            </button>
            <button
              type="button"
              onClick={() => setQuickBorrowForm({ ...quickBorrowForm, studentId: '', manualStudentName: '' })}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${quickBorrowForm.manualStudentName
                ? 'border-b-2 border-primary bg-primary/5 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
            >
              Add Manually
            </button>
          </div>

          <form onSubmit={handleSubmitQuickBorrow} className="flex flex-col h-full">
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {students.length > 0 && !quickBorrowForm.manualStudentName ? (
                <div>
                  <Label htmlFor="student-select" className="text-sm font-medium mb-2 block">
                    Select Student
                  </Label>
                  <select
                    id="student-select"
                    value={quickBorrowForm.studentId}
                    onChange={(e) => setQuickBorrowForm({ ...quickBorrowForm, studentId: e.target.value, manualStudentName: '' })}
                    className="flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                    required={!quickBorrowForm.manualStudentName}
                  >
                    <option value="">Choose a student...</option>
                    {students.map((student) => (
                      <option key={student._id} value={student.studentId}>
                        {student.name} ({student.studentId})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <Label htmlFor="manual-student" className="text-sm font-medium mb-2 block">
                    Student ID
                  </Label>
                  <Input
                    id="manual-student"
                    value={quickBorrowForm.manualStudentName}
                    onChange={(e) => setQuickBorrowForm({ ...quickBorrowForm, manualStudentName: e.target.value, studentId: '' })}
                    placeholder="Enter student ID"
                    className="h-11 rounded-lg"
                    required={!quickBorrowForm.studentId}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="borrow-date" className="text-sm font-medium mb-2 block">Borrow Date</Label>
                  <Input
                    id="borrow-date"
                    type="date"
                    value={quickBorrowForm.borrowDate}
                    onChange={(e) => setQuickBorrowForm({ ...quickBorrowForm, borrowDate: e.target.value })}
                    className="h-11 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="due-date" className="text-sm font-medium mb-2 block">Due Date</Label>
                  <Input
                    id="due-date"
                    type="date"
                    value={quickBorrowForm.dueDate}
                    onChange={(e) => setQuickBorrowForm({ ...quickBorrowForm, dueDate: e.target.value })}
                    min={quickBorrowForm.borrowDate}
                    className="h-11 rounded-lg"
                    required
                  />
                </div>
              </div>

              {selectedBookForBorrow && (
                <Card className="p-4 bg-primary/5 border-primary/20">
                  <h4 className="text-sm font-semibold mb-3">Selected Book</h4>
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded overflow-hidden shrink-0 flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-primary/40" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm mb-1">{selectedBookForBorrow.title}</p>
                      <p className="text-xs text-muted-foreground mb-2">{selectedBookForBorrow.author}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">{selectedBookForBorrow.category}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {selectedBookForBorrow.available} available
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            <div className="p-6 border-t bg-muted/30 flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsQuickBorrowDialogOpen(false)} className="px-6">
                Cancel
              </Button>
              <Button type="submit" className="px-6">
                Confirm Borrow
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
