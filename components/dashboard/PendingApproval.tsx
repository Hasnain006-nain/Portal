import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Clock, AlertCircle, Mail, CheckCircle, XCircle, User, Phone, Building, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

export function PendingApproval() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const isAdmin = currentUser.role === 'admin';

    const [pendingUsers, setPendingUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [studentId, setStudentId] = useState('');

    useEffect(() => {
        if (isAdmin) {
            fetchPendingUsers();
        } else {
            setLoading(false);
        }
    }, [isAdmin]);

    const fetchPendingUsers = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5001/api/auth/pending-users');
            const data = await response.json();
            setPendingUsers(data);
        } catch (error) {
            toast.error('Failed to load pending users');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = (user: any) => {
        setSelectedUser(user);
        // Generate student ID suggestion
        const year = new Date().getFullYear().toString().slice(-2);
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        setStudentId(`STU${year}${random}`);
        setIsDialogOpen(true);
    };

    const confirmApprove = async () => {
        try {
            const response = await fetch(`http://localhost:5001/api/auth/approve-user/${selectedUser.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ student_id: studentId })
            });

            if (!response.ok) throw new Error('Approval failed');

            toast.success(`${selectedUser.name} approved successfully!`);
            setIsDialogOpen(false);
            setSelectedUser(null);
            setStudentId('');
            fetchPendingUsers();
        } catch (error) {
            toast.error('Failed to approve user');
        }
    };

    const handleReject = async (userId: number, userName: string) => {
        if (!confirm(`Are you sure you want to reject ${userName}'s registration?`)) return;

        try {
            const response = await fetch(`http://localhost:5001/api/auth/reject-user/${userId}`, {
                method: 'POST'
            });

            if (!response.ok) throw new Error('Rejection failed');

            toast.success(`${userName}'s registration rejected`);
            fetchPendingUsers();
        } catch (error) {
            toast.error('Failed to reject user');
        }
    };

    // Admin view - show pending users
    if (isAdmin) {
        if (loading) {
            return (
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            );
        }

        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Pending Approvals</h1>
                    <p className="text-muted-foreground">
                        Review and approve new student registrations
                    </p>
                </div>

                {pendingUsers.length === 0 ? (
                    <Card className="p-12 text-center">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
                        <p className="text-muted-foreground">
                            No pending user registrations at the moment.
                        </p>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {pendingUsers.map((user) => (
                            <Card key={user.id} className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                                <User className="h-6 w-6 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold">{user.name}</h3>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Mail className="h-3 w-3" />
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                            {user.phone && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                                    <span>{user.phone}</span>
                                                </div>
                                            )}
                                            {user.department && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Building className="h-4 w-4 text-muted-foreground" />
                                                    <span>{user.department}</span>
                                                </div>
                                            )}
                                            {user.year && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    <span>Year {user.year}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 text-sm">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <span>{new Date(user.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 ml-4">
                                        <Button
                                            size="sm"
                                            onClick={() => handleApprove(user)}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Approve
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleReject(user.id, user.name)}
                                        >
                                            <XCircle className="h-4 w-4 mr-2" />
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Approval Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Approve Student Registration</DialogTitle>
                            <DialogDescription>
                                Assign a student ID to complete the registration
                            </DialogDescription>
                        </DialogHeader>

                        {selectedUser && (
                            <div className="space-y-4">
                                <div className="p-4 bg-muted rounded-lg">
                                    <p className="text-sm font-medium mb-1">{selectedUser.name}</p>
                                    <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                                    {selectedUser.department && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {selectedUser.department} - Year {selectedUser.year}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="studentId">Student ID</Label>
                                    <Input
                                        id="studentId"
                                        value={studentId}
                                        onChange={(e) => setStudentId(e.target.value)}
                                        placeholder="e.g., STU2024001"
                                        className="mt-2"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        This will be the student's unique identifier
                                    </p>
                                </div>

                                <div className="flex gap-2 justify-end">
                                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={confirmApprove} disabled={!studentId}>
                                        Confirm Approval
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    // Student view - pending approval message
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <Card className="p-8 shadow-xl">
                    <div className="text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="inline-flex h-16 w-16 bg-yellow-500/10 rounded-full items-center justify-center mb-6"
                        >
                            <Clock className="h-8 w-8 text-yellow-600" />
                        </motion.div>

                        <h1 className="text-2xl font-bold mb-3">Account Pending Approval</h1>
                        <p className="text-muted-foreground mb-6">
                            Thank you for registering, <span className="font-semibold text-foreground">{currentUser.name}</span>!
                        </p>

                        <Card className="p-4 bg-yellow-500/5 border-yellow-500/20 mb-6">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                                <div className="text-left">
                                    <p className="text-sm text-yellow-700 font-medium mb-1">
                                        Your account is awaiting admin approval
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        An administrator will review your registration and complete your student profile.
                                        You'll be able to access all features once approved.
                                    </p>
                                </div>
                            </div>
                        </Card>

                        <div className="space-y-3 text-sm text-muted-foreground">
                            <div className="flex items-center justify-center gap-2">
                                <Mail className="h-4 w-4" />
                                <span>{currentUser.email}</span>
                            </div>
                            <p className="text-xs">
                                This usually takes 24-48 hours. You'll receive a notification once your account is approved.
                            </p>
                        </div>
                    </div>
                </Card>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-center mt-6"
                >
                    <p className="text-xs text-muted-foreground">
                        Need help?{' '}
                        <a href="mailto:admin@university.edu" className="text-primary hover:underline">
                            Contact Support
                        </a>
                    </p>
                </motion.div>
            </motion.div>
        </div>
    );
}
