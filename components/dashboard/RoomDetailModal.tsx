import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { roomsApi, studentsApi, hostelsApi } from '../../lib/apiClient';
import { Users, AlertTriangle, Calendar, Eye, Trash2, ArrowRightLeft, X, Plus, UserPlus, Home, DoorOpen } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface RoomDetailModalProps {
  room: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

interface Resident {
  id: string;
  name: string;
  studentId: string;
  email: string;
  phone?: string;
  checkInDate?: string;
  status: 'active' | 'checked_out';
}

export function RoomDetailModal({ room, isOpen, onClose, onUpdate }: RoomDetailModalProps) {
  const [roomData, setRoomData] = useState<any>(room);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddResidentOpen, setIsAddResidentOpen] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [warnings, setWarnings] = useState<any[]>([]);

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const isAdmin = currentUser.role === 'admin';

  useEffect(() => {
    if (isOpen && room) {
      fetchRoomDetails();
      fetchAvailableStudents();
    }
  }, [isOpen, room]);

  const fetchRoomDetails = async () => {
    try {
      setLoading(true);
      const data = await roomsApi.getById(room.id);
      setRoomData(data);
      setResidents(data.residents || []);
      setWarnings(data.warnings || []);
    } catch (error: any) {
      toast.error('Failed to load room details');
      console.error('Error fetching room details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableStudents = async () => {
    try {
      const students = await studentsApi.getAll();
      // Filter students who are not already assigned to any room
      const unassigned = students.filter((student: any) => !student.room_id);
      setAvailableStudents(unassigned);
    } catch (error: any) {
      console.error('Failed to fetch students:', error);
      setAvailableStudents([]);
    }
  };

  const handleAddResident = async () => {
    if (!selectedStudent) {
      toast.error('Please select a student');
      return;
    }

    try {
      const student = availableStudents.find(s => s.id === selectedStudent);
      if (!student) {
        toast.error('Student not found');
        return;
      }

      const residentData = {
        name: student.name,
        studentId: student.student_id,
        email: student.email,
        phone: student.phone,
        checkInDate: new Date().toISOString().split('T')[0],
        status: 'active'
      };

      await roomsApi.addResident(roomData.id, residentData);
      toast.success('Resident added successfully!');
      setIsAddResidentOpen(false);
      setSelectedStudent('');
      fetchRoomDetails();
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add resident');
    }
  };

  const handleRemoveResident = async (resident: Resident) => {
    if (!confirm(`Are you sure you want to remove ${resident.name} from this room?`)) return;

    try {
      await roomsApi.removeResident(roomData.id, resident.id);
      toast.success('Resident removed successfully!');
      fetchRoomDetails();
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove resident');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500/10 text-green-700 border-green-200 dark:text-green-300 dark:border-green-800';
      case 'occupied':
        return 'bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-300 dark:border-blue-800';
      case 'maintenance':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-200 dark:text-yellow-300 dark:border-yellow-800';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200 dark:text-gray-300 dark:border-gray-800';
    }
  };

  if (!room) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <DoorOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">Room {roomData?.room_number || room.room_number}</DialogTitle>
                <DialogDescription>
                  Floor {roomData?.floor || room.floor} • Capacity: {roomData?.capacity || room.capacity}
                </DialogDescription>
              </div>
            </div>
            <Badge className={getStatusColor(roomData?.status || room.status)}>
              {(roomData?.status || room.status)?.charAt(0).toUpperCase() + (roomData?.status || room.status)?.slice(1)}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex flex-col h-full max-h-[70vh] overflow-hidden">
          {/* Room Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Occupancy</p>
                  <p className="text-lg font-semibold">
                    {residents.length}/{roomData?.capacity || room.capacity}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <DoorOpen className="h-6 w-6 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Available</p>
                  <p className="text-lg font-semibold">
                    {(roomData?.capacity || room.capacity) - residents.length}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Home className="h-6 w-6 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Floor</p>
                  <p className="text-lg font-semibold">{roomData?.floor || room.floor}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Warnings</p>
                  <p className="text-lg font-semibold">{warnings.length}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Residents Section */}
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Residents ({residents.length})
              </h3>
              {isAdmin && residents.length < (roomData?.capacity || room.capacity) && (
                <Button
                  onClick={() => setIsAddResidentOpen(true)}
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Resident
                </Button>
              )}
            </div>

            <div className="overflow-y-auto max-h-[40vh] space-y-3">
              <AnimatePresence>
                {residents.length > 0 ? (
                  residents.map((resident, index) => (
                    <motion.div
                      key={resident.id || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="p-4 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary">
                                {resident.name?.charAt(0).toUpperCase() || 'R'}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-medium">{resident.name}</h4>
                              <p className="text-sm text-muted-foreground">ID: {resident.studentId}</p>
                              <p className="text-xs text-muted-foreground">{resident.email}</p>
                              {resident.checkInDate && (
                                <p className="text-xs text-muted-foreground">
                                  Check-in: {new Date(resident.checkInDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={resident.status === 'active' 
                                ? 'border-green-500 text-green-700' 
                                : 'border-gray-500 text-gray-700'
                              }
                            >
                              {resident.status}
                            </Badge>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveResident(resident)}
                                className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <Card className="p-8 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No residents in this room</h3>
                    <p className="text-muted-foreground mb-4">This room is currently empty</p>
                    {isAdmin && (
                      <Button onClick={() => setIsAddResidentOpen(true)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add First Resident
                      </Button>
                    )}
                  </Card>
                )}
              </AnimatePresence>
            </div>

            {/* Warnings Section */}
            {warnings.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Warning Letters ({warnings.length})
                </h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {warnings.map((warning: any, index: number) => (
                    <Card key={index} className="p-3 bg-orange-50 border-orange-200 dark:bg-orange-950/20">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{warning.title}</p>
                          <p className="text-xs text-muted-foreground">{warning.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(warning.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add Resident Dialog */}
        <Dialog open={isAddResidentOpen} onOpenChange={setIsAddResidentOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Resident to Room {roomData?.room_number}</DialogTitle>
              <DialogDescription>
                Select a student to assign to this room
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="student">Select Student</Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose a student..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStudents.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        <div className="flex flex-col">
                          <span>{student.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ID: {student.student_id} • {student.email}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableStudents.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    No unassigned students available
                  </p>
                )}
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddResidentOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddResident}
                  disabled={!selectedStudent}
                  className="flex-1"
                >
                  Add Resident
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}