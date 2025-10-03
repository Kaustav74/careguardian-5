import Layout from "@/components/layout/Layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, X } from "lucide-react";

// Form schema for booking an appointment
const appointmentSchema = z.object({
  department: z.string().min(1, "Please select a department"),
  doctorId: z.string().min(1, "Please select a doctor"),
  hospitalId: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  isVirtual: z.string().default("false"),
  notes: z.string().optional()
});

// Form schema for rescheduling
const rescheduleSchema = z.object({
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;
type RescheduleFormValues = z.infer<typeof rescheduleSchema>;

export default function Appointments() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");

  // Get appointments
  const { data: appointments, isLoading: isLoadingAppointments } = useQuery({
    queryKey: ["/api/appointments"],
  });

  // Get doctors for the form
  const { data: doctors, isLoading: isLoadingDoctors } = useQuery({
    queryKey: ["/api/doctors"],
  });
  
  // Booking mutation
  const bookAppointmentMutation = useMutation({
    mutationFn: async (appointment: AppointmentFormValues) => {
      // Transform form data to match backend schema
      const transformedData = {
        doctorId: parseInt(appointment.doctorId),
        hospitalId: appointment.hospitalId ? parseInt(appointment.hospitalId) : undefined,
        date: appointment.date,
        time: appointment.time,
        isVirtual: appointment.isVirtual === "true",
        notes: appointment.notes || undefined
      };
      const res = await apiRequest("POST", "/api/appointments", transformedData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Appointment booked",
        description: "Your appointment has been scheduled successfully.",
      });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to book appointment",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Cancel mutation
  const cancelAppointmentMutation = useMutation({
    mutationFn: async (appointmentId: number) => {
      const res = await apiRequest("POST", `/api/appointments/${appointmentId}/cancel`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Appointment cancelled",
        description: "Your appointment has been cancelled successfully.",
      });
      setCancelDialogOpen(false);
      setSelectedAppointment(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to cancel appointment",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Reschedule mutation
  const rescheduleAppointmentMutation = useMutation({
    mutationFn: async ({ appointmentId, data }: { appointmentId: number; data: RescheduleFormValues }) => {
      const res = await apiRequest("POST", `/api/appointments/${appointmentId}/reschedule`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Appointment rescheduled",
        description: "Your appointment has been rescheduled successfully.",
      });
      setRescheduleDialogOpen(false);
      setSelectedAppointment(null);
      rescheduleForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to reschedule appointment",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Set up the booking form
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      department: "",
      doctorId: "",
      hospitalId: "",
      date: "",
      time: "",
      isVirtual: "false",
      notes: ""
    }
  });

  // Get unique departments from doctors list
  const departments = doctors 
    ? Array.from(new Set((doctors as any[]).map((d: any) => d.department).filter((d) => d)))
    : [];

  // Filter doctors by selected department and availability
  const availableDoctors = selectedDepartment
    ? (doctors as any[])?.filter(
        (doctor: any) => 
          doctor.department === selectedDepartment && 
          doctor.availabilityStatus === "available"
      ) || []
    : [];

  // Set up the reschedule form
  const rescheduleForm = useForm<RescheduleFormValues>({
    resolver: zodResolver(rescheduleSchema),
    defaultValues: {
      date: "",
      time: "",
    }
  });

  const onSubmit = (data: AppointmentFormValues) => {
    bookAppointmentMutation.mutate(data);
  };

  const onRescheduleSubmit = (data: RescheduleFormValues) => {
    if (selectedAppointment) {
      rescheduleAppointmentMutation.mutate({ 
        appointmentId: selectedAppointment.id, 
        data 
      });
    }
  };

  const handleRescheduleClick = (appointment: any) => {
    setSelectedAppointment(appointment);
    rescheduleForm.setValue('date', new Date(appointment.date).toISOString().split('T')[0]);
    rescheduleForm.setValue('time', appointment.time);
    setRescheduleDialogOpen(true);
  };

  const handleCancelClick = (appointment: any) => {
    setSelectedAppointment(appointment);
    setCancelDialogOpen(true);
  };

  // Group appointments by upcoming or past
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [pastAppointments, setPastAppointments] = useState<any[]>([]);

  useEffect(() => {
    if (appointments) {
      const now = new Date();
      const upcoming: any[] = [];
      const past: any[] = [];

      (appointments as any[]).forEach((appointment: any) => {
        // Skip cancelled appointments from upcoming
        if (appointment.status === 'cancelled') {
          return;
        }
        
        const appointmentDate = new Date(appointment.date);
        if (appointmentDate > now) {
          upcoming.push(appointment);
        } else {
          past.push(appointment);
        }
      });

      // Sort appointments by date
      upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setUpcomingAppointments(upcoming);
      setPastAppointments(past);
    }
  }, [appointments]);

  return (
    <Layout title="Appointments">
      <div className="flex justify-end mb-6">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>Book New Appointment</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Book an Appointment</DialogTitle>
              <DialogDescription>
                Fill out the form below to schedule your appointment.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedDepartment(value);
                          form.setValue("doctorId", ""); // Reset doctor selection
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-department">
                            <SelectValue placeholder="Select department first" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingDoctors ? (
                            <div className="p-2">Loading departments...</div>
                          ) : departments.length === 0 ? (
                            <div className="p-2 text-gray-500">No departments available</div>
                          ) : (
                            departments.map((dept: any) => (
                              <SelectItem key={dept} value={dept}>
                                {dept}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedDepartment && (
                  <FormField
                    control={form.control}
                    name="doctorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Available Doctors</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            const doctor = availableDoctors.find((d: any) => d.id.toString() === value);
                            if (doctor && doctor.hospitalId) {
                              form.setValue("hospitalId", doctor.hospitalId.toString());
                            }
                          }}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-doctor">
                              <SelectValue placeholder="Select an available doctor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableDoctors.length === 0 ? (
                              <div className="p-2 text-gray-500">No available doctors in this department</div>
                            ) : (
                              availableDoctors.map((doctor: any) => (
                                <SelectItem key={doctor.id} value={doctor.id.toString()}>
                                  <div className="flex flex-col">
                                    <span className="font-semibold">{doctor.name}</span>
                                    <span className="text-xs text-gray-600">{doctor.specialty}</span>
                                    {doctor.hospital && (
                                      <span className="text-xs text-gray-500">Hospital: {doctor.hospital}</span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                        {field.value && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-md">
                            {(() => {
                              const doctor = availableDoctors.find((d: any) => d.id.toString() === field.value);
                              if (!doctor) return null;
                              return (
                                <div className="text-sm">
                                  <p className="font-semibold">{doctor.name}</p>
                                  <p className="text-gray-600">{doctor.specialty}</p>
                                  {doctor.hospital && <p className="text-gray-500">Hospital: {doctor.hospital}</p>}
                                  {doctor.email && <p className="text-gray-500">Email: {doctor.email}</p>}
                                  {doctor.phoneNumber && <p className="text-gray-500">Phone: {doctor.phoneNumber}</p>}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isVirtual"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Appointment Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select appointment type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="false">In-person</SelectItem>
                          <SelectItem value="true">Virtual</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={bookAppointmentMutation.isPending}
                >
                  {bookAppointmentMutation.isPending ? "Booking..." : "Book Appointment"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upcoming">
              {isLoadingAppointments ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : upcomingAppointments.length > 0 ? (
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment: any) => (
                    <div key={appointment.id} className="border rounded-lg p-4" data-testid={`appointment-card-${appointment.id}`}>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div>
                          <p className="font-medium" data-testid={`text-doctor-${appointment.id}`}>Dr. {appointment.doctorName || "Doctor"}</p>
                          <p className="text-sm text-gray-500">{appointment.doctorSpecialty || "Specialist"}</p>
                        </div>
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(appointment.date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                            <Clock className="h-4 w-4" />
                            {appointment.time}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              appointment.status === "scheduled" ? "bg-blue-100 text-blue-800" :
                              appointment.status === "cancelled" ? "bg-red-100 text-red-800" :
                              appointment.status === "completed" ? "bg-green-100 text-green-800" :
                              "bg-gray-100 text-gray-800"
                            }`}>
                              {appointment.status || "Scheduled"}
                            </span>
                            {appointment.isVirtual && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                Virtual
                              </span>
                            )}
                          </div>
                          {appointment.status !== 'cancelled' && (
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleRescheduleClick(appointment)}
                                data-testid={`button-reschedule-${appointment.id}`}
                              >
                                <Calendar className="h-4 w-4 mr-1" />
                                Reschedule
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleCancelClick(appointment)}
                                data-testid={`button-cancel-${appointment.id}`}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      {appointment.notes && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm text-gray-600">{appointment.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">You have no upcoming appointments.</p>
                  <Button onClick={() => setDialogOpen(true)} className="mt-4">Book an Appointment</Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="past">
              {isLoadingAppointments ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : pastAppointments.length > 0 ? (
                <div className="space-y-4">
                  {pastAppointments.map((appointment: any) => (
                    <div key={appointment.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div>
                          <p className="font-medium">Dr. {appointment.doctorName || "Doctor"}</p>
                          <p className="text-sm text-gray-500">{appointment.specialty || "Specialist"}</p>
                        </div>
                        <div>
                          <p className="font-medium">{new Date(appointment.date).toLocaleDateString()}</p>
                          <p className="text-sm text-gray-500">{appointment.time}</p>
                        </div>
                        <div className="flex items-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Completed
                          </span>
                          <Button size="sm" variant="ghost" className="ml-auto">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">You have no past appointments.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Change the date and time for your appointment with Dr. {selectedAppointment?.doctorName}.
            </DialogDescription>
          </DialogHeader>
          <Form {...rescheduleForm}>
            <form onSubmit={rescheduleForm.handleSubmit(onRescheduleSubmit)} className="space-y-4 mt-4">
              <FormField
                control={rescheduleForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-reschedule-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={rescheduleForm.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} data-testid="input-reschedule-time" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setRescheduleDialogOpen(false)}
                  data-testid="button-cancel-reschedule"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={rescheduleAppointmentMutation.isPending}
                  data-testid="button-confirm-reschedule"
                >
                  {rescheduleAppointmentMutation.isPending ? "Rescheduling..." : "Confirm Reschedule"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your appointment with Dr. {selectedAppointment?.doctorName} on {selectedAppointment && new Date(selectedAppointment.date).toLocaleDateString()} at {selectedAppointment?.time}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-confirmation-no">No, Keep It</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedAppointment && cancelAppointmentMutation.mutate(selectedAppointment.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={cancelAppointmentMutation.isPending}
              data-testid="button-cancel-confirmation-yes"
            >
              {cancelAppointmentMutation.isPending ? "Cancelling..." : "Yes, Cancel Appointment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
