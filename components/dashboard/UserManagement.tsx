import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

import { Users, Plus, Edit, Trash2, Loader2, Shield, Mail, Phone, Building } from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';

export function UserManagement() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        role: 'teacher',
        department: '',
        hostel_id: '',
        room_id: ''
    });

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const isAdmin = currentUser.role === 'admin';

    useEffect(() => {
        if (isAdmin) {
            fetchUsers();
        }
    }, [isAdmin]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5002/api/auth/users');
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Failed to fetch users' }));
                throw new Error(errorData.error || 'Failed to fetch users');
            }
            
            const data = await response.json();
            
            // Ensure data is an array
            if (Array.isArray(data)) {
                setUsers(data);
            } else {
                console.error('Invalid data format:', data);
                setUsers([]);
                toast.error('Invalid data format received');
            }
        } catch (error: any) {
            console.error('Failed to load users:', error);
            setUsers([]);
            toast.error(error.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const url = editingUser
                ? `http://localhost:5002/api/auth/users/${editingUser.id}`
                : 'http://localhost:5002/api/auth/create-user';

            const method = editingUser ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    name: `${formData.first_name} ${formData.last_name}`
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Operation failed');
            }

            toast.success(editingUser ? 'User updated successfully!' : 'User created successfully!');
            setIsDialogOpen(false);
            resetForm();
            fetchUsers();
        } catch (error: any) {
            toast.error(error.message || 'Operation failed');
        }
    };

    const handleEdit = (user: any) => {
        setEditingUser(user);
        setFormData({
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            email: user.email || '',
            phone: user.phone || '',
            password: '',
            role: user.role || 'teacher',
            department: user.department || '',
            hostel_id: user.hostel_id || '',
            room_id: user.room_id || ''
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: number, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}?`)) return;

        try {
            const response = await fetch(`http://localhost:5002/api/auth/users/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Delete failed');

            toast.success('User deleted successfully!');
            fetchUsers();
        } catch (error) {
            toast.error('Failed to delete user');
        }
    };

    const resetForm = () => {
        setFormData({
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            password: '',
            role: 'teacher',
            department: '',
            hostel_id: '',
            room_id: ''
        });
        setEditingUser(null);
    };

    if (!isAdmin) {
        return null;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Filter only admin and teacher users
    const administrationUsers = users.filter(u => u.role === 'admin' || u.role === 'teacher');
    const admins = administrationUsers.filter(u => u.role === 'admin');
    const teachers = administrationUsers.filter(u => u.role === 'teacher');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Administration Users</h2>
                    <p className="text-muted-foreground">Manage admin and teacher accounts</p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                </Button>
            </div>

            {/* Admins */}
            <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-red-500" />
                    Administrators ({admins.length})
                </h3>
                <div className="grid gap-3">
                    {admins.map((user) => (
                        <Card key={user.id} className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                                        <Shield className="h-5 w-5 text-red-500" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">{user.name}</p>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Mail className="h-3 w-3" />
                                                {user.email}
                                            </span>
                                            {user.phone && (
                                                <span className="flex items-center gap-1">
                                                    <Phone className="h-3 w-3" />
                                                    {user.phone}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => handleEdit(user)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    {user.id !== currentUser.id && (
                                        <Button size="sm" variant="destructive" onClick={() => handleDelete(user.id, user.name)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Teachers */}
            <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    Teachers ({teachers.length})
                </h3>
                <div className="grid gap-3">
                    {teachers.map((user) => (
                        <Card key={user.id} className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                        <Users className="h-5 w-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">{user.name}</p>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Mail className="h-3 w-3" />
                                                {user.email}
                                            </span>
                                            {user.department && (
                                                <span className="flex items-center gap-1">
                                                    <Building className="h-3 w-3" />
                                                    {user.department}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => handleEdit(user)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleDelete(user.id, user.name)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Info Card */}
            <Card className="p-4 bg-muted/50">
                <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-blue-500" />
                    <div>
                        <p className="font-semibold">Total Administration Users: {administrationUsers.length}</p>
                        <p className="text-sm text-muted-foreground">Students are managed through registration approval system</p>
                    </div>
                </div>
            </Card>

            {/* Add/Edit User Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="!w-[90%] sm:!w-[600px] !max-w-[650px] max-h-[90vh] overflow-hidden p-0 !rounded-2xl">
                    <div className="p-6 border-b">
                        <DialogHeader className="text-left">
                            <DialogTitle className="text-xl font-semibold">{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
                            <DialogDescription className="text-sm mt-1">
                                {editingUser 
                                    ? 'Update user information. User can change their own password from their profile.' 
                                    : 'Create a new admin or teacher account. The user will be able to login with the email and password you set here.'}
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col h-full">
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="first_name" className="text-sm font-medium mb-2 block">First Name <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="first_name"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        placeholder="e.g., John"
                                        className="h-11 rounded-lg"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="last_name" className="text-sm font-medium mb-2 block">Last Name <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="last_name"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        placeholder="e.g., Doe"
                                        className="h-11 rounded-lg"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="email" className="text-sm font-medium mb-2 block">Email <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="e.g., john@example.com"
                                        className="h-11 rounded-lg"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="phone" className="text-sm font-medium mb-2 block">Phone</Label>
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="e.g., +1234567890"
                                        className="h-11 rounded-lg"
                                    />
                                </div>
                            </div>

                            {!editingUser && (
                                <div>
                                    <Label htmlFor="password" className="text-sm font-medium mb-2 block">Password <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="Enter password"
                                        className="h-11 rounded-lg"
                                        required={!editingUser}
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="role" className="text-sm font-medium mb-2 block">Role <span className="text-red-500">*</span></Label>
                                    <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                                        <SelectTrigger id="role" className="h-11 rounded-lg">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">Admin</SelectItem>
                                            <SelectItem value="teacher">Teacher</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="department" className="text-sm font-medium mb-2 block">Department</Label>
                                    <Input
                                        id="department"
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        placeholder="e.g., Computer Science"
                                        className="h-11 rounded-lg"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t bg-muted/30 flex gap-3 justify-end">
                            <Button type="button" variant="outline" onClick={() => {
                                setIsDialogOpen(false);
                                resetForm();
                            }} className="px-6">
                                Cancel
                            </Button>
                            <Button type="submit" className="px-6">
                                {editingUser ? 'Update' : 'Create'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
