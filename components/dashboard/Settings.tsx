import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { authApi } from '../../lib/apiClient';
import { Lock, User, Mail, Shield, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { UserManagement } from './UserManagement';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';

interface SettingsProps {
    onTabChange?: (tab: string) => void;
    onUserUpdate?: (user: any) => void;
}

export function Settings({ onUserUpdate }: SettingsProps = {}) {
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
    const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [profileForm, setProfileForm] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        department: ''
    });

    const [passwordForm, setPasswordForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [passwordSecurity, setPasswordSecurity] = useState<{
        isLeaked: boolean;
        leakCount: number;
        usedBefore: boolean;
        checking: boolean;
    }>({
        isLeaked: false,
        leakCount: 0,
        usedBefore: false,
        checking: false
    });



    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    const handleNameChange = async () => {
        if (!newName.trim()) {
            toast.error('Please enter a valid name');
            return;
        }

        setIsSubmitting(true);
        try {
            // Update in localStorage
            const updatedUser = { ...currentUser, name: newName };
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));

            // Call parent update if available
            if (onUserUpdate) {
                onUserUpdate(updatedUser);
            }

            toast.success('Name updated successfully!');
            setIsNameDialogOpen(false);
            setNewName('');

            // Trigger page refresh to show new name
            window.location.reload();
        } catch (error: any) {
            toast.error(error.message || 'Failed to update name');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Password validation
    const validatePassword = (password: string) => {
        const minLength = password.length >= 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        return {
            minLength,
            hasUpperCase,
            hasLowerCase,
            hasNumber,
            hasSpecialChar,
            isValid: minLength && hasUpperCase && hasLowerCase && hasNumber
        };
    };

    const passwordValidation = validatePassword(passwordForm.newPassword);
    const passwordsMatch = passwordForm.newPassword === passwordForm.confirmPassword;

    // Check password security when new password changes
    useEffect(() => {
        const checkSecurity = async () => {
            if (passwordForm.newPassword.length >= 8) {
                setPasswordSecurity(prev => ({ ...prev, checking: true }));
                try {
                    const result = await authApi.checkPasswordSecurity(
                        passwordForm.newPassword,
                        currentUser.email
                    );
                    setPasswordSecurity({
                        isLeaked: result.isLeaked,
                        leakCount: result.leakCount,
                        usedBefore: result.usedBefore,
                        checking: false
                    });
                } catch (error) {
                    console.error('Error checking password security:', error);
                    setPasswordSecurity(prev => ({ ...prev, checking: false }));
                }
            } else {
                setPasswordSecurity({
                    isLeaked: false,
                    leakCount: 0,
                    usedBefore: false,
                    checking: false
                });
            }
        };

        const debounce = setTimeout(checkSecurity, 500);
        return () => clearTimeout(debounce);
    }, [passwordForm.newPassword, currentUser.email]);



    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!passwordValidation.isValid) {
            toast.error('Password does not meet requirements');
            return;
        }

        if (!passwordsMatch) {
            toast.error('Passwords do not match');
            return;
        }

        if (passwordForm.oldPassword === passwordForm.newPassword) {
            toast.error('New password must be different from old password');
            return;
        }

        if (passwordSecurity.isLeaked) {
            toast.error(`This password has been exposed in ${passwordSecurity.leakCount.toLocaleString()} data breaches. Please choose a different password.`);
            return;
        }

        if (passwordSecurity.usedBefore) {
            toast.error('You have used this password before. Please choose a different password.');
            return;
        }

        setIsSubmitting(true);
        try {
            console.log('Attempting to change password for:', currentUser.email);
            await authApi.changePassword(
                currentUser.email,
                passwordForm.oldPassword,
                passwordForm.newPassword
            );

            toast.success('Password changed successfully!');
            setIsPasswordDialogOpen(false);
            resetPasswordForm();
        } catch (error: any) {
            console.error('Password change error:', error);
            const errorMessage = error.message || 'Failed to change password';
            toast.error(errorMessage);

            // Show helpful hints based on error
            if (errorMessage.includes('incorrect') || errorMessage.includes('Current password')) {
                toast.error('Hint: Make sure you\'re entering the password you used to login', { duration: 5000 });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetPasswordForm = () => {
        setPasswordForm({
            oldPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        setShowOldPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
    };

    const ValidationItem = ({ isValid, text }: { isValid: boolean; text: string }) => (
        <div className={`flex items-center gap-2 text-xs ${isValid ? 'text-green-600' : 'text-muted-foreground'}`}>
            {isValid ? (
                <CheckCircle2 className="h-3 w-3" />
            ) : (
                <XCircle className="h-3 w-3" />
            )}
            <span>{text}</span>
        </div>
    );

    return (
        <div className="space-y-4 sm:space-y-6 w-full max-w-full">
            <div>
                <h1 className="text-2xl sm:text-3xl">Settings</h1>
                <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                    Manage your account settings and preferences
                </p>
            </div>

            {/* User Profile Card */}
            <Card className="p-4 sm:p-6 bg-gradient-to-br from-primary/5 to-primary/10">
                <div className="flex items-start gap-4">
                    <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <User className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg sm:text-xl font-semibold mb-1">{currentUser.name}</h2>
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                            <Mail className="h-4 w-4" />
                            <p className="text-sm truncate">{currentUser.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-primary" />
                            <span className="text-xs sm:text-sm font-medium capitalize">{currentUser.role || 'Student'}</span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Settings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Profile Settings */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0 }}
                    whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                >
                    <Card className="p-4 sm:p-6 h-full">
                        <div className="flex items-start gap-3 mb-3">
                            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                <User className="h-5 w-5 text-blue-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="mb-2 text-lg font-semibold">Profile Settings</h3>
                                <p className="text-muted-foreground text-sm">
                                    Update your personal information and profile photo.
                                </p>
                            </div>
                        </div>
                        <Button
                            className="mt-4 w-full sm:w-auto"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                setNewName(currentUser.name);
                                setIsNameDialogOpen(true);
                            }}
                        >
                            Edit Name
                        </Button>
                    </Card>
                </motion.div>

                {/* Password & Security */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                >
                    <Card className="p-4 sm:p-6 h-full">
                        <div className="flex items-start gap-3 mb-3">
                            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                                <Lock className="h-5 w-5 text-green-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="mb-2 text-lg font-semibold">Password & Security</h3>
                                <p className="text-muted-foreground text-sm">
                                    Update your password and security settings.
                                </p>
                            </div>
                        </div>
                        <Button
                            className="mt-4 w-full sm:w-auto"
                            size="sm"
                            onClick={() => setIsPasswordDialogOpen(true)}
                        >
                            Change Password
                        </Button>
                    </Card>
                </motion.div>

                {/* Notification Preferences */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                >
                    <Card className="p-4 sm:p-6 h-full">
                        <div className="flex items-start gap-3 mb-3">
                            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                                <Mail className="h-5 w-5 text-purple-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="mb-2 text-lg font-semibold">Notification Preferences</h3>
                                <p className="text-muted-foreground text-sm">
                                    Manage how you receive notifications.
                                </p>
                            </div>
                        </div>
                        <Button className="mt-4 w-full sm:w-auto" size="sm" variant="outline">
                            Configure
                        </Button>
                    </Card>
                </motion.div>

                {/* Help & Support */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                >
                    <Card className="p-4 sm:p-6 h-full">
                        <div className="flex items-start gap-3 mb-3">
                            <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                                <Shield className="h-5 w-5 text-orange-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="mb-2 text-lg font-semibold">Help & Support</h3>
                                <p className="text-muted-foreground text-sm">
                                    Get help or contact support team.
                                </p>
                            </div>
                        </div>
                        <Button className="mt-4 w-full sm:w-auto" size="sm" variant="outline">
                            Contact Support
                        </Button>
                    </Card>
                </motion.div>
            </div>

            {/* Change Password Dialog */}
            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogContent className="!w-[90%] sm:!w-[500px] !max-w-[550px] max-h-[90vh] overflow-hidden p-0 !rounded-2xl">
                    <div className="p-6 border-b">
                        <DialogHeader className="text-left">
                            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                                <Lock className="h-5 w-5" />
                                Change Password
                            </DialogTitle>
                            <DialogDescription className="text-sm mt-1">
                                Update your password to keep your account secure
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <form onSubmit={handlePasswordChange} className="flex flex-col h-full">
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            {/* Old Password */}
                            <div>
                                <Label htmlFor="oldPassword" className="text-sm font-medium mb-2 block">
                                    Current Password <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="oldPassword"
                                        type={showOldPassword ? 'text' : 'password'}
                                        value={passwordForm.oldPassword}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                                        placeholder="Enter your current password"
                                        className="h-11 rounded-lg pr-10"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowOldPassword(!showOldPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* New Password */}
                            <div>
                                <Label htmlFor="newPassword" className="text-sm font-medium mb-2 block">
                                    New Password <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="newPassword"
                                        type={showNewPassword ? 'text' : 'password'}
                                        value={passwordForm.newPassword}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                        placeholder="Enter your new password"
                                        className="h-11 rounded-lg pr-10"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>

                                {/* Password Requirements */}
                                {passwordForm.newPassword && (
                                    <div className="mt-3 p-3 bg-muted/50 rounded-lg space-y-1.5">
                                        <p className="text-xs font-medium mb-2">Password Requirements:</p>
                                        <ValidationItem isValid={passwordValidation.minLength} text="At least 8 characters" />
                                        <ValidationItem isValid={passwordValidation.hasUpperCase} text="One uppercase letter" />
                                        <ValidationItem isValid={passwordValidation.hasLowerCase} text="One lowercase letter" />
                                        <ValidationItem isValid={passwordValidation.hasNumber} text="One number" />
                                        <ValidationItem isValid={passwordValidation.hasSpecialChar} text="One special character (optional)" />
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <Label htmlFor="confirmPassword" className="text-sm font-medium mb-2 block">
                                    Confirm New Password <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={passwordForm.confirmPassword}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                        placeholder="Confirm your new password"
                                        className="h-11 rounded-lg pr-10"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>

                                {/* Password Match Indicator */}
                                {passwordForm.confirmPassword && (
                                    <div className={`mt-2 flex items-center gap-2 text-xs ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                                        {passwordsMatch ? (
                                            <>
                                                <CheckCircle2 className="h-3 w-3" />
                                                <span>Passwords match</span>
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="h-3 w-3" />
                                                <span>Passwords do not match</span>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t bg-muted/30 flex gap-3 justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsPasswordDialogOpen(false);
                                    resetPasswordForm();
                                }}
                                className="px-6"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="px-6"
                                disabled={isSubmitting || !passwordValidation.isValid || !passwordsMatch}
                            >
                                {isSubmitting ? 'Changing...' : 'Change Password'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Change Name Dialog */}
            <Dialog open={isNameDialogOpen} onOpenChange={setIsNameDialogOpen}>
                <DialogContent className="!w-[90%] sm:!w-[400px] !max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Change Name
                        </DialogTitle>
                        <DialogDescription className="text-sm mt-1">
                            Update your display name
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="newName" className="text-sm font-medium mb-2 block">
                                New Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="newName"
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="Enter your new name"
                                className="h-11 rounded-lg"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setIsNameDialogOpen(false);
                                setNewName('');
                            }}
                            className="px-6"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleNameChange}
                            className="px-6"
                            disabled={isSubmitting || !newName.trim()}
                        >
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* User Management Section - Admin Only */}
            {currentUser.role === 'admin' && (
                <div className="mt-8">
                    <UserManagement />
                </div>
            )}
        </div>
    );
}
