import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { announcementsApi } from '../../lib/apiClient';
import { Bell, Calendar, AlertCircle, Info, BookOpen, Home, ArrowLeft, Plus, Edit, Trash2, Eye, Loader2, Filter, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface AnnouncementsProps {
  onTabChange?: (tab: string) => void;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'academic' | 'hostel' | 'library' | 'general' | 'urgent';
  priority: 'high' | 'medium' | 'low';
  created_at: string;
  created_by?: string;
}

const typeIcons = {
  academic: BookOpen,
  hostel: Home,
  library: BookOpen,
  general: Info,
  urgent: AlertCircle
};

const typeColors = {
  academic: 'bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-300 dark:border-blue-800',
  hostel: 'bg-green-500/10 text-green-700 border-green-200 dark:text-green-300 dark:border-green-800',
  library: 'bg-purple-500/10 text-purple-700 border-purple-200 dark:text-purple-300 dark:border-purple-800',
  general: 'bg-gray-500/10 text-gray-700 border-gray-200 dark:text-gray-300 dark:border-gray-800',
  urgent: 'bg-red-500/10 text-red-700 border-red-200 dark:text-red-300 dark:border-red-800'
};

const priorityColors = {
  high: 'bg-red-500/10 text-red-700 border-red-200 dark:text-red-300 dark:border-red-800',
  medium: 'bg-yellow-500/10 text-yellow-700 border-yellow-200 dark:text-yellow-300 dark:border-yellow-800',
  low: 'bg-green-500/10 text-green-700 border-green-200 dark:text-green-300 dark:border-green-800'
};

export function Announcements({ onTabChange }: AnnouncementsProps = {}) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [viewingAnnouncement, setViewingAnnouncement] = useState<Announcement | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'general' as Announcement['type'],
    priority: 'medium' as Announcement['priority']
  });

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const isAdmin = currentUser.role === 'admin';

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    filterAnnouncements();
  }, [announcements, filterType, filterPriority]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await announcementsApi.getAll();
      setAnnouncements(data);
    } catch (error: any) {
      toast.error('Failed to load announcements');
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAnnouncements = () => {
    let filtered = announcements;

    if (filterType !== 'all') {
      filtered = filtered.filter(announcement => announcement.type === filterType);
    }

    if (filterPriority !== 'all') {
      filtered = filtered.filter(announcement => announcement.priority === filterPriority);
    }

    // Sort by priority and date
    filtered.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    setFilteredAnnouncements(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const announcementData = {
        title: formData.title,
        content: formData.content,
        type: formData.type,
        priority: formData.priority
      };

      if (editingAnnouncement) {
        await announcementsApi.update(editingAnnouncement.id, announcementData);
        toast.success('Announcement updated successfully!');
      } else {
        await announcementsApi.create(announcementData);
        toast.success('Announcement created successfully!');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchAnnouncements();
    } catch (error: any) {
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

  const handleDelete = async (announcement: Announcement) => {
    if (!confirm(`Are you sure you want to delete "${announcement.title}"?`)) return;

    try {
      await announcementsApi.delete(announcement.id);
      toast.success('Announcement deleted successfully!');
      fetchAnnouncements();
    } catch (error: any) {
      toast.error(error.message || 'Delete failed');
    }
  };

  const handleView = (announcement: Announcement) => {
    setViewingAnnouncement(announcement);
    setIsViewDialogOpen(true);
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

  const clearFilters = () => {
    setFilterType('all');
    setFilterPriority('all');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          <h1 className="text-3xl font-bold">Announcements & Notices</h1>
          <p className="text-muted-foreground mt-1">Stay updated with the latest university announcements</p>
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
                  New Announcement
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingAnnouncement ? 'Update announcement details' : 'Create a new announcement for students'}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., New Course Registration Open"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="content">Content *</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Enter announcement details..."
                      className="mt-1 min-h-[120px]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Type *</Label>
                      <Select value={formData.type} onValueChange={(value: Announcement['type']) => setFormData({ ...formData, type: value })}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="academic">Academic</SelectItem>
                          <SelectItem value="hostel">Hostel</SelectItem>
                          <SelectItem value="library">Library</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="priority">Priority *</Label>
                      <Select value={formData.priority} onValueChange={(value: Announcement['priority']) => setFormData({ ...formData, priority: value })}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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
                          {editingAnnouncement ? 'Updating...' : 'Creating...'}
                        </>
                      ) : (
                        editingAnnouncement ? 'Update Announcement' : 'Create Announcement'
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
            <Bell className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{announcements.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-red-500/5 border-red-500/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-sm text-muted-foreground">High Priority</p>
              <p className="text-2xl font-bold">{announcements.filter(a => a.priority === 'high').length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-yellow-500/5 border-yellow-500/20">
          <div className="flex items-center gap-3">
            <Info className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-sm text-muted-foreground">Medium Priority</p>
              <p className="text-2xl font-bold">{announcements.filter(a => a.priority === 'medium').length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-green-500/5 border-green-500/20">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Low Priority</p>
              <p className="text-2xl font-bold">{announcements.filter(a => a.priority === 'low').length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filter by:</span>
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="academic">Academic</SelectItem>
              <SelectItem value="hostel">Hostel</SelectItem>
              <SelectItem value="library">Library</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">High Priority</SelectItem>
              <SelectItem value="medium">Medium Priority</SelectItem>
              <SelectItem value="low">Low Priority</SelectItem>
            </SelectContent>
          </Select>
          {(filterType !== 'all' || filterPriority !== 'all') && (
            <Button variant="outline" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>
      </Card>

      {/* Announcements List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredAnnouncements.map((announcement) => {
            const TypeIcon = typeIcons[announcement.type];
            return (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="p-6 hover:shadow-lg transition-all border-l-4 border-l-primary">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <TypeIcon className="h-5 w-5 text-primary" />
                        <Badge className={typeColors[announcement.type]}>
                          {announcement.type.charAt(0).toUpperCase() + announcement.type.slice(1)}
                        </Badge>
                        <Badge className={priorityColors[announcement.priority]}>
                          {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)} Priority
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(announcement.created_at)}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{announcement.title}</h3>
                      <p className="text-muted-foreground line-clamp-2">
                        {announcement.content}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(announcement)}
                        className="hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      {isAdmin && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(announcement)}
                            className="hover:bg-primary hover:text-primary-foreground transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(announcement)}
                            className="hover:bg-destructive hover:text-destructive-foreground transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredAnnouncements.length === 0 && (
        <Card className="p-12 text-center">
          <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No announcements found</h3>
          <p className="text-muted-foreground mb-4">
            {filterType !== 'all' || filterPriority !== 'all'
              ? 'Try adjusting your filters'
              : 'No announcements have been posted yet'}
          </p>
          {isAdmin && filterType === 'all' && filterPriority === 'all' && (
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Announcement
            </Button>
          )}
        </Card>
      )}

      {/* View Announcement Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          {viewingAnnouncement && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  {React.createElement(typeIcons[viewingAnnouncement.type], { className: "h-5 w-5 text-primary" })}
                  <Badge className={typeColors[viewingAnnouncement.type]}>
                    {viewingAnnouncement.type.charAt(0).toUpperCase() + viewingAnnouncement.type.slice(1)}
                  </Badge>
                  <Badge className={priorityColors[viewingAnnouncement.priority]}>
                    {viewingAnnouncement.priority.charAt(0).toUpperCase() + viewingAnnouncement.priority.slice(1)} Priority
                  </Badge>
                </div>
                <DialogTitle className="text-2xl">{viewingAnnouncement.title}</DialogTitle>
                <DialogDescription>
                  Posted on {formatDate(viewingAnnouncement.created_at)}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <p className="whitespace-pre-wrap">{viewingAnnouncement.content}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}