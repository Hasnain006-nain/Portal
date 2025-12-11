import { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Plus, Eye } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';

interface Service {
  id: number;
  name: string;
  description: string;
  duration: number;
  department: string;
}

interface Appointment {
  id: number;
  service_name: string;
  department: string;
  appointment_date: string;
  appointment_time: string;
  token_number: string;
  status: string;
  notes: string;
  admin_notes: string;
  queue_position?: number;
}

interface QueueAppointment extends Appointment {
  student_id: number;
}

interface TimeSlot {
  time: string;
  available: boolean;
  displayTime: string;
}

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [queueData, setQueueData] = useState<QueueAppointment[]>([]);

  const [user] = useState(() => JSON.parse(localStorage.getItem('currentUser') || '{}'));

  useEffect(() => {
    if (user.id) {
      fetchAppointments();
      fetchServices();
      fetchQueue();
    }
  }, []);

  useEffect(() => {
    if (selectedService && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedService, selectedDate]);

  const API_BASE = import.meta.env.VITE_APPOINTMENTS_API_URL || 'http://localhost:5002/api';

  const fetchAppointments = async () => {
    try {
      const response = await fetch(`${API_BASE}/appointments/student/${user.id}`);
      const data = await response.json();
      setAppointments(data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    setLoadingServices(true);
    try {
      const response = await fetch(`${API_BASE}/appointments/services`);
      const data = await response.json();
      setServices(data);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to load services');
    } finally {
      setLoadingServices(false);
    }
  };

  const fetchQueue = async () => {
    try {
      const response = await fetch(`${API_BASE}/appointments/queue/today`);
      const data = await response.json();
      setQueueData(data);
    } catch (error) {
      console.error('Error fetching queue:', error);
    }
  };

  const fetchAvailableSlots = async () => {
    setLoadingSlots(true);
    try {
      const response = await fetch(
        `${API_BASE}/appointments/available-slots?serviceId=${selectedService}&date=${selectedDate}`
      );
      const data = await response.json();
      setAvailableSlots(data);
    } catch (error) {
      console.error('Error fetching slots:', error);
      toast.error('Failed to load available slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedService || !selectedDate || !selectedTime) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: user.id,
          serviceId: selectedService,
          appointmentDate: selectedDate,
          appointmentTime: selectedTime,
          notes
        })
      });

      if (response.ok) {
        toast.success('Appointment booked successfully!');
        setIsDialogOpen(false);
        resetForm();
        fetchAppointments();
        fetchQueue();
      } else {
        toast.error('Failed to book appointment');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error('Failed to book appointment');
    }
  };

  const handleCancelAppointment = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;

    try {
      const response = await fetch(`${API_BASE}/appointments/${id}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: user.id })
      });

      if (response.ok) {
        toast.success('Appointment cancelled');
        fetchAppointments();
        fetchQueue();
      } else {
        toast.error('Failed to cancel appointment');
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Failed to cancel appointment');
    }
  };

  const resetForm = () => {
    setSelectedService('');
    setSelectedDate('');
    setSelectedTime('');
    setNotes('');
    setAvailableSlots([]);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      pending: { variant: 'secondary', icon: <AlertCircle className="w-3 h-3" /> },
      approved: { variant: 'default', icon: <CheckCircle className="w-3 h-3" /> },
      rejected: { variant: 'destructive', icon: <XCircle className="w-3 h-3" /> },
      completed: { variant: 'outline', icon: <CheckCircle className="w-3 h-3" /> },
      cancelled: { variant: 'outline', icon: <XCircle className="w-3 h-3" /> }
    };

    const config = variants[status] || variants.pending;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const myQueuePosition = queueData.find(apt => apt.student_id === user.id);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">My Appointments</h1>
          <p className="text-muted-foreground">Book and manage your appointments</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Book Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Book New Appointment</DialogTitle>
              <DialogDescription>Select a service, date, and time for your appointment</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Service *</Label>
                <Select value={selectedService} onValueChange={setSelectedService} disabled={loadingServices}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={loadingServices ? "Loading services..." : "Select a service"} />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[150]">
                    {loadingServices ? (
                      <div className="p-4 text-sm text-center text-muted-foreground">Loading services...</div>
                    ) : services.length === 0 ? (
                      <div className="p-4 text-sm text-center text-muted-foreground">No services available</div>
                    ) : (
                      services.map(service => (
                        <SelectItem key={service.id} value={service.id.toString()}>
                          <div className="flex flex-col py-1">
                            <span className="font-medium">{service.name}</span>
                            <span className="text-xs text-muted-foreground">{service.department} • {service.duration} min</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {services.length > 0 && !loadingServices && (
                  <p className="text-xs text-muted-foreground">{services.length} services available</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {selectedService && selectedDate && (
                <div className="space-y-2">
                  <Label>Available Time Slots *</Label>
                  {loadingSlots ? (
                    <p className="text-sm text-muted-foreground">Loading slots...</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {availableSlots.map(slot => (
                        <Button
                          key={slot.time}
                          variant={selectedTime === slot.time ? 'default' : 'outline'}
                          disabled={!slot.available}
                          onClick={() => setSelectedTime(slot.time)}
                          className="text-sm"
                        >
                          {slot.displayTime}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional information..."
                  rows={3}
                />
              </div>

              <Button onClick={handleBookAppointment} className="w-full">
                Confirm Booking
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Queue Status */}
      {myQueuePosition && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Your Queue Status Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Token Number</p>
                <p className="text-2xl font-bold">{myQueuePosition.token_number}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Queue Position</p>
                <p className="text-2xl font-bold">#{myQueuePosition.queue_position}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Service</p>
                <p className="font-semibold">{myQueuePosition.service_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-semibold">{myQueuePosition.appointment_time}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointments List */}
      <div className="grid gap-4">
        {appointments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No appointments yet</p>
              <p className="text-sm text-muted-foreground">Book your first appointment to get started</p>
            </CardContent>
          </Card>
        ) : (
          appointments.map(appointment => (
            <Card key={appointment.id}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{appointment.service_name}</CardTitle>
                    <CardDescription>{appointment.department}</CardDescription>
                  </div>
                  {getStatusBadge(appointment.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p className="font-medium">{new Date(appointment.appointment_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Time</p>
                      <p className="font-medium">{appointment.appointment_time}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Token Number</p>
                    <p className="font-bold text-lg">{appointment.token_number}</p>
                  </div>
                  {appointment.status === 'pending' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancelAppointment(appointment.id)}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
                {appointment.notes && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Your Notes</p>
                    <p className="text-sm">{appointment.notes}</p>
                  </div>
                )}
                {appointment.admin_notes && (
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Admin Notes</p>
                    <p className="text-sm">{appointment.admin_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
