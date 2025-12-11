import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { requestsApi } from '../../lib/apiClient';
import { Clock, CheckCircle, XCircle, Loader2, BookOpen, GraduationCap, AlertCircle, Users } from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ExportButton } from '../ui/export-button';

interface RequestsManagementProps {
    onTabChange?: (tab: string) => void;
}

export function RequestsManagement({ onTabChange }: RequestsManagementProps = {}) {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [adminNote, setAdminNote] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const data = await requestsApi.getAll();
            setRequests(data);
        } catch (error: any) {
            toast.error('Failed to load requests');
            console.error('Error loading requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (request: any) => {
        setProcessing(true);
        try {
            await requestsApi.updateStatus(request._id, 'approved', adminNote);
            toast.success('Request approved successfully!');
            setIsDialogOpen(false);
            setSelectedRequest(null);
            setAdminNote('');
            fetchRequests();

            // Trigger notification update
            window.dispatchEvent(new Event('requestsUpdated'));
        } catch (error: any) {
            toast.error(error.message || 'Failed to approve request');
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async (request: any) => {
        if (!adminNote.trim()) {
            toast.error('Please provide a reason for rejection');
            return;
        }

        setProcessing(true);
        try {
            await requestsApi.updateStatus(request._id, 'rejected', adminNote);

            // If rejecting a new_user request, delete the user account
            if (request.type === 'new_user') {
                try {
                    // Call API to delete the user account
                    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3006/api'}/auth/delete-user`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ email: request.studentEmail }),
                    });

                    if (response.ok) {
                        toast.success('Registration rejected and user account deleted');
                    } else {
                        toast.success('Request rejected');
                    }
                } catch (deleteError) {
                    console.error('Failed to delete user account:', deleteError);
                    toast.success('Request rejected');
                }
            } else {
                toast.success('Request rejected');
            }

            setIsDialogOpen(false);
            setSelectedRequest(null);
            setAdminNote('');
            fetchRequests();

            // Trigger notification update
            window.dispatchEvent(new Event('requestsUpdated'));
        } catch (error: any) {
            toast.error(error.message || 'Failed to reject request');
        } finally {
            setProcessing(false);
        }
    };

    const openRequestDialog = (request: any) => {
        setSelectedRequest(request);
        setAdminNote('');
        setIsDialogOpen(true);
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

    const getRequestIcon = (type: string) => {
        switch (type) {
            case 'borrow':
            case 'return':
                return <BookOpen className="h-5 w-5 text-blue-500" />;
            case 'enroll':
                return <GraduationCap className="h-5 w-5 text-green-500" />;
            case 'support':
                return <AlertCircle className="h-5 w-5 text-orange-500" />;
            case 'new_user':
                return <Users className="h-5 w-5 text-purple-500" />;
            default:
                return <AlertCircle className="h-5 w-5 text-gray-500" />;
        }
    };

    const pendingRequests = requests.filter(r => r.status === 'pending');
    const approvedRequests = requests.filter(r => r.status === 'approved');
    const rejectedRequests = requests.filter(r => r.status === 'rejected');

    const borrowRequests = requests.filter(r => r.type === 'borrow');
    const returnRequests = requests.filter(r => r.type === 'return');
    const enrollRequests = requests.filter(r => r.type === 'enroll');

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const RequestCard = ({ request }: { request: any }) => (
        <Card className="p-4">
            <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    {getRequestIcon(request.type)}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="outline" className="text-xs capitalize">{request.type}</Badge>
                        {getRequestStatusBadge(request.status)}
                    </div>
                    <p className="font-medium">
                        {request.type === 'enroll' ? request.courseName :
                            request.type === 'support' ? request.subject :
                                request.type === 'new_user' ? request.subject :
                                    request.bookTitle}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {request.type === 'enroll' ? request.courseCode :
                            request.type === 'support' ? request.message :
                                request.type === 'new_user' ? request.message :
                                    request.bookAuthor}
                    </p>
                    <div className="mt-2 space-y-1">
                        <p className="text-xs text-muted-foreground">
                            <span className="font-medium">Student:</span> {request.studentName} ({request.studentEmail})
                        </p>
                        <p className="text-xs text-muted-foreground">
                            <span className="font-medium">Requested:</span> {new Date(request.requestedAt || request.createdAt).toLocaleString()}
                        </p>
                        {request.processedAt && (
                            <p className="text-xs text-muted-foreground">
                                <span className="font-medium">Processed:</span> {new Date(request.processedAt).toLocaleString()}
                            </p>
                        )}
                        {request.adminNote && (
                            <p className="text-xs text-muted-foreground italic">
                                <span className="font-medium">Admin note:</span> {request.adminNote}
                            </p>
                        )}
                    </div>
                    {request.status === 'pending' && (
                        <div className="flex gap-2 mt-3">
                            {request.type === 'new_user' ? (
                                <>
                                    <Button
                                        size="sm"
                                        variant="default"
                                        onClick={() => {
                                            // Store user info for pre-filling
                                            localStorage.setItem('newUserToComplete', JSON.stringify({
                                                email: request.studentEmail,
                                                name: request.studentName
                                            }));
                                            // Navigate to Students page
                                            onTabChange?.('students');
                                        }}
                                        className="flex-1"
                                    >
                                        <Users className="h-3 w-3 mr-1" />
                                        Complete Profile
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => openRequestDialog(request)}
                                        className="flex-1"
                                    >
                                        <XCircle className="h-3 w-3 mr-1" />
                                        Reject
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        size="sm"
                                        variant="default"
                                        onClick={() => openRequestDialog(request)}
                                        className="flex-1"
                                    >
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Approve
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => openRequestDialog(request)}
                                        className="flex-1"
                                    >
                                        <XCircle className="h-3 w-3 mr-1" />
                                        Reject
                                    </Button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );

    const handleExport = async (): Promise<boolean> => {
        try {
            const { exportRequests } = await import('../../lib/exportUtils');
            await exportRequests(requests);
            return true;
        } catch (error) {
            console.error('Export error:', error);
            throw error;
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6 w-full max-w-full">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl">Requests Management</h1>
                    <p className="text-muted-foreground mt-1 text-sm sm:text-base">Manage student requests for library and courses</p>
                </div>
                <ExportButton onExport={handleExport} label="Export Requests" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <Card className="p-4">
                    <p className="text-muted-foreground text-xs sm:text-sm">Total Requests</p>
                    <h2 className="mt-1 text-xl sm:text-2xl">{requests.length}</h2>
                </Card>
                <Card className="p-4">
                    <p className="text-muted-foreground text-xs sm:text-sm">Pending</p>
                    <h2 className="mt-1 text-xl sm:text-2xl text-yellow-600">{pendingRequests.length}</h2>
                </Card>
                <Card className="p-4">
                    <p className="text-muted-foreground text-xs sm:text-sm">Approved</p>
                    <h2 className="mt-1 text-xl sm:text-2xl text-green-600">{approvedRequests.length}</h2>
                </Card>
                <Card className="p-4">
                    <p className="text-muted-foreground text-xs sm:text-sm">Rejected</p>
                    <h2 className="mt-1 text-xl sm:text-2xl text-red-600">{rejectedRequests.length}</h2>
                </Card>
            </div>

            {/* Pending Requests Alert */}
            {pendingRequests.length > 0 && (
                <Card className="p-4 bg-yellow-500/10 border-yellow-500/20">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                        <div>
                            <h4 className="text-yellow-700 font-medium">{pendingRequests.length} request(s) awaiting your review</h4>
                            <p className="text-muted-foreground text-sm mt-1">Please review and approve/reject pending requests</p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Tabs */}
            <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="pending">Pending ({pendingRequests.length})</TabsTrigger>
                    <TabsTrigger value="all">All ({requests.length})</TabsTrigger>
                    <TabsTrigger value="borrow">Borrow ({borrowRequests.length})</TabsTrigger>
                    <TabsTrigger value="return">Return ({returnRequests.length})</TabsTrigger>
                    <TabsTrigger value="enroll">Enroll ({enrollRequests.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="mt-4">
                    {pendingRequests.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {pendingRequests.map(request => <RequestCard key={request._id} request={request} />)}
                        </div>
                    ) : (
                        <Card className="p-12 text-center">
                            <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No pending requests</p>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="all" className="mt-4">
                    {requests.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {requests.map(request => <RequestCard key={request._id} request={request} />)}
                        </div>
                    ) : (
                        <Card className="p-12 text-center">
                            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No requests found</p>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="borrow" className="mt-4">
                    {borrowRequests.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {borrowRequests.map(request => <RequestCard key={request._id} request={request} />)}
                        </div>
                    ) : (
                        <Card className="p-12 text-center">
                            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No borrow requests</p>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="return" className="mt-4">
                    {returnRequests.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {returnRequests.map(request => <RequestCard key={request._id} request={request} />)}
                        </div>
                    ) : (
                        <Card className="p-12 text-center">
                            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No return requests</p>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="enroll" className="mt-4">
                    {enrollRequests.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {enrollRequests.map(request => <RequestCard key={request._id} request={request} />)}
                        </div>
                    ) : (
                        <Card className="p-12 text-center">
                            <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No enrollment requests</p>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>

            {/* Request Action Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="!w-[90%] sm:!w-[500px] !max-w-[550px]">
                    <DialogHeader>
                        <DialogTitle>Review Request</DialogTitle>
                        <DialogDescription>
                            Approve or reject this {selectedRequest?.type} request
                        </DialogDescription>
                    </DialogHeader>

                    {selectedRequest && (
                        <div className="space-y-4">
                            <Card className="p-4 bg-muted/50">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Type:</span>
                                        <Badge variant="outline" className="capitalize">{selectedRequest.type}</Badge>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Student:</span>
                                        <span className="font-medium">{selectedRequest.studentName}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Email:</span>
                                        <span className="font-medium">{selectedRequest.studentEmail}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Item:</span>
                                        <span className="font-medium">
                                            {selectedRequest.type === 'enroll' ? selectedRequest.courseName : selectedRequest.bookTitle}
                                        </span>
                                    </div>
                                </div>
                            </Card>

                            <div>
                                <Label htmlFor="adminNote">Admin Note (Optional for approval, Required for rejection)</Label>
                                <Textarea
                                    id="adminNote"
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                    placeholder="Add a note for the student..."
                                    className="mt-2"
                                    rows={3}
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsDialogOpen(false)}
                                    className="flex-1"
                                    disabled={processing}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => handleReject(selectedRequest)}
                                    className="flex-1"
                                    disabled={processing}
                                >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    {processing ? 'Processing...' : 'Reject'}
                                </Button>
                                <Button
                                    variant="default"
                                    onClick={() => handleApprove(selectedRequest)}
                                    className="flex-1"
                                    disabled={processing}
                                >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    {processing ? 'Processing...' : 'Approve'}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
