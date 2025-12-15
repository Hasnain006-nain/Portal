import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { hostelsApi, roomsApi } from '../../lib/apiClient';
import { Plus, Edit, Trash2, Loader2, Building, ArrowLeft, X, MapPin, Eye, DoorOpen, Users, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface HostelManagementProps {
  onTabChange?: (tab: string) => void;
}

interface Hostel {
  id: string;
  name: string;
  type: 'boys' | 'girls' | 'mixed';
  total_rooms: number;
  occupied_rooms: number;
  warden_name?: string;
  warden_contact?: string;
  created_at: string;
}

interface Room {
  id: string;
  hostel_id: string;
  room_number: string;
  floor: number;
  capacity: number;
  occupied: number;
  status: 'available' | 'occupied' | 'maintenance';
}

interface FormData {
  name: string;
  type: 'boys' | 'girls' | 'mixed';
  total_rooms: string;
  warden_name: string;
  warden_contact: string;
}

export function HostelManagement({ onTabChange }: HostelManagementProps = {}) {
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [filteredHostels, setFilteredHostels] = useState<Hostel[]>([]);
  const [selectedHostel, setSelectedHostel] = useState<Hostel | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [editingHostel, setEditingHostel] = useState<Hostel | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');

  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: 'boys',
    total_rooms: '50',
    warden_name: '',
    warden_contact: ''
  });

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const isAdmin = currentUser.role === 'admin';

  useEffect(() => {
    fetchHostels();
  }, []);

  useEffect(() => {
    filterHostels();
  }, [hostels, searchTerm, filterType]);

  const fetchHostels = async () => {
    try {
      setLoading(true);
      const data = await hostelsApi.getAll();
      setHostels(data);
    } catch (error: any) {
      toast.error('Failed to load hostels');
      console.error('Error fetching hostels:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async (hostelId: string) => {
    try {
      const data = await roomsApi.getByHostelId(hostelId);
      setRooms(data);
    } catch (error: any) {
      toast.error('Failed to load rooms');
      console.error('Error fetching rooms:', error);
    }
  };

  const filterHostels = () => {
    let filtered = hostels;

    if (searchTerm) {
      filtered = filtered.filter(hostel =>
        hostel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hostel.warden_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType) {
      filtered = filtered.filter(hostel => hostel.type === filterType);
    }

    setFilteredHostels(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const hostelData = {
        name: formData.name,
        type: formData.type,
        total_rooms: parseInt(formData.total_rooms),
        occupied_rooms: 0,
        warden_name: formData.warden_name,
        warden_contact: formData.warden_contact
      };

      if (editingHostel) {
        await hostelsApi.update(editingHostel.id, hostelData);
        toast.success('Hostel updated successfully!');
      } else {
        await hostelsApi.create(hostelData);
        toast.success('Hostel created successfully!');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchHostels();
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (hostel: Hostel) => {
    setEditingHostel(hostel);
    setFormData({
      name: hostel.name,
      type: hostel.type,
      total_rooms: hostel.total_rooms.toString(),
      warden_name: hostel.warden_name || '',
      warden_contact: hostel.warden_contact || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (hostel: Hostel) => {
    if (!confirm(`Are you sure you want to delete "${hostel.name}"?`)) return;

    try {
      await hostelsApi.delete(hostel.id);
      toast.success('Hostel deleted successfully!');
      if (selectedHostel?.id === hostel.id) {
        setSelectedHostel(null);
      }
      fetchHostels();
    } catch (error: any) {
      toast.error(error.message || 'Delete failed');
    }
  };

  const handleViewRooms = async (hostel: Hostel) => {
    setSelectedHostel(hostel);
    await fetchRooms(hostel.id);
    setIsRoomDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'boys',
      total_rooms: '50',
      warden_name: '',
      warden_contact: ''
    });
    setEditingHostel(null);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('');
  };

  const getOccupancyColor = (occupied: number, total: number) => {
    const ratio = occupied / total;
    if (ratio >= 0.9) return 'bg-red-500/10 text-red-700 border-red-200 dark:text-red-300 dark:border-red-800';
    if (ratio >= 0.7) return 'bg-yellow-500/10 text-yellow-700 border-yellow-200 dark:text-yellow-300 dark:border-yellow-800';
    return 'bg-green-500/10 text-green-700 border-green-200 dark:text-green-300 dark:border-green-800';
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'boys': return 'bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-300 dark:border-blue-800';
      case 'girls': return 'bg-pink-500/10 text-pink-700 border-pink-200 dark:text-pink-300 dark:border-pink-800';
      case 'mixed': return 'bg-purple-500/10 text-purple-700 border-purple-200 dark:text-purple-300 dark:border-purple-800';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200 dark:text-gray-300 dark:border-gray-800';
    }
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
          <h1 className="text-3xl font-bold">Hostel Management</h1>
          <p className="text-muted-foreground mt-1">Manage hostels and room assignments</p>
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
                  Add Hostel
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingHostel ? 'Edit Hostel' : 'Add New Hostel'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingHostel ? 'Update hostel information' : 'Create a new hostel'}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Hostel Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter hostel name"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="type">Type *</Label>
                    <Select value={formData.type} onValueChange={(value: 'boys' | 'girls' | 'mixed') => setFormData({ ...formData, type: value })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="boys">Boys Hostel</SelectItem>
                        <SelectItem value="girls">Girls Hostel</SelectItem>
                        <SelectItem value="mixed">Mixed Hostel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="total_rooms">Total Rooms *</Label>
                    <Input
                      id="total_rooms"
                      type="number"
                      min="1"
                      value={formData.total_rooms}
                      onChange={(e) => setFormData({ ...formData, total_rooms: e.target.value })}
                      placeholder="Enter total rooms"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="warden_name">Warden Name</Label>
                    <Input
                      id="warden_name"
                      value={formData.warden_name}
                      onChange={(e) => setFormData({ ...formData, warden_name: e.target.value })}
                      placeholder="Enter warden name"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="warden_contact">Warden Contact</Label>
                    <Input
                      id="warden_contact"
                      value={formData.warden_contact}
                      onChange={(e) => setFormData({ ...formData, warden_contact: e.target.value })}
                      placeholder="Enter contact number"
                      className="mt-1"
                    />
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
                          {editingHostel ? 'Updating...' : 'Creating...'}
                        </>
                      ) : (
                        editingHostel ? 'Update Hostel' : 'Create Hostel'
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
            <Building className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Hostels</p>
              <p className="text-2xl font-bold">{hostels.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-blue-500/5 border-blue-500/20">
          <div className="flex items-center gap-3">
            <DoorOpen className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Total Rooms</p>
              <p className="text-2xl font-bold">{hostels.reduce((sum, hostel) => sum + hostel.total_rooms, 0)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-green-500/5 border-green-500/20">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Occupied Rooms</p>
              <p className="text-2xl font-bold">{hostels.reduce((sum, hostel) => sum + hostel.occupied_rooms, 0)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-purple-500/5 border-purple-500/20">
          <div className="flex items-center gap-3">
            <MapPin className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-sm text-muted-foreground">Available Rooms</p>
              <p className="text-2xl font-bold">
                {hostels.reduce((sum, hostel) => sum + (hostel.total_rooms - hostel.occupied_rooms), 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search hostels..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              <SelectItem value="boys">Boys Hostel</SelectItem>
              <SelectItem value="girls">Girls Hostel</SelectItem>
              <SelectItem value="mixed">Mixed Hostel</SelectItem>
            </SelectContent>
          </Select>
          {(searchTerm || filterType) && (
            <Button variant="outline" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </Card>

      {/* Hostels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredHostels.map((hostel) => (
            <motion.div
              key={hostel.id}
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
                      <Badge className={getTypeColor(hostel.type)}>
                        {hostel.type.charAt(0).toUpperCase() + hostel.type.slice(1)}
                      </Badge>
                      <Badge className={getOccupancyColor(hostel.occupied_rooms, hostel.total_rooms)}>
                        {hostel.occupied_rooms}/{hostel.total_rooms} occupied
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-lg mb-1">{hostel.name}</h3>
                    {hostel.warden_name && (
                      <p className="text-sm text-muted-foreground mb-1">Warden: {hostel.warden_name}</p>
                    )}
                    {hostel.warden_contact && (
                      <p className="text-xs text-muted-foreground">{hostel.warden_contact}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewRooms(hostel)}
                      className="h-8 w-8 p-0 hover:bg-primary hover:text-primary-foreground"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {isAdmin && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(hostel)}
                          className="h-8 w-8 p-0 hover:bg-primary hover:text-primary-foreground"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(hostel)}
                          className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Rooms:</span>
                    <span className="font-medium">{hostel.total_rooms}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Available:</span>
                    <span className="font-medium text-green-600">
                      {hostel.total_rooms - hostel.occupied_rooms}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${(hostel.occupied_rooms / hostel.total_rooms) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredHostels.length === 0 && (
        <Card className="p-12 text-center">
          <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hostels found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || filterType
              ? 'Try adjusting your search or filters'
              : 'No hostels have been added yet'}
          </p>
          {isAdmin && !searchTerm && !filterType && (
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Hostel
            </Button>
          )}
        </Card>
      )}

      {/* Room Details Dialog */}
      <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedHostel && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedHostel.name} - Rooms</DialogTitle>
                <DialogDescription>
                  Room details and occupancy information
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{rooms.length}</p>
                      <p className="text-sm text-muted-foreground">Total Rooms</p>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {rooms.filter(r => r.status === 'available').length}
                      </p>
                      <p className="text-sm text-muted-foreground">Available</p>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">
                        {rooms.filter(r => r.status === 'occupied').length}
                      </p>
                      <p className="text-sm text-muted-foreground">Occupied</p>
                    </div>
                  </Card>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {rooms.map((room) => (
                    <Card 
                      key={room.id} 
                      className={`p-3 text-center cursor-pointer transition-all hover:shadow-md ${
                        room.status === 'available' 
                          ? 'border-green-200 bg-green-50 dark:bg-green-950/20' 
                          : room.status === 'occupied'
                          ? 'border-red-200 bg-red-50 dark:bg-red-950/20'
                          : 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20'
                      }`}
                    >
                      <p className="font-semibold">{room.room_number}</p>
                      <p className="text-xs text-muted-foreground">Floor {room.floor}</p>
                      <p className="text-xs">
                        {room.occupied}/{room.capacity}
                      </p>
                      <Badge 
                        variant="outline" 
                        className={`text-xs mt-1 ${
                          room.status === 'available' 
                            ? 'border-green-500 text-green-700' 
                            : room.status === 'occupied'
                            ? 'border-red-500 text-red-700'
                            : 'border-yellow-500 text-yellow-700'
                        }`}
                      >
                        {room.status}
                      </Badge>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}