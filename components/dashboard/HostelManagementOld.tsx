import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { hostelsApi, roomsApi } from '../../lib/apiClient';
import { Plus, Edit, Trash2, Loader2, Building, ArrowLeft, X, MapPin, Eye, DoorOpen, Users } from 'lucide-react';
import { toast } from 'sonner';
import { RoomDetailModal } from './RoomDetailModal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { ExportButton } from '../ui/export-button';
import { exportHostels } from '../../lib/exportUtils';

interface HostelManagementProps {
  onTabChange?: (tab: string) => void;
}

export function HostelManagement({ onTabChange }: HostelManagementProps = {}) {
  const [hostels, setHostels] = useState<any[]>([]);
  const [selectedHostel, setSelectedHostel] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHostel, setEditingHostel] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    totalRooms: '',
    totalFloors: '1',
    floorsData: [{ floorNumber: 1, roomsPerFloor: 10 }] as { floorNumber: number; roomsPerFloor: number }[],
    facilities: '',
    address: '',
    phone: ''
  });


  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const isAdmin = currentUser.role === 'admin';

  // Fetch hostels
  useEffect(() => {
    fetchHostels();
  }, []);

  const fetchHostels = async () => {
    try {
      setLoading(true);
      const hostelsData = await hostelsApi.getAll();

      // Fetch rooms for each hostel to calculate real statistics
      const hostelsWithStats = await Promise.all(
        hostelsData.map(async (hostel) => {
          try {
            const hostelRooms = await roomsApi.getByHostelId(hostel._id);
            const totalCapacity = hostelRooms.reduce((sum, room) => sum + (Number(room.capacity) || 0), 0);
            const totalOccupied = hostelRooms.reduce((sum, room) => sum + ((room.residents || []).length), 0);

            return {
              ...hostel,
              calculatedCapacity: totalCapacity,
              calculatedOccupied: totalOccupied,
              roomCount: hostelRooms.length
            };
          } catch (error) {
            return {
              ...hostel,
              calculatedCapacity: 0,
              calculatedOccupied: 0,
              roomCount: 0
            };
          }
        })
      );

      setHostels(hostelsWithStats);
    } catch (error: any) {
      toast.error('Failed to load hostels');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newTotalRooms = parseInt(formData.totalRooms);

      // If editing, check if new total rooms is less than current room count
      if (editingHostel) {
        const currentRooms = await roomsApi.getByHostelId(editingHostel._id);
        if (newTotalRooms < currentRooms.length) {
          const confirmChange = confirm(
            `Warning: This hostel currently has ${currentRooms.length} rooms, but you're setting the limit to ${newTotalRooms}. ` +
            `You'll need to delete ${currentRooms.length - newTotalRooms} room(s) first. Continue anyway?`
          );
          if (!confirmChange) return;
        }
      }

      const hostelData = {
        name: formData.name,
        totalRooms: newTotalRooms,
        totalFloors: parseInt(formData.totalFloors),
        floorsData: formData.floorsData,
        facilities: formData.facilities.split(',').map(f => f.trim()),
        address: formData.address,
        phone: formData.phone
      };

      if (editingHostel) {
        await hostelsApi.update(editingHostel._id, hostelData);
        toast.success('Hostel updated successfully!');

        // Check if floors were added and create new rooms
        const existingRooms = await roomsApi.getByHostelId(editingHostel._id);
        const existingFloors = new Set(existingRooms.map((r: any) => r.floor));

        let newRoomsCreated = 0;
        for (const floor of formData.floorsData) {
          // If this is a new floor, create all rooms for it
          if (!existingFloors.has(floor.floorNumber)) {
            for (let roomNum = 1; roomNum <= floor.roomsPerFloor; roomNum++) {
              const roomNumber = `${floor.floorNumber}${roomNum.toString().padStart(2, '0')}`;
              const roomData = {
                hostelId: editingHostel._id,
                hostelName: formData.name,
                roomNumber: roomNumber,
                floor: floor.floorNumber,
                capacity: 4,
                residents: [],
                warnings: [],
                lastChecked: new Date().toISOString()
              };

              try {
                await roomsApi.create(roomData);
                newRoomsCreated++;
              } catch (roomError) {
                console.error(`Failed to create room ${roomNumber}:`, roomError);
              }
            }
          }
        }

        if (newRoomsCreated > 0) {
          toast.success(`Added ${newRoomsCreated} new rooms!`);
        }
      } else {
        // Create hostel first
        const createdHostel = await hostelsApi.create(hostelData);
        console.log('Created hostel:', createdHostel);

        if (!createdHostel) {
          toast.error('Failed to create hostel');
          return;
        }

        toast.success('Hostel created successfully!');

        // Auto-create rooms based on floor data
        const hostelId = createdHostel.id;
        if (hostelId) {
          try {
            let totalRoomsCreated = 0;

            // Create rooms sequentially to avoid overwhelming the server
            for (const floor of formData.floorsData) {
              for (let roomNum = 1; roomNum <= floor.roomsPerFloor; roomNum++) {
                const roomNumber = `${floor.floorNumber}${roomNum.toString().padStart(2, '0')}`;
                const roomData = {
                  hostelId: hostelId,
                  hostelName: formData.name,
                  roomNumber: roomNumber,
                  floor: floor.floorNumber,
                  capacity: 4, // Default capacity
                  residents: [],
                  warnings: [],
                  lastChecked: new Date().toISOString()
                };

                try {
                  await roomsApi.create(roomData);
                  totalRoomsCreated++;
                } catch (roomError) {
                  console.error(`Failed to create room ${roomNumber}:`, roomError);
                }
              }
            }

            if (totalRoomsCreated > 0) {
              toast.success(`Created ${totalRoomsCreated} rooms automatically!`);
            } else {
              toast.warning('Hostel created but no rooms were created');
            }
          } catch (roomError) {
            console.error('Error creating rooms:', roomError);
            toast.error('Hostel created but some rooms failed to create');
          }
        } else {
          console.error('No hostel ID returned:', createdHostel);
          toast.warning('Hostel created but could not auto-create rooms');
        }
      }

      setIsDialogOpen(false);
      resetForm();
      fetchHostels();
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    }
  };

  const handleEdit = (hostel: any) => {
    setEditingHostel(hostel);
    setFormData({
      name: hostel.name,
      totalRooms: hostel.totalRooms?.toString() || '0',
      totalFloors: hostel.totalFloors?.toString() || '1',
      floorsData: hostel.floorsData || [{ floorNumber: 1, roomsPerFloor: parseInt(hostel.totalRooms) || 10 }],
      facilities: hostel.facilities.join(', '),
      address: hostel.address,
      phone: hostel.phone || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this hostel?')) return;

    try {
      await hostelsApi.delete(id);
      toast.success('Hostel deleted successfully!');
      fetchHostels();
    } catch (error: any) {
      toast.error(error.message || 'Delete failed');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      totalRooms: '',
      totalFloors: '1',
      floorsData: [{ floorNumber: 1, roomsPerFloor: 10 }],
      facilities: '',
      address: '',
      phone: ''
    });
    setEditingHostel(null);
  };

  const handleFloorsChange = (totalFloors: number) => {
    const floors: { floorNumber: number; roomsPerFloor: number }[] = [];
    for (let i = 1; i <= totalFloors; i++) {
      const existingFloor = formData.floorsData.find(f => f.floorNumber === i);
      floors.push({
        floorNumber: i,
        roomsPerFloor: existingFloor?.roomsPerFloor || 10
      });
    }

    // Calculate total rooms
    const totalRooms = floors.reduce((sum, floor) => sum + floor.roomsPerFloor, 0);

    setFormData({
      ...formData,
      totalFloors: totalFloors.toString(),
      floorsData: floors,
      totalRooms: totalRooms.toString()
    });
  };

  const handleRoomsPerFloorChange = (floorNumber: number, roomsPerFloor: number) => {
    const updatedFloors = formData.floorsData.map(floor =>
      floor.floorNumber === floorNumber ? { ...floor, roomsPerFloor } : floor
    );

    // Calculate total rooms
    const totalRooms = updatedFloors.reduce((sum, floor) => sum + floor.roomsPerFloor, 0);

    setFormData({
      ...formData,
      floorsData: updatedFloors,
      totalRooms: totalRooms.toString()
    });
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const fetchRooms = async (hostelId: string) => {
    try {
      const data = await roomsApi.getByHostelId(hostelId);
      setRooms(data);
    } catch (error: any) {
      toast.error('Failed to load rooms');
    }
  };

  const handleViewHostel = async (hostel: any) => {
    setSelectedHostel(hostel);
    await fetchRooms(hostel._id);
  };

  const handleDeleteFloor = async (floorNumber: number) => {
    const floorRooms = rooms.filter((r: any) => r.floor === floorNumber);
    const occupiedRooms = floorRooms.filter((r: any) => r.residents && r.residents.length > 0);

    if (occupiedRooms.length > 0) {
      toast.error(`Cannot delete Floor ${floorNumber}: ${occupiedRooms.length} room(s) have residents. Please remove residents first.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete Floor ${floorNumber} and all its ${floorRooms.length} rooms?`)) return;

    try {
      // Delete all rooms on this floor
      for (const room of floorRooms) {
        await roomsApi.delete(room._id);
      }

      toast.success(`Floor ${floorNumber} and ${floorRooms.length} rooms deleted successfully!`);
      await fetchRooms(selectedHostel._id);

      // Update hostel's total floors if needed
      const remainingFloors = rooms.filter((r: any) => r.floor !== floorNumber);
      const maxFloor = remainingFloors.length > 0 ? Math.max(...remainingFloors.map((r: any) => r.floor)) : 0;

      if (maxFloor < selectedHostel.totalFloors) {
        await hostelsApi.update(selectedHostel._id, {
          ...selectedHostel,
          totalFloors: maxFloor
        });
        setSelectedHostel({ ...selectedHostel, totalFloors: maxFloor });
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete floor');
    }
  };

  // Render hostel edit dialog (shared between list and detail views)
  // Note: Dialog is controlled programmatically without DialogTrigger
  // This may show a ref warning in console but is safe to ignore
  const renderHostelDialog = () => (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="!w-[90%] sm:!w-[700px] !max-w-[750px] max-h-[90vh] overflow-hidden p-0 !rounded-2xl">
        <div className="p-6 border-b">
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl font-semibold">
              {editingHostel ? 'Edit Hostel' : 'Add Hostel'}
            </DialogTitle>
            <DialogDescription className="text-sm mt-1">
              {editingHostel ? 'Update hostel information' : 'Create a new hostel building'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium mb-2 block">
                  Hostel Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., North Hall"
                  className="h-11 rounded-lg"
                  required
                />
              </div>

              <div>
                <Label htmlFor="totalFloors" className="text-sm font-medium mb-2 block">
                  Total Floors <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="totalFloors"
                  type="number"
                  value={formData.totalFloors}
                  onChange={(e) => handleFloorsChange(parseInt(e.target.value) || 1)}
                  placeholder="e.g., 3"
                  className="h-11 rounded-lg"
                  min="1"
                  max="20"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">
                Rooms Per Floor <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-3 max-h-[200px] overflow-y-auto p-3 border rounded-lg bg-muted/30">
                {formData.floorsData.map((floor) => (
                  <div key={floor.floorNumber} className="flex items-center gap-2 bg-background p-2 rounded">
                    <Label className="text-xs min-w-[60px] font-medium">Floor {floor.floorNumber}:</Label>
                    <Input
                      type="number"
                      value={floor.roomsPerFloor}
                      onChange={(e) => handleRoomsPerFloorChange(floor.floorNumber, parseInt(e.target.value) || 0)}
                      placeholder="Rooms"
                      className="h-9 rounded-lg"
                      min="1"
                      max="50"
                      required
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Total Rooms: {formData.totalRooms}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone" className="text-sm font-medium mb-2 block">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g., +1234567890"
                  className="h-11 rounded-lg"
                  required
                />
              </div>

              <div>
                <Label htmlFor="address" className="text-sm font-medium mb-2 block">
                  Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g., 123 Campus Road"
                  className="h-11 rounded-lg"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="facilities" className="text-sm font-medium mb-2 block">
                Facilities <span className="text-red-500">*</span>
              </Label>
              <Input
                id="facilities"
                value={formData.facilities}
                onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
                placeholder="e.g., WiFi, Gym, Cafeteria, Laundry"
                className="h-11 rounded-lg"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">Separate facilities with commas</p>
            </div>
          </div>

          <div className="p-6 border-t bg-muted/30 flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={handleDialogClose} className="px-6">
              Cancel
            </Button>
            <Button type="submit" className="px-6">
              {editingHostel ? 'Update' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Detail View
  if (selectedHostel) {
    // Calculate real statistics from rooms
    const totalRoomsAllowed = selectedHostel.totalRooms || 0; // Maximum rooms allowed for this hostel
    const totalRoomsCreated = rooms.length; // Number of rooms actually created
    const totalCapacity = rooms.reduce((sum, room) => sum + (Number(room.capacity) || 0), 0);
    const totalOccupied = rooms.reduce((sum, room) => sum + ((room.residents || []).length), 0);
    const available = totalCapacity - totalOccupied;
    const occupancyRate = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

    // Room statistics
    const occupiedRooms = rooms.filter(room => (room.residents || []).length > 0).length;
    const fullRooms = rooms.filter(room => (room.residents || []).length >= (Number(room.capacity) || 0)).length;
    const availableRooms = totalRoomsAllowed - totalRoomsCreated; // How many more rooms can be created

    return (
      <div className="space-y-3 sm:space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
          <Button variant="ghost" onClick={() => setSelectedHostel(null)} size="sm" className="w-full sm:w-auto">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Hostels
          </Button>
          {isAdmin && (
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={() => handleEdit(selectedHostel)} size="sm" className="flex-1 sm:flex-none">
                <Edit className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
              <Button variant="destructive" onClick={() => handleDelete(selectedHostel._id)} size="sm" className="flex-1 sm:flex-none">
                <Trash2 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </div>
          )}
        </div>

        <Card className="p-3 sm:p-4 md:p-6 lg:p-8 w-full max-w-full overflow-hidden">
          <div className="flex items-start justify-between mb-4 sm:mb-6">
            <div className="flex-1 min-w-0 pr-2">
              <h1 className="mb-1 sm:mb-2 text-xl sm:text-2xl md:text-3xl truncate">{selectedHostel.name}</h1>
              <div className="flex items-center gap-1 sm:gap-2 text-muted-foreground">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <p className="text-xs sm:text-sm md:text-base truncate">{selectedHostel.address}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSelectedHostel(null)} className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>

          {/* Main Stats Cards - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {/* Student Capacity Card */}
            <Card className="p-3 bg-gradient-to-br from-primary/5 to-primary/10">
              <h3 className="mb-2 text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Student Capacity
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <Card className="p-2 bg-background/80 min-w-0">
                  <p className="text-muted-foreground text-[9px] mb-0.5 truncate">Total</p>
                  <h2 className="text-base font-bold truncate">{totalCapacity}</h2>
                </Card>
                <Card className="p-2 bg-background/80 min-w-0">
                  <p className="text-muted-foreground text-[9px] mb-0.5 truncate">Occupied</p>
                  <h2 className="text-base font-bold truncate">{totalOccupied}</h2>
                </Card>
                <Card className="p-2 bg-background/80 min-w-0">
                  <p className="text-muted-foreground text-[9px] mb-0.5 truncate">Available</p>
                  <h2 className="text-base font-bold truncate">{available}</h2>
                </Card>
              </div>
            </Card>

            {/* Room Statistics Card */}
            <Card className="p-3 bg-gradient-to-br from-blue-500/5 to-blue-500/10">
              <h3 className="mb-2 text-sm font-semibold flex items-center gap-2">
                <DoorOpen className="h-4 w-4" />
                Room Statistics
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <Card className="p-2 bg-background/80 min-w-0">
                  <p className="text-muted-foreground text-[9px] mb-0.5 truncate">Total</p>
                  <h3 className="text-sm font-bold truncate">{totalRoomsCreated}/{totalRoomsAllowed}</h3>
                </Card>
                <Card className="p-2 bg-background/80 min-w-0">
                  <p className="text-muted-foreground text-[9px] mb-0.5 truncate">Occupied</p>
                  <h3 className="text-sm font-bold truncate">{occupiedRooms}</h3>
                </Card>
                <Card className="p-2 bg-background/80 min-w-0">
                  <p className="text-muted-foreground text-[9px] mb-0.5 truncate">Available</p>
                  <h3 className="text-sm font-bold truncate">{availableRooms}</h3>
                </Card>
                <Card className="p-2 bg-background/80 min-w-0">
                  <p className="text-muted-foreground text-[9px] mb-0.5 truncate">Full</p>
                  <h3 className="text-sm font-bold truncate">{fullRooms}/{totalRoomsCreated}</h3>
                </Card>
              </div>
            </Card>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div>
              <h3 className="mb-3 sm:mb-4 text-base sm:text-lg">Occupancy Rate</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-xs sm:text-sm">Current Occupancy</span>
                  <span className="font-medium text-sm sm:text-base">{occupancyRate}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 sm:h-4">
                  <div
                    className="bg-primary rounded-full h-3 sm:h-4 transition-all"
                    style={{ width: `${occupancyRate}%` }}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-3 sm:mb-4 text-base sm:text-lg">Facilities</h3>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {selectedHostel.facilities.map((facility: string, idx: number) => (
                  <Badge key={idx} variant="secondary" className="text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 py-0.5 sm:py-1">
                    {facility}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold">Details</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Card className="p-2 border">
                  <p className="text-muted-foreground text-[9px] mb-0.5">Building Name</p>
                  <p className="font-medium text-xs truncate">{selectedHostel.name}</p>
                </Card>
                <Card className="p-2 border">
                  <p className="text-muted-foreground text-[9px] mb-0.5">Address</p>
                  <p className="font-medium text-xs truncate">{selectedHostel.address}</p>
                </Card>
                <Card className="p-2 border">
                  <p className="text-muted-foreground text-[9px] mb-0.5">Total Rooms</p>
                  <p className="font-medium text-xs">{selectedHostel.totalRooms || 0}</p>
                </Card>
                <Card className="p-2 border">
                  <p className="text-muted-foreground text-[9px] mb-0.5">Available</p>
                  <Badge variant={available > 0 ? "outline" : "destructive"} className="text-[9px] px-1 py-0">
                    {available}
                  </Badge>
                </Card>
              </div>
            </div>

            {/* Rooms List */}
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
                <div className="flex-1">
                  <h3 className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg">
                    <DoorOpen className="h-4 w-4 sm:h-5 sm:w-5" />
                    Rooms ({rooms.length}/{selectedHostel.totalRooms || 0})
                  </h3>
                  {selectedHostel.totalRooms && rooms.length >= selectedHostel.totalRooms && (
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                      Room limit reached. Edit hostel to add more rooms.
                    </p>
                  )}
                </div>
                {/* Room management is now done through Edit Hostel dialog */}
              </div>

              {rooms.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Group rooms by floor - Each floor as a card */}
                  {Array.from(new Set(rooms.map((r: any) => r.floor)))
                    .sort((a, b) => a - b)
                    .map((floorNumber) => {
                      const floorRooms = rooms.filter((r: any) => r.floor === floorNumber);
                      return (
                        <Card key={floorNumber} className="p-3 bg-gradient-to-br from-muted/30 to-muted/10">
                          {/* Floor Header */}
                          <div className="mb-3 pb-2 border-b">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-sm font-bold flex items-center gap-2">
                                  Floor {floorNumber}
                                </h4>
                                <p className="text-[10px] text-muted-foreground">{floorRooms.length} rooms</p>
                              </div>
                              {isAdmin && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 hover:bg-destructive/10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteFloor(floorNumber);
                                  }}
                                  title="Delete Floor"
                                >
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Rooms in this floor */}
                          <div className="space-y-2">
                            {floorRooms.map((room: any) => {
                              const residents = room.residents || [];
                              const isFull = residents.length >= room.capacity;
                              const isAvailable = residents.length === 0;

                              return (
                                <Card
                                  key={room._id}
                                  className={`p-2 cursor-pointer hover:shadow-md transition-all ${isFull ? 'bg-red-50 border-red-200' : isAvailable ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                                    }`}
                                  onClick={() => setSelectedRoom(room)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <DoorOpen className={`h-4 w-4 ${isFull ? 'text-red-500' : isAvailable ? 'text-green-500' : 'text-yellow-500'
                                        }`} />
                                      <div>
                                        <p className="font-bold text-xs">{room.roomNumber}</p>
                                        <Badge variant={isFull ? "destructive" : isAvailable ? "outline" : "secondary"} className="text-[8px] px-1 py-0">
                                          {residents.length}/{room.capacity}
                                        </Badge>
                                      </div>
                                    </div>
                                    <div className="flex gap-0.5" onClick={(e) => e.stopPropagation()}>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-5 w-5 p-0"
                                        onClick={() => setSelectedRoom(room)}
                                        title="View Room Details"
                                      >
                                        <Eye className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </Card>
                              );
                            })}
                          </div>
                        </Card>
                      );
                    })}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <DoorOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No rooms added yet</p>
                  {isAdmin && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Click "Edit" above to add floors and rooms
                    </p>
                  )}
                </Card>
              )}
            </div>
          </div>
        </Card>

        {/* Room Detail Modal */}
        {selectedRoom && (
          <RoomDetailModal
            room={selectedRoom}
            onClose={() => setSelectedRoom(null)}
            onUpdate={() => fetchRooms(selectedHostel._id)}
          />
        )}

        {/* Hostel Edit Dialog */}
        {renderHostelDialog()}
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6 w-full max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 w-full">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl">Hostel Management</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-xs sm:text-sm md:text-base">View and manage hostel accommodations</p>
        </div>
        <div className="flex items-center gap-2">
          {onTabChange && (
            <Button variant="outline" onClick={() => onTabChange('dashboard')} className="flex-shrink-0">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Button>
          )}
          {isAdmin && (
            <>
              <ExportButton
                onExport={exportHostels}
                label="Export"
                className="flex-shrink-0"
              />
              <Button
                onClick={() => {
                  resetForm();
                  setIsDialogOpen(true);
                }}
                className="flex-shrink-0"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Add Hostel</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Hostels Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-2">
        {hostels.map((hostel) => {
          const capacity = hostel.calculatedCapacity || 0;
          const occupied = hostel.calculatedOccupied || 0;
          const available = capacity - occupied;
          const occupancyRate = capacity > 0 ? Math.round((occupied / capacity) * 100) : 0;

          return (
            <Card
              key={hostel._id}
              className="p-2 relative group cursor-pointer hover:shadow-md transition-shadow max-w-[200px] mx-auto w-full"
              onClick={() => handleViewHostel(hostel)}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="text-[9px]">{hostel.roomCount || 0} Rooms</Badge>
                  {isAdmin && (
                    <div className="flex gap-0.5" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5 p-0"
                        onClick={() => handleEdit(hostel)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5 p-0"
                        onClick={() => handleDelete(hostel._id)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
                <h3 className="font-medium text-xs truncate">{hostel.name}</h3>
                <p className="text-[10px] text-muted-foreground truncate">{hostel.address}</p>

                <div className="space-y-1 pt-1 border-t">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">Capacity</span>
                    <span className="font-medium">{occupied}/{capacity}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">Available</span>
                    <Badge variant={available > 0 ? "outline" : "destructive"} className="text-[9px] px-1 py-0">
                      {available}
                    </Badge>
                  </div>
                  <div className="pt-0.5">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-muted-foreground text-[9px]">Occupancy</span>
                      <span className="text-[9px] font-medium">{occupancyRate}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1">
                      <div
                        className="bg-primary rounded-full h-1 transition-all"
                        style={{ width: `${occupancyRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {
        hostels.length === 0 && (
          <Card className="p-12 text-center">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="mb-2">No Hostels Found</h3>
            <p className="text-muted-foreground mb-4">
              {isAdmin ? 'Get started by adding your first hostel.' : 'No hostels available at the moment.'}
            </p>
          </Card>
        )
      }

      {/* Hostel Edit Dialog */}
      {renderHostelDialog()}
    </div >
  );
}
