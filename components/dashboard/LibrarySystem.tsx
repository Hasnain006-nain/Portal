import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { booksApi } from '../../lib/apiClient';
import { Search, BookOpen, AlertCircle, Loader2, ArrowLeft, Plus, Eye, Edit, Trash2, Filter, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface LibrarySystemProps {
  onTabChange?: (tab: string) => void;
}

interface Book {
  id: string;
  isbn?: string;
  title: string;
  author: string;
  publisher?: string;
  category: string;
  total_copies: number;
  available_copies: number;
  created_at: string;
}

interface FormData {
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  category: string;
  total_copies: string;
}

const categories = [
  'Computer Science',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Literature',
  'History',
  'Economics',
  'Psychology',
  'Engineering'
];

export function LibrarySystem({ onTabChange }: LibrarySystemProps = {}) {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const [formData, setFormData] = useState<FormData>({
    isbn: '',
    title: '',
    author: '',
    publisher: '',
    category: '',
    total_copies: '1'
  });

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const isAdmin = currentUser.role === 'admin';

  useEffect(() => {
    fetchBooks();
  }, []);

  useEffect(() => {
    filterBooks();
  }, [books, searchTerm, filterCategory]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const data = await booksApi.getAll();
      setBooks(data);
    } catch (error: any) {
      toast.error('Failed to load books');
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBooks = () => {
    let filtered = books;

    if (searchTerm) {
      filtered = filtered.filter(book =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.isbn?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterCategory) {
      filtered = filtered.filter(book => book.category === filterCategory);
    }

    setFilteredBooks(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const bookData = {
        isbn: formData.isbn,
        title: formData.title,
        author: formData.author,
        publisher: formData.publisher,
        category: formData.category,
        total_copies: parseInt(formData.total_copies),
        available_copies: parseInt(formData.total_copies)
      };

      if (editingBook) {
        await booksApi.update(editingBook.id, bookData);
        toast.success('Book updated successfully!');
      } else {
        await booksApi.create(bookData);
        toast.success('Book added successfully!');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchBooks();
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (book: Book) => {
    setEditingBook(book);
    setFormData({
      isbn: book.isbn || '',
      title: book.title,
      author: book.author,
      publisher: book.publisher || '',
      category: book.category,
      total_copies: book.total_copies.toString()
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (book: Book) => {
    if (!confirm(`Are you sure you want to delete "${book.title}"?`)) return;

    try {
      await booksApi.delete(book.id);
      toast.success('Book deleted successfully!');
      fetchBooks();
    } catch (error: any) {
      toast.error(error.message || 'Delete failed');
    }
  };

  const handleView = (book: Book) => {
    setSelectedBook(book);
    setIsViewDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      isbn: '',
      title: '',
      author: '',
      publisher: '',
      category: '',
      total_copies: '1'
    });
    setEditingBook(null);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCategory('');
  };

  const getAvailabilityColor = (available: number, total: number) => {
    const ratio = available / total;
    if (ratio === 0) return 'bg-red-500/10 text-red-700 border-red-200 dark:text-red-300 dark:border-red-800';
    if (ratio < 0.3) return 'bg-yellow-500/10 text-yellow-700 border-yellow-200 dark:text-yellow-300 dark:border-yellow-800';
    return 'bg-green-500/10 text-green-700 border-green-200 dark:text-green-300 dark:border-green-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-8 w-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 w-full max-w-full"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Library System</h1>
          <p className="text-muted-foreground mt-1">Manage books and library resources</p>
        </div>
        <div className="flex items-center gap-2">
          {onTabChange && (
            <Button 
              variant="outline" 
              onClick={() => onTabChange('dashboard')}
              className="hover:bg-accent transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          {isAdmin && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={resetForm}
                  className="bg-primary hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Book
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingBook ? 'Edit Book' : 'Add New Book'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingBook ? 'Update book information' : 'Add a new book to the library'}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="isbn">ISBN</Label>
                    <Input
                      id="isbn"
                      value={formData.isbn}
                      onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                      placeholder="Enter ISBN"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter book title"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="author">Author *</Label>
                    <Input
                      id="author"
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      placeholder="Enter author name"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="publisher">Publisher</Label>
                    <Input
                      id="publisher"
                      value={formData.publisher}
                      onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                      placeholder="Enter publisher name"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="total_copies">Total Copies *</Label>
                    <Input
                      id="total_copies"
                      type="number"
                      min="1"
                      value={formData.total_copies}
                      onChange={(e) => setFormData({ ...formData, total_copies: e.target.value })}
                      placeholder="Enter number of copies"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {editingBook ? 'Updating...' : 'Adding...'}
                        </>
                      ) : (
                        editingBook ? 'Update Book' : 'Add Book'
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Books</p>
              <p className="text-2xl font-bold">{books.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-green-500/5 border-green-500/20">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Available</p>
              <p className="text-2xl font-bold">{books.reduce((sum, book) => sum + book.available_copies, 0)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-blue-500/5 border-blue-500/20">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Total Copies</p>
              <p className="text-2xl font-bold">{books.reduce((sum, book) => sum + book.total_copies, 0)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-purple-500/5 border-purple-500/20">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-sm text-muted-foreground">Categories</p>
              <p className="text-2xl font-bold">{new Set(books.map(b => b.category)).size}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search books..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(searchTerm || filterCategory) && (
            <Button variant="outline" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </Card>

      {/* Books Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredBooks.map((book) => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-6 hover:shadow-lg transition-all border-2 hover:border-primary/20">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {book.category}
                      </Badge>
                      <Badge className={getAvailabilityColor(book.available_copies, book.total_copies)}>
                        {book.available_copies}/{book.total_copies} available
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-lg mb-1 line-clamp-2">{book.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">by {book.author}</p>
                    {book.publisher && (
                      <p className="text-xs text-muted-foreground">{book.publisher}</p>
                    )}
                    {book.isbn && (
                      <p className="text-xs text-muted-foreground mt-1">ISBN: {book.isbn}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleView(book)}
                      className="h-8 w-8 p-0 hover:bg-primary hover:text-primary-foreground"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {isAdmin && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(book)}
                          className="h-8 w-8 p-0 hover:bg-primary hover:text-primary-foreground"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(book)}
                          className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {book.available_copies > 0 ? (
                      <Badge className="bg-green-500/10 text-green-700 border-green-200">
                        Available
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500/10 text-red-700 border-red-200">
                        Out of Stock
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(book)}
                    className="hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    View Details
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredBooks.length === 0 && (
        <Card className="p-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No books found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || filterCategory
              ? 'Try adjusting your search or filters'
              : 'No books have been added to the library yet'}
          </p>
          {isAdmin && !searchTerm && !filterCategory && (
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Book
            </Button>
          )}
        </Card>
      )}

      {/* View Book Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md">
          {selectedBook && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedBook.title}</DialogTitle>
                <DialogDescription>
                  by {selectedBook.author}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{selectedBook.category}</Badge>
                  <Badge className={getAvailabilityColor(selectedBook.available_copies, selectedBook.total_copies)}>
                    {selectedBook.available_copies}/{selectedBook.total_copies} available
                  </Badge>
                </div>
                {selectedBook.publisher && (
                  <div>
                    <Label className="text-sm font-medium">Publisher</Label>
                    <p className="text-sm text-muted-foreground">{selectedBook.publisher}</p>
                  </div>
                )}
                {selectedBook.isbn && (
                  <div>
                    <Label className="text-sm font-medium">ISBN</Label>
                    <p className="text-sm text-muted-foreground">{selectedBook.isbn}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium">Availability</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedBook.available_copies} of {selectedBook.total_copies} copies available
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Added</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedBook.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}