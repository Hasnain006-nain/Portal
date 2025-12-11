import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { requestsApi } from '../../lib/apiClient';
import { HelpCircle, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../ui/dialog';

export function SupportRequest() {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        subject: '',
        message: ''
    });

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.subject.trim() || !formData.message.trim()) {
            toast.error('Please fill in all fields');
            return;
        }

        setIsSubmitting(true);
        try {
            await requestsApi.create({
                type: 'support',
                studentId: currentUser.email,
                studentName: currentUser.name,
                studentEmail: currentUser.email,
                subject: formData.subject,
                message: formData.message,
                requestedAt: new Date().toISOString()
            });

            toast.success('Support request submitted! Admin will respond soon.');
            setFormData({ subject: '', message: '' });
            setIsOpen(false);

            // Trigger notification update for admins
            window.dispatchEvent(new Event('requestsUpdated'));
        } catch (error: any) {
            toast.error(error.message || 'Failed to submit support request');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="w-full" variant="outline" size="sm">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Contact Support
                </Button>
            </DialogTrigger>
            <DialogContent className="!w-[90%] sm:!w-[500px] !max-w-[550px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <HelpCircle className="h-5 w-5" />
                        Contact Support
                    </DialogTitle>
                    <DialogDescription>
                        Send a message to the admin team. We'll get back to you soon!
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Card className="p-4 bg-muted/50">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Name:</span>
                                <span className="font-medium">{currentUser.name}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Email:</span>
                                <span className="font-medium">{currentUser.email}</span>
                            </div>
                        </div>
                    </Card>

                    <div>
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                            id="subject"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            placeholder="What do you need help with?"
                            className="mt-2"
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                            id="message"
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            placeholder="Describe your issue or question in detail..."
                            className="mt-2"
                            rows={5}
                            required
                        />
                    </div>

                    <div className="flex gap-3 justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4 mr-2" />
                                    Send Request
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
