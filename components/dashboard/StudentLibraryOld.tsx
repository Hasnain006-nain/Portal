import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { booksApi, requestsApi } from '../../lib/apiClient';
import { Search, BookOpen, Loader2, Clock, CheckCircle, XCircle, AlertCircle, User, Calendar, Package } from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';

interface StudentLibraryProps {
    onTabChange?: (tab: string) => void;
}

export function StudentLibrary(_props: StudentLibraryProps = {}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [books, setBooks] = useState<any[]>([]);
    const [myRequests, setMyRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submittingRequest, setSubmittingRequest] = useState<string | null>(null);
    const [selectedBook, setSelectedBook] = useState<any | null>(null);
    const [isBookDialogOpen, setIsBookDialogOpen] = useState(false);

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const studentEmail = currentUser.email;

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch books (public)
            const booksData = await booksApi.getAll();
            setBooks(booksData);

            // Fetch requests (requires auth) - handle gracefully if fails
            try {
                const requestsData = await requestsApi.getByStudentId(studentEmail);
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

    const categories = ['all', ...Array.from(new Set(books.map(b => b.category)))];

    const filteredBooks = books.filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            book.author.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || book.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleBorrowRequest = async (book: any) => {
        if (submittingRequest === book._id) return; // Prevent duplicate submissions

        // Check if book has available copies
        const availableCopies = Number(book.available) || 0;
        if (availableCopies <= 0) {
            toast.error('All copies of this book are currently borrowed. Please wait for a copy to be returned.');
            return;
        }

        // Check if student already has a pending borrow request for this book
        const hasPendingRequest = myRequests.some(
            req => req.bookId === book._id && req.type === 'borrow' && req.status === 'pending'
        );

        if (hasPendingRequest) {
            toast.error('You already have a pending borrow request for this book');
            return;
        }

        // Check if student currently has this book borrowed (approved borrow with no return or pending return)
        const activeBorrowRequest = myRequests.find(
            req => req.bookId === book._id && req.type === 'borrow' && req.status === 'approved'
        );

        if (activeBorrowRequest) {
            // Check if there's an approved return for this borrow
            const hasReturnedBook = myRequests.some(
                req => req.borrowingId === activeBorrowRequest._id &&
                    req.type === 'return' &&
                    req.status === 'approved'
            );

            // If not returned, user still has the book
            if (!hasReturnedBook) {
                toast.error('You have already borrowed this book. Please return it first.');
                return;
            }
        }

        setSubmittingRequest(book._id);
        try {
            await requestsApi.create({
                type: 'borrow',
                studentId: studentEmail,
                studentName: currentUser.name,
                studentEmail: studentEmail,
                bookId: book._id,
                bookTitle: book.title,
                bookAuthor: book.author,
                requestedAt: new Date().toISOString()
            });

            toast.success('Borrow request submitted! Waiting for admin approval.');
            fetchData();

            // Trigger notification update for admins
            window.dispatchEvent(new Event('requestsUpdated'));
        } catch (error: any) {
            toast.error(error.message || 'Failed to submit request');
        } finally {
            setSubmittingRequest(null);
        }
    };

    const handleReturnRequest = async (borrowing: any) => {
        if (submittingRequest === borrowing._id) return; // Prevent duplicate submissions

        setSubmittingRequest(borrowing._id);
        try {
            await requestsApi.create({
                type: 'return',
                studentId: studentEmail,
                studentName: currentUser.name,
                studentEmail: studentEmail,
                bookId: borrowing.bookId,
                bookTitle: borrowing.bookTitle,
                borrowingId: borrowing._id,
                requestedAt: new Date().toISOString()
            });

            toast.success('Return request submitted! Waiting for admin approval.');
            fetchData();

            // Trigger notification update for admins
            window.dispatchEvent(new Event('requestsUpdated'));
        } catch (error: any) {
            toast.error(error.message || 'Failed to submit request');
        } finally {
            setSubmittingRequest(null);
        }
    };

    const getRequestStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                    <Clock className="h-3 w-3 mr-1" />
                    Pending
                </Badge>;
            case 'approved':
                return <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Approved
                </Badge>;
            case 'rejected':
                return <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-500/20">
                    <XCircle className="h-3 w-3 mr-1" />
                    Rejected
                </Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const borrowRequests = myRequests.filter(r => r.type === 'borrow');
    const returnRequests = myRequests.filter(r => r.type === 'return');

    // Active borrows are approved borrow requests that haven't been returned yet
    const activeBorrows = borrowRequests.filter(borrowReq => {
        if (borrowReq.status !== 'approved') return false;

        // Check if this borrow has an approved return
        const hasReturnedBook = returnRequests.some(
            returnReq => returnReq.borrowingId === borrowReq._id &&
                returnReq.status === 'approved'
        );

        return !hasReturnedBook; // Only include if not returned
    });

    const pendingRequests = myRequests.filter(r => r.status === 'pending');

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 w-full max-w-full">
            <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl">Library</h1>
                <p className="text-muted-foreground mt-1 text-sm sm:text-base">Browse and borrow books</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 sm:gap-4">
                <Card className="p-4">
                    <p className="text-muted-foreground text-xs sm:text-sm">Available Books</p>
                    <h2 className="mt-1 text-xl sm:text-2xl">{books.filter(b => (Number(b.available) || 0) > 0).length}</h2>
                    <p className="text-xs text-muted-foreground mt-1">
                        {books.reduce((sum, b) => sum + (Number(b.available) || 0), 0)} copies available
                    </p>
                </Card>
                <Card className="p-4">
                    <p className="text-muted-foreground text-xs sm:text-sm">My Borrowed</p>
                    <h2 className="mt-1 text-xl sm:text-2xl">{activeBorrows.length}</h2>
                </Card>
                <Card className="p-4">
                    <p className="text-muted-foreground text-xs sm:text-sm">Pending Requests</p>
                    <h2 className="mt-1 text-xl sm:text-2xl text-yellow-600">{pendingRequests.length}</h2>
                </Card>
                <Card className="p-4">
                    <p className="text-muted-foreground text-xs sm:text-sm">Total Requests</p>
                    <h2 className="mt-1 text-xl sm:text-2xl">{myRequests.length}</h2>
                </Card>
            </div>

            {/* Pending Requests Alert */}
            {pendingRequests.length > 0 && (
                <Card className="p-4 bg-yellow-500/10 border-yellow-500/20">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                        <div>
                            <h4 className="text-yellow-700 font-medium">You have {pendingRequests.length} pending request(s)</h4>
                            <p className="text-muted-foreground text-sm mt-1">Waiting for admin approval</p>
                        </div>
                    </div>
                </Card>
            )}

            {/* My Borrowed Books */}
            {activeBorrows.length > 0 && (
                <Card className="p-4 sm:p-6">
                    <h3 className="text-lg font-semibold mb-4">My Borrowed Books</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeBorrows.map((request) => (
                            <Card key={request._id} className="p-4 bg-blue-500/5 border-blue-500/20">
                                <div className="flex items-start gap-3">
                                    <div className="h-10 w-10 rounded bg-blue-500/10 flex items-center justify-center shrink-0">
                                        <BookOpen className="h-5 w-5 text-blue-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{request.bookTitle}</p>
                                        <p className="text-sm text-muted-foreground truncate">{request.bookAuthor}</p>
                                        <div className="mt-2">
                                            {getRequestStatusBadge(request.status)}
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="mt-3 w-full"
                                            onClick={() => handleReturnRequest(request)}
                                            disabled={returnRequests.some(r => r.borrowingId === request._id && r.status === 'pending')}
                                        >
                                            {returnRequests.some(r => r.borrowingId === request._id && r.status === 'pending')
                                                ? 'Return Pending'
                                                : 'Request Return'}
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </Card>
            )}

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
                            size="sm"
                        >
                            {category}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Book Details Dialog */}
            <Dialog open={isBookDialogOpen} onOpenChange={setIsBookDialogOpen}>
                <DialogContent className="!w-[95%] sm:!w-[600px] !max-w-[650px] max-h-[90vh] overflow-y-auto">
                    {selectedBook && (() => {
                        const hasPendingBorrow = myRequests.some(
                            req => req.bookId === selectedBook._id && req.type === 'borrow' && req.status === 'pending'
                        );
                        const hasActiveBorrow = activeBorrows.some(req => req.bookId === selectedBook._id);
                        const isAvailable = selectedBook.available > 0;
                        const availabilityRate = Math.round((selectedBook.available / selectedBook.total) * 100);

                        return (
                            <>
                                <DialogHeader>
                                    <div className="flex items-start gap-3">
                                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                            <BookOpen className="h-6 w-6 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <DialogTitle className="text-xl font-bold mb-2">{selectedBook.title}</DialogTitle>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Badge variant="secondary">{selectedBook.category}</Badge>
                                                {selectedBook.isbn && (
                                                    <Badge variant="outline">ISBN: {selectedBook.isbn}</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </DialogHeader>

                                <div className="space-y-4 py-4">
                                    {/* Book Info */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="flex items-start gap-3">
                                            <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium">Author</p>
                                                <p className="text-sm text-muted-foreground">{selectedBook.author}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium">Published</p>
                                                <p className="text-sm text-muted-foreground">{selectedBook.publishedYear || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium">Category</p>
                                                <p className="text-sm text-muted-foreground">{selectedBook.category}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium">Copies</p>
                                                <p className="text-sm text-muted-foreground">{selectedBook.available} available of {selectedBook.total} total</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    {selectedBook.description && (
                                        <div>
                                            <h4 className="text-sm font-semibold mb-2">Description</h4>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {selectedBook.description}
                                            </p>
                                        </div>
                                    )}

                                    {/* Availability Progress */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-sm font-semibold">Availability</h4>
                                            <span className="text-sm font-medium">{availabilityRate}%</span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2.5">
                                            <div
                                                className={`rounded-full h-2.5 transition-all ${availabilityRate === 0 ? 'bg-red-500' :
                                                    availabilityRate < 30 ? 'bg-yellow-500' :
                                                        'bg-green-500'
                                                    }`}
                                                style={{ width: `${availabilityRate}%` }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                                            <span>{selectedBook.total - selectedBook.available} borrowed</span>
                                            <span>{selectedBook.available} available</span>
                                        </div>
                                    </div>

                                    {/* Status Messages */}
                                    {hasActiveBorrow && (
                                        <Card className="p-3 bg-blue-500/10 border-blue-500/20">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-blue-600" />
                                                <p className="text-sm text-blue-700 font-medium">You have borrowed this book</p>
                                            </div>
                                        </Card>
                                    )}

                                    {hasPendingBorrow && !hasActiveBorrow && (
                                        <Card className="p-3 bg-yellow-500/10 border-yellow-500/20">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-yellow-600" />
                                                <p className="text-sm text-yellow-700 font-medium">Your borrow request is pending approval</p>
                                            </div>
                                        </Card>
                                    )}

                                    {!isAvailable && !hasActiveBorrow && !hasPendingBorrow && (
                                        <Card className="p-3 bg-red-500/10 border-red-500/20">
                                            <div className="flex items-center gap-2">
                                                <XCircle className="h-4 w-4 text-red-600" />
                                                <p className="text-sm text-red-700 font-medium">All copies are currently borrowed</p>
                                            </div>
                                        </Card>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 justify-end pt-4 border-t">
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsBookDialogOpen(false)}
                                    >
                                        Close
                                    </Button>
                                    {!hasActiveBorrow && !hasPendingBorrow && isAvailable && (
                                        <Button
                                            onClick={() => {
                                                handleBorrowRequest(selectedBook);
                                                setIsBookDialogOpen(false);
                                            }}
                                            disabled={submittingRequest === selectedBook._id}
                                        >
                                            {submittingRequest === selectedBook._id ? 'Submitting...' : 'Request to Borrow'}
                                        </Button>
                                    )}
                                </div>
                            </>
                        );
                    })()}
                </DialogContent>
            </Dialog>

            {/* Books Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-2">
                {filteredBooks.map((book) => {
                    const hasPendingBorrow = myRequests.some(
                        req => req.bookId === book._id && req.type === 'borrow' && req.status === 'pending'
                    );
                    const hasActiveBorrow = activeBorrows.some(req => req.bookId === book._id);
                    const isAvailable = book.available > 0;

                    return (
                        <Card
                            key={book._id}
                            className="p-2 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => {
                                setSelectedBook(book);
                                setIsBookDialogOpen(true);
                            }}
                        >
                            <div className="flex items-start gap-2 mb-2">
                                <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                                    <BookOpen className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-medium truncate leading-tight">{book.title}</p>
                                    <p className="text-[9px] text-muted-foreground truncate">{book.author}</p>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[9px]">
                                    <span className="text-muted-foreground">Category</span>
                                    <Badge variant="secondary" className="text-[8px] px-1 py-0 h-3">{book.category}</Badge>
                                </div>
                                <div className="flex items-center justify-between text-[9px]">
                                    <span className="text-muted-foreground">Available</span>
                                    <span className={`font-medium ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                                        {book.available} / {book.total}
                                    </span>
                                </div>
                                <Button
                                    className="w-full mt-2 h-7 text-[10px]"
                                    size="sm"
                                    variant={!isAvailable && !hasActiveBorrow && !hasPendingBorrow ? 'destructive' : 'default'}
                                    disabled={!isAvailable || hasPendingBorrow || hasActiveBorrow || submittingRequest === book._id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleBorrowRequest(book);
                                    }}
                                >
                                    {submittingRequest === book._id ? 'Submitting...' :
                                        hasActiveBorrow ? '✓ Borrowed' :
                                            hasPendingBorrow ? '⏳ Pending' :
                                                !isAvailable ? '❌ All Borrowed' :
                                                    'Request to Borrow'}
                                </Button>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {filteredBooks.length === 0 && (
                <Card className="p-12 text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No books found matching your criteria</p>
                </Card>
            )}

            {/* My Requests History */}
            <Card className="p-4 sm:p-6">
                <h3 className="text-lg font-semibold mb-4">My Request History</h3>
                {myRequests.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {myRequests.map((request) => (
                            <Card key={request._id} className="p-4">
                                <div className="flex items-start gap-3">
                                    <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
                                        <BookOpen className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <Badge variant="outline" className="text-xs capitalize">
                                                {request.type === 'borrow' ? 'Borrow' : 'Return'}
                                            </Badge>
                                            {getRequestStatusBadge(request.status)}
                                        </div>
                                        <p className="font-medium truncate">{request.bookTitle}</p>
                                        <p className="text-sm text-muted-foreground truncate">{request.bookAuthor}</p>
                                        <div className="mt-2 space-y-1">
                                            <p className="text-xs text-muted-foreground">
                                                <span className="font-medium">Requested:</span> {new Date(request.requestedAt || request.createdAt).toLocaleDateString()}
                                            </p>
                                            {request.processedAt && (
                                                <p className="text-xs text-muted-foreground">
                                                    <span className="font-medium">Processed:</span> {new Date(request.processedAt).toLocaleDateString()}
                                                </p>
                                            )}
                                            {request.adminNote && (
                                                <p className="text-xs text-muted-foreground italic">
                                                    <span className="font-medium">Note:</span> {request.adminNote}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center py-8">No requests yet</p>
                )}
            </Card>
        </div>
    );
}
