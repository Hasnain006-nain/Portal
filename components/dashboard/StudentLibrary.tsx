import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { booksApi, requestsApi } from '../../lib/apiClient';
import { Search, BookOpen, Loader2, Clock, CheckCircle, XCircle, AlertCircle, User, Calendar, Package, ArrowLeft, Filter, X, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface StudentLibraryProps {
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

interface BorrowRequest {
  id: string;
  book_id: string;
  book_title: string;
  book_author: string;
  type: 'borrow' | 'return';
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  admin_note?: string;
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

export function StudentLibrary({ onTabChange }: StudentLibraryProps = {}) {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [myRequests, setMyRequests] = useState<BorrowRequest[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBookDialogOpen, setIsBookDialogOpen] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [activeTab, setActiveTab] = useState<'browse' | 'borrowed'>('browse');

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterBooks();
  }, [books, searchTerm, filterCategory]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch books
      const booksData = await booksApi.getAll();
      setBooks(booksData);

      // Fetch user's requests
      try {
        const requestsData = await requestsApi.getByStudentId(currentUser.email);
        setMyRequests(requestsData || []);
      } catch (requestError) {
        console.warn('Could not load requests:', requestError);
        setMyRequests([]);
      }
    } catch (error: any) {
      toast.error('Failed to load library data');
      console.error('Error loading library:', error);
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

  const handleBorrowRequest = async (book: Book) => {
    if (submittingRequest === book.id) return;

    // Check if book has available copies
    if (book.available_copies <= 0) {
      toast.error('All copies of this book are currently borrowed');
      return;
    }

    // Check if student already has a pending request for this book
    const hasPendingRequest = myRequests.some(
      req => req.book_id === book.id && req.type === 'borrow' && req.status === 'pending'
    );

    if (hasPendingRequest) {
      toast.error('You already have a pending borrow request for this book');
      return;
    }

    // Check if student currently has this book borrowed
    const activeBorrowRequest = myRequests.find(
      req => req.book_id === book.id && req.type === 'borrow' && req.status === 'approved'
    );

    if (activeBorrowRequest) {
      const hasReturnedBook = myRequests.some(
        req => req.type === 'return' && req.status === 'approved'
      );

      if (!hasReturnedBook) {
        toast.error('You already have this book borrowed');
        return;
      }
    }

    try {
      setSubmittingRequest(book.id);
      
      const requestData = {
        type: 'borrow',
        book_id: book.id,
        book_title: book.title,
        book_author: book.author,
        student_email: currentUser.email,
        student_name: currentUser.name
      };

      await requestsApi.create(requestData);
      toast.success('Borrow request submitted successfully!');
      fetchData(); // Refresh data
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit borrow request');
    } finally {
      setSubmittingRequest(null);
    }
  };

  const handleReturnRequest = async (borrowRequest: BorrowRequest) => {
    try {
      const requestData = {
        type: 'return',
        book_id: borrowRequest.book_id,
        book_title: borrowRequest.book_title,
        book_author: borrowRequest.book_author,
        student_email: currentUser.email,
        student_name: currentUser.name
      };

      await requestsApi.create(requestData);
      toast.success('Return request submitted successfully!');
      fetchData(); // Refresh data
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit return request');
    }
  };

  const handleViewBook = (book: Book) => {
    setSelectedBook(book);
    setIsBookDialogOpen(true);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCategory('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200 dark:text-yellow-300 dark:border-yellow-800';
      case 'approved': return 'bg-green-500/10 text-green-700 border-green-200 dark:text-green-300 dark:border-green-800';
      case 'rejected': return 'bg-red-500/10 text-red-700 border-red-200 dark:text-red-300 dark:border-red-800';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200 dark:text-gray-300 dark:border-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getAvailabilityColor = (available: number, total: number) => {
    const ratio = available / total;
    if (ratio === 0) return 'bg-red-500/10 text-red-700 border-red-200 dark:text-red-300 dark:border-red-800';
    if (ratio < 0.3) return 'bg-yellow-500/10 text-yellow-700 border-yellow-200 dark:text-yellow-300 dark:border-yellow-800';
    return 'bg-green-500/10 text-green-700 border-green-200 dark:text-green-300 dark:border-green-800';
  };

  // Get borrowed books (approved borrow requests without approved returns)
  const borrowedBooks = myRequests.filter(req => 
    req.type === 'borrow' && 
    req.status === 'approved' &&
    !myRequests.some(returnReq => 
      returnReq.type === 'return' && 
      returnReq.status === 'approved' && 
      returnReq.book_id === req.book_id
    )
  );

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
          <h1 className="text-3xl font-bold">Library</h1>
          <p className="text-muted-foreground mt-1">Browse and borrow books from our collection</p>
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
            <Package className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Available</p>
              <p className="text-2xl font-bold">{books.reduce((sum, book) => sum + book.available_copies, 0)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-blue-500/5 border-blue-500/20">
          <div className="flex items-center gap-3">
            <User className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">My Borrowed</p>
              <p className="text-2xl font-bold">{borrowedBooks.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-yellow-500/5 border-yellow-500/20">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-sm text-muted-foreground">Pending Requests</p>
              <p className="text-2xl font-bold">{myRequests.filter(r => r.status === 'pending').length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === 'browse' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('browse')}
          className="rounded-md"
        >
          Browse Books
        </Button>
        <Button
          variant={activeTab === 'borrowed' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('borrowed')}
          className="rounded-md"
        >
          My Books ({borrowedBooks.length})
        </Button>
      </div>

      {activeTab === 'browse' && (
        <>
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
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewBook(book)}
                        className="h-8 w-8 p-0 hover:bg-primary hover:text-primary-foreground"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
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
                        onClick={() => handleBorrowRequest(book)}
                        disabled={book.available_copies <= 0 || submittingRequest === book.id}
                        className="hover:bg-primary/90 transition-colors"
                      >
                        {submittingRequest === book.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Requesting...
                          </>
                        ) : (
                          'Request Borrow'
                        )}
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
              <p className="text-muted-foreground">
                {searchTerm || filterCategory
                  ? 'Try adjusting your search or filters'
                  : 'No books are available in the library'}
              </p>
            </Card>
          )}
        </>
      )}

      {activeTab === 'borrowed' && (
        <div className="space-y-6">
          {/* Borrowed Books */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Currently Borrowed Books</h3>
            {borrowedBooks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {borrowedBooks.map((request) => (
                  <Card key={request.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{request.book_title}</h4>
                        <p className="text-sm text-muted-foreground">by {request.book_author}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={getStatusColor(request.status)}>
                            {getStatusIcon(request.status)}
                            <span className="ml-1">{request.status}</span>
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Borrowed: {new Date(request.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReturnRequest(request)}
                        className="hover:bg-primary hover:text-primary-foreground"
                      >
                        Request Return
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="text-lg font-semibold mb-2">No borrowed books</h4>
                <p className="text-muted-foreground">You haven't borrowed any books yet</p>
              </Card>
            )}
          </div>

          {/* Request History */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Request History</h3>
            {myRequests.length > 0 ? (
              <div className="space-y-3">
                {myRequests.map((request) => (
                  <Card key={request.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {request.type}
                          </Badge>
                          <Badge className={getStatusColor(request.status)}>
                            {getStatusIcon(request.status)}
                            <span className="ml-1">{request.status}</span>
                          </Badge>
                        </div>
                        <h4 className="font-medium">{request.book_title}</h4>
                        <p className="text-sm text-muted-foreground">by {request.book_author}</p>
                        {request.admin_note && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Note: {request.admin_note}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="text-lg font-semibold mb-2">No request history</h4>
                <p className="text-muted-foreground">Your library requests will appear here</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* View Book Dialog */}
      <Dialog open={isBookDialogOpen} onOpenChange={setIsBookDialogOpen}>
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
                    <p className="text-sm font-medium">Publisher</p>
                    <p className="text-sm text-muted-foreground">{selectedBook.publisher}</p>
                  </div>
                )}
                {selectedBook.isbn && (
                  <div>
                    <p className="text-sm font-medium">ISBN</p>
                    <p className="text-sm text-muted-foreground">{selectedBook.isbn}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">Availability</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedBook.available_copies} of {selectedBook.total_copies} copies available
                  </p>
                </div>
                <div className="pt-4">
                  <Button
                    onClick={() => {
                      setIsBookDialogOpen(false);
                      handleBorrowRequest(selectedBook);
                    }}
                    disabled={selectedBook.available_copies <= 0}
                    className="w-full"
                  >
                    {selectedBook.available_copies > 0 ? 'Request Borrow' : 'Out of Stock'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}