import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { roomsApi, studentsApi, enrollmentsApi, hostelsApi } from '../../lib/apiClient';
import { Users, AlertTriangle, Calendar, Eye, Trash2, ArrowRightLeft } from 'lucide-react';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';

interface RoomDetailModalProps {
    room: any;
    onClose: () => void;
    onUpdate: () => void;
}

export function RoomDetailModal({ room, onClose, onUpdate }: RoomDetailModalProps) {
    const [roomData, setRoomData] = useState<any>(room);
    const [viewingResident, setViewingResident] = useState<any>(null);
    const [isViewResidentOpen, setIsViewResidentOpen] = useState(false);
    const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
    const [residentToMove, setResidentToMove] = useState<any>(null);
    const [hostels, setHostels] = useState<any[]>([]);
    const [selectedHostel, setSelectedHostel] = useState('');
    const [availableRooms, setAvailableRooms] = useState<any[]>([]);
    const [selectedRoom, setSelectedRoom] = useState('');

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const isAdmin = currentUser.role === 'admin';

    useEffect(() => {
        fetchRoomDetails();
        fetchHostels();
    }, [room._id]);

    const fetchRoomDetails = async () => {
        try {
            const data = await roomsApi.getById(room._id);
            setRoomData(data);
        } catch (error: any) {
            toast.error('Failed to load room details');
        }
    };

    const fetchHostels = async () => {
        try {
            const data = await hostelsApi.getAll();
            setHostels(data);
        } catch (error: any) {
            console.error('Failed to load hostels:', error);
        }
    };

    const handleDeleteResident = async (resident: any) => {
        if (!confirm(`Are you sure you want to remove ${resident.name} from this room?`)) return;

        try {
            await roomsApi.removeResident(roomData._id, resident._id);
            toast.success('Resident removed successfully!');
            fetchRoomDetails();
            onUpdate();
        } catch (error: any) {
            toast.error(error.message || 'Failed to remove resident');
        }
    };

    const handleMoveResident = (resident: any) => {
        setResidentToMove(resident);
        setSelectedHostel('');
        setSelectedRoom('');
        setAvailableRooms([]);
        setIsMoveDialogOpen(true);
    };

    const handleHostelChange = async (hostelId: string) => {
        setSelectedHostel(hostelId);
        setSelectedRoom('');

        if (hostelId) {
            try {
                const rooms = await roomsApi.getByHostelId(hostelId);
                // Filter out current room and full rooms
                const available = rooms.filter((r: any) => {
                    const residents = r.residents || [];
                    return r._id !== roomData._id && residents.length < r.capacity;
                });
                setAvailableRooms(available);
            } catch (error) {
                console.error('Failed to fetch rooms:', error);
                setAvailableRooms([]);
            }
        } else {
            setAvailableRooms([]);
        }
    };

    const confirmMoveResident = async () => {
        if (!residentToMove || !selectedRoom) {
            toast.error('Please select a room');
            return;
        }

        try {
            // Remove from current room
            await roomsApi.removeResident(roomData._id, residentToMove._id);

            // Add to new room
            const residentData = {
                name: residentToMove.name,
                studentId: residentToMove.studentId,
                email: residentToMove.email,
                phone: residentToMove.phone
            };
            await roomsApi.addResident(selectedRoom, residentData);

            const targetRoom = availableRooms.find(r => r._id === selectedRoom);
            toast.success(`${residentToMove.name} moved to Room ${targetRoom?.roomNumber} successfully!`);

            setIsMoveDialogOpen(false);
            setResidentToMove(null);
            fetchRoomDetails();
            onUpdate();
        } catch (error: any) {
            toast.error(error.message || 'Failed to move resident');
        }
    };





    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const residents = roomData.residents || [];
    const warnings = roomData.warnings || [];
    const isFull = residents.length >= roomData.capacity;

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="!w-[90%] sm:!w-[600px] !max-w-[650px] max-h-[90vh] overflow-hidden p-0 !rounded-2xl">
                <div className="p-6 border-b">
                    <DialogHeader className="text-left">
                        <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                            Room {roomData.roomNumber}
                            <Badge variant={isFull ? "destructive" : "outline"} className="text-xs">
                                {isFull ? 'Full' : 'Available'}
                            </Badge>
                        </DialogTitle>
                        <DialogDescription className="text-sm mt-1">
                            {residents.length} / {roomData.capacity} residents
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">

                    {/* Room Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                        <Card className="p-2 bg-primary/5">
                            <p className="text-muted-foreground text-[9px] mb-0.5">Floor</p>
                            <p className="font-medium text-sm">{roomData.floor}</p>
                        </Card>
                        <Card className="p-2 bg-blue-500/5">
                            <p className="text-muted-foreground text-[9px] mb-0.5">Capacity</p>
                            <p className="font-medium text-sm">{roomData.capacity}</p>
                        </Card>
                        <Card className="p-2 bg-green-500/5">
                            <p className="text-muted-foreground text-[9px] mb-0.5">Occupied</p>
                            <p className="font-medium text-sm">{residents.length}</p>
                        </Card>
                        <Card className="p-2 bg-purple-500/5">
                            <p className="text-muted-foreground text-[9px] mb-0.5">Last Checked</p>
                            <p className="font-medium text-[10px]">
                                {roomData.lastChecked ? formatDate(roomData.lastChecked) : 'N/A'}
                            </p>
                        </Card>
                    </div>

                    {/* Residents Section */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-base font-semibold flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Residents ({residents.length})
                            </h3>
                            {isAdmin && !isFull && (
                                <p className="text-xs text-muted-foreground">
                                    Add residents from the Students section
                                </p>
                            )}
                            {isAdmin && isFull && (
                                <Badge variant="secondary" className="text-xs">Room Full</Badge>
                            )}
                            {/* Add Resident dialog removed - students should be managed from Students section */}
                        </div>

                        {residents.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {residents.map((resident: any) => (
                                    <Card key={resident._id} className="p-4 hover:shadow-md transition-shadow">
                                        <div className="space-y-2 text-center">
                                            <p className="font-semibold text-base truncate">{resident.name}</p>
                                            <p className="text-sm text-muted-foreground truncate">{resident.studentId}</p>
                                            <p className="text-sm text-muted-foreground truncate">{resident.email}</p>
                                            <p className="text-xs text-muted-foreground truncate">{resident.phone}</p>

                                            <div className="flex justify-center gap-1 pt-2">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7"
                                                    onClick={async () => {
                                                        setViewingResident(resident);
                                                        setIsViewResidentOpen(true);
                                                        // Fetch student details
                                                        try {
                                                            const allStudents = await studentsApi.getAll();
                                                            const studentData = allStudents.find((s: any) => s.studentId === resident.studentId);
                                                            const enrollments = await enrollmentsApi.getByStudentId(resident.studentId);
                                                            setViewingResident({
                                                                ...resident,
                                                                faculty: studentData?.faculty,
                                                                gender: studentData?.gender,
                                                                enrollments: enrollments || []
                                                            });
                                                        } catch (error) {
                                                            console.error('Failed to fetch student details:', error);
                                                        }
                                                    }}
                                                    title="View Resident Details"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {isAdmin && (
                                                    <>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-7 w-7"
                                                            onClick={() => handleMoveResident(resident)}
                                                            title="Move to Another Room"
                                                        >
                                                            <ArrowRightLeft className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-7 w-7 text-destructive hover:text-destructive"
                                                            onClick={() => handleDeleteResident(resident)}
                                                            title="Remove from Room"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card className="p-6 text-center">
                                <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                                <p className="text-sm text-muted-foreground">No residents in this room</p>
                            </Card>
                        )}
                    </div>

                    {/* Warnings Section */}
                    <div>
                        <h3 className="text-base font-semibold flex items-center gap-2 mb-3">
                            <AlertTriangle className="h-4 w-4" />
                            Warning Letters ({warnings.length})
                        </h3>

                        {warnings.length > 0 ? (
                            <div className="space-y-2">
                                {warnings.map((warning: any, idx: number) => (
                                    <Card key={idx} className="p-2 border-l-2 border-l-yellow-500">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                                                        {warning.severity || 'Warning'}
                                                    </Badge>
                                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {formatDate(warning.createdAt)}
                                                    </span>
                                                </div>
                                                <p className="font-medium text-xs mb-0.5">{warning.title}</p>
                                                <p className="text-xs text-muted-foreground">{warning.description}</p>
                                                {warning.issuedBy && (
                                                    <p className="text-[10px] text-muted-foreground mt-1">
                                                        Issued by: {warning.issuedBy}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card className="p-4 text-center">
                                <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-xs text-muted-foreground">No warnings issued for this room</p>
                            </Card>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t bg-muted/30 flex gap-3 justify-end">
                    <Button type="button" onClick={onClose} className="px-6">
                        Close
                    </Button>
                </div>
            </DialogContent>

            {/* View Resident Dialog */}
            {viewingResident && (
                <Dialog open={isViewResidentOpen} onOpenChange={setIsViewResidentOpen}>
                    <DialogContent className="!w-[90%] sm:!w-[500px] !max-w-[550px] max-h-[90vh] overflow-hidden p-0 !rounded-2xl">
                        <div className="p-6 border-b">
                            <DialogHeader className="text-left">
                                <DialogTitle className="text-xl font-semibold">Resident Details</DialogTitle>
                                <DialogDescription className="text-sm mt-1">
                                    Complete information about {viewingResident.name}
                                </DialogDescription>
                            </DialogHeader>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-4">
                            <Card className="p-4 bg-primary/5 border-primary/20">
                                <h4 className="text-sm font-semibold mb-3">Personal Information</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Name:</span>
                                        <span className="font-medium">{viewingResident.name}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Student ID:</span>
                                        <span className="font-medium">{viewingResident.studentId}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Email:</span>
                                        <span className="font-medium">{viewingResident.email}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Phone:</span>
                                        <span className="font-medium">{viewingResident.phone}</span>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-4 bg-blue-500/5 border-blue-500/20">
                                <h4 className="text-sm font-semibold mb-3">Room Information</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Room Number:</span>
                                        <span className="font-medium">{roomData.roomNumber}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Hostel:</span>
                                        <span className="font-medium">{roomData.hostelName}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Floor:</span>
                                        <span className="font-medium">{roomData.floor}</span>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <div className="p-6 border-t bg-muted/30 flex gap-3 justify-end">
                            <Button type="button" onClick={() => setIsViewResidentOpen(false)} className="px-6">
                                Close
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* Move Resident Dialog */}
            <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
                <DialogContent className="!w-[90%] sm:!w-[550px] !max-w-[600px] max-h-[90vh] overflow-hidden p-0 !rounded-2xl">
                    <div className="p-6 border-b">
                        <DialogHeader className="text-left">
                            <DialogTitle className="text-xl font-semibold">Move Resident</DialogTitle>
                            <DialogDescription className="text-sm mt-1">
                                Move {residentToMove?.name} to another room
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-6 space-y-4">
                        <div>
                            <Label htmlFor="hostel" className="text-sm font-medium mb-2 block">Select Hostel</Label>
                            <select
                                id="hostel"
                                value={selectedHostel}
                                onChange={(e) => handleHostelChange(e.target.value)}
                                className="flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                            >
                                <option value="">Choose a hostel...</option>
                                {hostels.map((hostel) => (
                                    <option key={hostel._id} value={hostel._id}>
                                        {hostel.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <Label htmlFor="room" className="text-sm font-medium mb-2 block">Select Room</Label>
                            <select
                                id="room"
                                value={selectedRoom}
                                onChange={(e) => setSelectedRoom(e.target.value)}
                                className="flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                disabled={!selectedHostel}
                            >
                                <option value="">
                                    {selectedHostel ? 'Choose a room...' : 'Select hostel first'}
                                </option>
                                {availableRooms.map((room) => (
                                    <option key={room._id} value={room._id}>
                                        Room {room.roomNumber} (Floor {room.floor}) - {room.capacity - (room.residents?.length || 0)} spots available
                                    </option>
                                ))}
                            </select>
                            {selectedHostel && availableRooms.length === 0 && (
                                <p className="text-xs text-amber-600 mt-2">
                                    ⚠️ No available rooms in this hostel
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="p-6 border-t bg-muted/30 flex gap-3 justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsMoveDialogOpen(false)}
                            className="px-6"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={confirmMoveResident}
                            className="px-6"
                            disabled={!selectedRoom}
                        >
                            Move Resident
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </Dialog>
    );
}
