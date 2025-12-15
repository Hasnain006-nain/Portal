import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { announcementsApi } from '../../lib/apiClient';
import { Bell, Calendar, AlertCircle, Info, BookOpen, Home, ArrowLeft, Plus, Edit, Trash2, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';

interface AnnouncementsProps {
  onTabChange?: (tab: string) => void;
}

interface Announcement {
  _id?: string;
  id?: string;
  title: string;
  content: string;
  type: 'academic' | 'hostel' | 'library' | 'general' | 'students';
  priority: 'high' | 'medium' | 'low';
  date?: string;
  createdAt?: string;
  createdBy?: string;
}

export function Announcements({ onTabChange }: AnnouncementsProps = {}) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [viewingAnnouncement, setViewingAnnouncement] = useState<Announcement | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [readAnnouncements, setReadAnnouncements] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'general' as 'academic' | 'hostel' | 'library' | 'general' | 'students',
    priority: 'medium' as 'high' | 'medium' | 'low'
  });

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const isAdmin = currentUser.role === 'admin';

  // Load announcements from backend
  useEffect(() => {
    fetchAnnouncements();

    // Load read announcements
    const read = JSON.parse(localStorage.getItem('readAnnouncements') || '[]');
    setReadAnnouncements(read);
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await announcementsApi.getAll();
      setAnnouncements(data);

      // Store announcements in localStorage for notification tracking
      localStorage.setItem('announcements', JSON.stringify(data));

      // Dispatch event to update notification count in navbar
      window.dispatchEvent(new Event('announcementsUpdated'));
    } catch (error: any) {
      toast.error('Failed to load announcements');
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter announcements
  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesType = filterType === 'all' || announcement.type === filterType;
    const matchesPriority = filterPriority === 'all' || announcement.priority === filterPriority;
    return matchesType && matchesPriority;
  });

  // Count by priority
  const highPriorityCount = announcements.filter(a => a.priority === 'high').length;
  const mediumPriorityCount = announcements.filter(a => a.priority === 'medium').length;
  const lowPriorityCount = announcements.filter(a => a.priority === 'low').length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return; // Prevent duplicate submissions

    setIsSubmitting(true);
    try {
      if (editingAnnouncement) {
        // Update existing announcement
        await announcementsApi.update(editingAnnouncement._id || editingAnnouncement.id!, formData);
        toast.success('Announcement updated successfully! Students have been notified.');
      } else {
        // Create new announcement with created_by field
        const announcementData = {
          ...formData,
          created_by: currentUser.id || currentUser._id
        };
        console.log('📤 Creating announcement with data:', announcementData);
        await announcementsApi.create(announcementData);
        toast.success('Announcement created successfully! Students have been notified.');
      }

      // Trigger notification update event for all users
      window.dispatchEvent(new Event('notificationsUpdated'));
      
      resetForm();
      setIsDialogOpen(false);
      fetchAnnouncements();
    } catch (error: any) {
      console.error('❌ Failed to create announcement:', error);
      toast.error(error.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    if (isSubmitting) return; // Prevent duplicate operations

    setIsSubmitting(true);
    try {
      await announcementsApi.delete(id);
      toast.success('Announcement deleted successfully!');
      fetchAnnouncements();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'general',
      priority: 'medium'
    });
    setEditingAnnouncement(null);
  };

  // Get icon for announcement type
  const getIcon = (type?: string) => {
    switch (type) {
      case 'academic':
        return <AlertCircle className="h-5 w-5" />;
      case 'hostel':
        return <Home className="h-5 w-5" />;
      case 'library':
        return <BookOpen className="h-5 w-5" />;
      case 'students':
        return <Bell className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  // Get color for announcement type
  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'academic':
        return 'text-blue-500 bg-blue-500/10';
      case 'hostel':
        return 'text-green-500 bg-green-500/10';
      case 'library':
        return 'text-purple-500 bg-purple-500/10';
      case 'students':
        return 'text-orange-500 bg-orange-500/10';
      default:
        return 'text-gray-500 bg-gray-500/10';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl">Announcements & Notices</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-xs sm:text-sm md:text-base">
            Stay updated with the latest university announcements
          </p>
        </div>
        <div className="flex gap-2">
          {onTabChange && (
            <Button variant="outline" onClick={() => onTabChange('dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          )}
          {isAdmin && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">New Announcement</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="!w-[90%] sm:!w-[600px] !max-w-[650px] max-h-[90vh] overflow-hidden p-0 !rounded-2xl">
                <div className="p-6 border-b">
                  <DialogHeader className="text-left">
                    <DialogTitle className="text-xl font-semibold">
                      {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
                    </DialogTitle>
                    <DialogDescription className="text-sm mt-1">
                      {editingAnnouncement ? 'Update announcement details' : 'Create a new announcement for students'}
                    </DialogDescription>
                  </DialogHeader>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                  <div className="p-6 overflow-y-auto flex-1 space-y-4">
                    <div>
                      <Label htmlFor="title" className="text-sm font-medium mb-2 block">
                        Title <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g., New Course Registration Open"
                        className="h-11 rounded-lg"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="content" className="text-sm font-medium mb-2 block">
                        Content <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="content"
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        placeholder="Enter announcement details..."
                        className="min-h-[120px] rounded-lg"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="type" className="text-sm font-medium mb-2 block">
                          Type <span className="text-red-500">*</span>
                        </Label>
                        <select
                          id="type"
                          value={formData.type}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                          className="flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                          required
                        >
                          <option value="general">General</option>
                          <option value="academic">Academic/Courses</option>
                          <option value="hostel">Hostel</option>
                          <option value="library">Library</option>
                          <option value="students">Students</option>
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="priority" className="text-sm font-medium mb-2 block">
                          Priority <span className="text-red-500">*</span>
                        </Label>
                        <select
                          id="priority"
                          value={formData.priority}
                          onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                          className="flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                          required
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>

                    {/* Example suggestions */}
                    <Card className="p-4 bg-muted/50">
                      <p className="text-xs font-medium mb-2">Example Announcements:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• "New course 'Advanced AI' will be added next semester"</li>
                        <li>• "Hostel Floor 4 will be closed for maintenance from..."</li>
                        <li>• "New students admitted - Welcome to the university!"</li>
                        <li>• "Library will remain open 24/7 during exam week"</li>
                      </ul>
                    </Card>
                  </div>

                  <div className="p-6 border-t bg-muted/30 flex gap-3 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        resetForm();
                      }}
                      className="px-6"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="px-6" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : editingAnnouncement ? 'Update Announcement' : 'Create Announcement'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 sm:p-6">
          <p className="text-muted-foreground text-xs sm:text-sm">Total</p>
          <h2 className="mt-1 sm:mt-2 text-lg sm:text-2xl">{announcements.length}</h2>
        </Card>
        <Card className="p-4 sm:p-6">
          <p className="text-muted-foreground text-xs sm:text-sm">High Priority</p>
          <h2 className="mt-1 sm:mt-2 text-lg sm:text-2xl text-destructive">{highPriorityCount}</h2>
        </Card>
        <Card className="p-4 sm:p-6">
          <p className="text-muted-foreground text-xs sm:text-sm">Medium</p>
          <h2 className="mt-1 sm:mt-2 text-lg sm:text-2xl text-yellow-600 dark:text-yellow-400">{mediumPriorityCount}</h2>
        </Card>
        <Card className="p-4 sm:p-6">
          <p className="text-muted-foreground text-xs sm:text-sm">Low Priority</p>
          <h2 className="mt-1 sm:mt-2 text-lg sm:text-2xl text-green-600 dark:text-green-400">{lowPriorityCount}</h2>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <p className="text-muted-foreground mb-2 text-xs sm:text-sm">Filter by Type</p>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant={filterType === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterType('all')}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={filterType === 'academic' ? 'default' : 'outline'}
              onClick={() => setFilterType('academic')}
            >
              Academic
            </Button>
            <Button
              size="sm"
              variant={filterType === 'hostel' ? 'default' : 'outline'}
              onClick={() => setFilterType('hostel')}
            >
              Hostel
            </Button>
            <Button
              size="sm"
              variant={filterType === 'library' ? 'default' : 'outline'}
              onClick={() => setFilterType('library')}
            >
              Library
            </Button>
            <Button
              size="sm"
              variant={filterType === 'students' ? 'default' : 'outline'}
              onClick={() => setFilterType('students')}
            >
              Students
            </Button>
          </div>
        </div>

        <div className="flex-1">
          <p className="text-muted-foreground mb-2 text-xs sm:text-sm">Filter by Priority</p>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant={filterPriority === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterPriority('all')}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={filterPriority === 'high' ? 'default' : 'outline'}
              onClick={() => setFilterPriority('high')}
            >
              High
            </Button>
            <Button
              size="sm"
              variant={filterPriority === 'medium' ? 'default' : 'outline'}
              onClick={() => setFilterPriority('medium')}
            >
              Medium
            </Button>
            <Button
              size="sm"
              variant={filterPriority === 'low' ? 'default' : 'outline'}
              onClick={() => setFilterPriority('low')}
            >
              Low
            </Button>
          </div>
        </div>
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No announcements found</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5 gap-1.5">
          {filteredAnnouncements.map((announcement) => {
            const isUnread = !readAnnouncements.includes(announcement._id || announcement.id || '');
            return (
              <Card
                key={announcement._id || announcement.id}
                className={`p-1.5 relative group hover:shadow-md transition-shadow ${announcement.priority === 'high'
                  ? 'border-destructive/50 bg-destructive/5'
                  : isUnread
                    ? 'border-primary/50 bg-primary/5'
                    : ''
                  }`}
              >
                <div className="flex items-start gap-1 mb-1">
                  <div className={`h-5 w-5 rounded flex items-center justify-center shrink-0 ${getTypeColor(announcement.type)}`}>
                    <div className="scale-75">
                      {getIcon(announcement.type)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-0.5">
                      <h3 className="text-[10px] font-semibold truncate leading-tight">{announcement.title}</h3>
                      {isUnread && (
                        <div className="h-1 w-1 rounded-full bg-primary shrink-0" title="Unread" />
                      )}
                    </div>
                    <div className="flex gap-0.5 mt-0.5">
                      <Badge
                        variant={
                          announcement.priority === 'high'
                            ? 'destructive'
                            : announcement.priority === 'medium'
                              ? 'default'
                              : 'secondary'
                        }
                        className="text-[7px] px-0.5 py-0 h-3 leading-none"
                      >
                        {announcement.priority}
                      </Badge>
                      <Badge variant="outline" className="capitalize text-[7px] px-0.5 py-0 h-3 leading-none">
                        {announcement.type}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 hover:bg-accent text-xs"
                      onClick={() => {
                        setViewingAnnouncement(announcement);
                        setIsViewDialogOpen(true);

                        // Mark this announcement as read when viewing
                        const readAnnouncementsList = JSON.parse(localStorage.getItem('readAnnouncements') || '[]');
                        const announcementId = announcement._id || announcement.id;
                        if (!readAnnouncementsList.includes(announcementId)) {
                          readAnnouncementsList.push(announcementId);
                          localStorage.setItem('readAnnouncements', JSON.stringify(readAnnouncementsList));
                          setReadAnnouncements(readAnnouncementsList);
                          window.dispatchEvent(new Event('announcementsUpdated'));
                        }
                      }}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      <span>View</span>
                    </Button>
                    {isAdmin && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary dark:border-primary/50 dark:text-primary dark:hover:bg-primary dark:hover:text-primary-foreground transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(announcement);
                          }}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground hover:border-destructive dark:border-destructive/50 dark:text-destructive dark:hover:bg-destructive dark:hover:text-destructive-foreground transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(announcement._id || announcement.id!);
                          }}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          <span>Delete</span>
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <p className="text-muted-foreground text-[8px] mb-1 line-clamp-2 leading-tight">{announcement.content}</p>

                <div className="flex items-center gap-0.5 text-muted-foreground text-[7px]">
                  <Calendar className="h-1.5 w-1.5" />
                  <span className="truncate">{announcement.date || new Date(announcement.createdAt!).toLocaleDateString()}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {filteredAnnouncements.length === 0 && (
        <Card className="p-8 sm:p-12 text-center">
          <Bell className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-sm sm:text-base">
            No announcements found matching your filters
          </p>
        </Card>
      )}

      {/* View Announcement Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="!w-[90%] sm:!w-[600px] !max-w-[650px] max-h-[90vh] overflow-hidden p-0 !rounded-2xl">
          <div className="p-6 border-b">
            <DialogHeader className="text-left">
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${getTypeColor(viewingAnnouncement?.type)}`}>
                  {getIcon(viewingAnnouncement?.type)}
                </div>
                {viewingAnnouncement?.title}
              </DialogTitle>
              <DialogDescription className="text-sm mt-1">
                View announcement details
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 overflow-y-auto space-y-4">
            {/* Badges */}
            <div className="flex gap-2 flex-wrap">
              <Badge
                variant={
                  viewingAnnouncement?.priority === 'high'
                    ? 'destructive'
                    : viewingAnnouncement?.priority === 'medium'
                      ? 'default'
                      : 'secondary'
                }
              >
                {viewingAnnouncement?.priority} Priority
              </Badge>
              <Badge variant="outline" className="capitalize">
                {viewingAnnouncement?.type}
              </Badge>
            </div>

            {/* Content */}
            <Card className="p-4 bg-muted/50">
              <h4 className="text-sm font-semibold mb-2">Content</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {viewingAnnouncement?.content}
              </p>
            </Card>

            {/* Details */}
            <Card className="p-4 bg-primary/5">
              <h4 className="text-sm font-semibold mb-3">Details</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Date Posted:</span>
                  <span className="font-medium">{viewingAnnouncement?.date}</span>
                </div>
                {viewingAnnouncement?.createdBy && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Posted By:</span>
                    <span className="font-medium">{viewingAnnouncement.createdBy}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium capitalize">{viewingAnnouncement?.type}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Priority:</span>
                  <Badge
                    variant={
                      viewingAnnouncement?.priority === 'high'
                        ? 'destructive'
                        : viewingAnnouncement?.priority === 'medium'
                          ? 'default'
                          : 'secondary'
                    }
                    className="text-xs"
                  >
                    {viewingAnnouncement?.priority}
                  </Badge>
                </div>
              </div>
            </Card>
          </div>

          <div className="p-6 border-t bg-muted/30 flex gap-3 justify-end">
            <Button
              type="button"
              onClick={() => setIsViewDialogOpen(false)}
              className="px-6"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
