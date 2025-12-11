import { useState, useEffect } from 'react';
import { Calendar, Clock, User, CheckCircle, XCircle, Eye, Filter, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { toast } from 'sonner';

interface Appointment {
  id: number;
  service_name: string;
  department: string;
  student_name: string;
  student_email: string;
  student_phone: string;
  appointment_date: string;
  appointment_time: string;
  token_number: string;
  status: string;
  notes: string;
  admin_notes: string;
  queue_position?: number;
}

interface Service {
  id: number;
  name: string;
  description: string;
  duration: number;
  department: string;
  is_active: boolean;
}

interface Stats {
  overview: {
    total_appointments: number;
    pending: number;
    approved: number;
    completed: number;
    cancelled: number;
    today: number;
  };
  byService: Array<{ name: string; count: number }>;
}

export default function AdminAppointments() {
  const API_BASE = import.meta.env.VITE_APPOINTMENTS_API_URL || 'http://localhost:5002/api';
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [queue, setQueue] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [newService, setNewService] = useState({ name: '', description: '', duration: 30, department: '' });

  useEffect(() => {
    fetchAppointments();
    fetchQueue();
    fetchServices();
    fetchStats();
  }, [filterStatus, filterDate]);

  const fetchAppointments = async () => {
    try {
      let url = `${API_BASE}/appointments?`;
      if (filterStatus !== 'all') url += `status=${filterStatus}&`;
      if (filterDate) url += `date=${filterDate}`;
      
      const response = await fetch(url);
      const data = await response.json();
      setAppointments(data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const fetchQueue = async () => {
    try {
      const response = await fetch(`${API_BASE}/appointments/queue/today`);
      const data = await response.json();
      setQueue(data);
    } catch (error) {
      console.error('Error fetching queue:', error);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch(`${API_BASE}/services`);
      const data = await response.json();
      setServices(data);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/appointments/stats/overview`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const response = await fetch(`${API_BASE}/appointments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes })
      });

      if (response.ok) {
        toast.success(`Appointment ${status}`);
        setAdminNotes('');
        fetchAppointments();
        fetchQueue();
        fetchStats();
      } else {
        toast.error('Failed to update appointment');
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('Failed to update appointment');
    }
  };

  const handleCreateService = async () => {
    if (!newService.name) {
      toast.error('Service name is required');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newService)
      });

      if (response.ok) {
        toast.success('Service created successfully');
        setIsServiceDialogOpen(false);
        setNewService({ name: '', description: '', duration: 30, department: '' });
        fetchServices();
      } else {
        toast.error('Failed to create service');
      }
    } catch (error) {
      console.error('Error creating service:', error);
      toast.error('Failed to create service');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      pending: { variant: 'secondary', icon: <Clock className="w-3 h-3" /> },
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

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Appointment Management</h1>
          <p className="text-muted-foreground">Manage student appointments and queue</p>
        </div>
        <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Service</DialogTitle>
              <DialogDescription>Add a new service for appointments</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Service Name *</Label>
                <Input
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  placeholder="e.g., Academic Counseling"
                />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input
                  value={newService.department}
                  onChange={(e) => setNewService({ ...newService, department: e.target.value })}
                  placeholder="e.g., Student Affairs"
                />
              </div>
              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={newService.duration}
                  onChange={(e) => setNewService({ ...newService, duration: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  placeholder="Service description..."
                  rows={3}
                />
              </div>
              <Button onClick={handleCreateService} className="w-full">Create Service</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.overview.total_appointments}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Today</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.overview.today}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-600">{stats.overview.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{stats.overview.approved}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{stats.overview.completed}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">{stats.overview.cancelled}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="appointments" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="queue">Today's Queue</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appointments List */}
          <div className="grid gap-4">
            {appointments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No appointments found</p>
                </CardContent>
              </Card>
            ) : (
              appointments.map(appointment => (
                <Card key={appointment.id}>
                  <CardHeader>
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{appointment.service_name}</CardTitle>
                        <CardDescription>{appointment.department}</CardDescription>
                      </div>
                      {getStatusBadge(appointment.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Student</p>
                          <p className="font-medium">{appointment.student_name}</p>
                          <p className="text-xs text-muted-foreground">{appointment.student_email}</p>
                        </div>
                      </div>
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
                        <p className="text-xs text-muted-foreground">Token</p>
                        <p className="font-bold text-lg">{appointment.token_number}</p>
                      </div>
                    </div>

                    {appointment.notes && (
                      <div className="mb-4 p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Student Notes</p>
                        <p className="text-sm">{appointment.notes}</p>
                      </div>
                    )}

                    {appointment.status === 'pending' && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                          >
                            Review Appointment
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Review Appointment</DialogTitle>
                            <DialogDescription>
                              {appointment.student_name} - {appointment.service_name}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Admin Notes (Optional)</Label>
                              <Textarea
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                placeholder="Add notes for the student..."
                                rows={3}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleUpdateStatus(appointment.id, 'approved')}
                                className="flex-1"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve
                              </Button>
                              <Button
                                onClick={() => handleUpdateStatus(appointment.id, 'rejected')}
                                variant="destructive"
                                className="flex-1"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}

                    {appointment.status === 'approved' && (
                      <Button
                        onClick={() => handleUpdateStatus(appointment.id, 'completed')}
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        Mark as Completed
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Today's Queue ({queue.length})
              </CardTitle>
              <CardDescription>Real-time queue for {new Date().toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {queue.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No appointments in queue today</p>
                ) : (
                  queue.map((apt, index) => (
                    <div key={apt.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold">{apt.student_name}</p>
                          <p className="text-sm text-muted-foreground">{apt.service_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{apt.token_number}</p>
                        <p className="text-sm text-muted-foreground">{apt.appointment_time}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map(service => (
              <Card key={service.id}>
                <CardHeader>
                  <CardTitle>{service.name}</CardTitle>
                  <CardDescription>{service.department}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Duration: {service.duration} min</span>
                    <Badge variant={service.is_active ? 'default' : 'secondary'}>
                      {service.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
