import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { notificationsApi } from '../../lib/apiClient';
import { Bell, CheckCircle, XCircle, AlertCircle, Info, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface NotificationsProps {
    onTabChange?: (tab: string) => void;
}

export function Notifications({ onTabChange }: NotificationsProps = {}) {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    useEffect(() => {
        fetchNotifications();
        
        // Poll for new notifications every 10 seconds
        const interval = setInterval(fetchNotifications, 10000);
        
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const data = await notificationsApi.getByEmail(currentUser.email);
            setNotifications(data);
        } catch (error: any) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await notificationsApi.markAsRead(id);
            fetchNotifications();
        } catch (error: any) {
            toast.error('Failed to mark as read');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationsApi.markAllAsRead();
            fetchNotifications();
            toast.success('All notifications marked as read');
        } catch (error: any) {
            toast.error('Failed to mark all as read');
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'error':
                return <XCircle className="h-5 w-5 text-red-500" />;
            case 'warning':
                return <AlertCircle className="h-5 w-5 text-yellow-500" />;
            default:
                return <Info className="h-5 w-5 text-blue-500" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'success':
                return 'bg-green-500/10 border-green-500/20';
            case 'error':
                return 'bg-red-500/10 border-red-500/20';
            case 'warning':
                return 'bg-yellow-500/10 border-yellow-500/20';
            default:
                return 'bg-blue-500/10 border-blue-500/20';
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 w-full max-w-full">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Notifications</h1>
                    <p className="text-muted-foreground mt-2">
                        {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button onClick={handleMarkAllAsRead}>
                        Mark All as Read
                    </Button>
                )}
            </div>

            {notifications.length === 0 ? (
                <Card className="p-12 text-center">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Notifications</h3>
                    <p className="text-muted-foreground">
                        You don't have any notifications yet.
                    </p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notification) => (
                        <Card
                            key={notification._id}
                            className={`p-4 ${!notification.is_read ? getTypeColor(notification.type) : ''} ${!notification.is_read ? 'border-l-4' : ''}`}
                        >
                            <div className="flex items-start gap-4">
                                <div className="shrink-0 mt-1">
                                    {getIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <h4 className="font-semibold mb-1">{notification.title}</h4>
                                            <p className="text-sm text-muted-foreground">{notification.message}</p>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                {new Date(notification.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {!notification.is_read && (
                                                <Badge variant="default" className="shrink-0">New</Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {!notification.is_read && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleMarkAsRead(notification._id)}
                                    >
                                        Mark as Read
                                    </Button>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
