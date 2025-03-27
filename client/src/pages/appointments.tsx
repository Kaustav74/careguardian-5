import Layout from "@/components/layout/Layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Check, Calendar, Clock } from "lucide-react";

// Sample available time slots by doctor and hospital
const availableSlots = [
  {
    id: 1,
    doctorId: 4,
    doctorName: "Dr. Arun Kumar",
    specialty: "Cardiologist",
    hospitalId: 4,
    hospitalName: "Manipal Hospital",
    dateTime: "2025-04-01 09:00 AM",
    date: "2025-04-01",
    time: "09:00 AM",
  },
  {
    id: 2,
    doctorId: 4,
    doctorName: "Dr. Arun Kumar",
    specialty: "Cardiologist",
    hospitalId: 4,
    hospitalName: "Manipal Hospital",
    dateTime: "2025-04-01 10:30 AM",
    date: "2025-04-01",
    time: "10:30 AM",
  },
  {
    id: 3,
    doctorId: 5,
    doctorName: "Dr. Lakshmi Nair",
    specialty: "Pediatrician",
    hospitalId: 5,
    hospitalName: "Columbia Asia Hospital",
    dateTime: "2025-04-02 11:00 AM",
    date: "2025-04-02",
    time: "11:00 AM",
  },
  {
    id: 4,
    doctorId: 6,
    doctorName: "Dr. Rajesh Patel",
    specialty: "Neurologist",
    hospitalId: 6,
    hospitalName: "Fortis Hospital",
    dateTime: "2025-04-03 02:00 PM",
    date: "2025-04-03",
    time: "02:00 PM",
  },
  {
    id: 5,
    doctorId: 7,
    doctorName: "Dr. Priya Singh",
    specialty: "Dermatologist",
    hospitalId: 7,
    hospitalName: "Apollo Hospital",
    dateTime: "2025-04-02 03:30 PM",
    date: "2025-04-02",
    time: "03:30 PM",
  },
];

// Our simplified appointment schema that matches the database
const appointmentSchema = z.object({
  doctorId: z.number(),
  hospitalId: z.number(),
  date: z.string(),
  time: z.string(),
  isVirtual: z.boolean().default(false),
  notes: z.string().optional(),
  slotId: z.number()
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

export default function Appointments() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);

  // Get appointments
  const { data: appointmentsRaw = [], isLoading: isLoadingAppointments } = useQuery({
    queryKey: ["/api/appointments"],
  });

  // Get doctors for information display
  const { data: doctors = [], isLoading: isLoadingDoctors } = useQuery({
    queryKey: ["/api/doctors"],
  });
  
  // Get hospitals for information display
  const { data: hospitals = [], isLoading: isLoadingHospitals } = useQuery({
    queryKey: ["/api/hospitals"],
  });

  // Booking mutation
  const bookAppointmentMutation = useMutation({
    mutationFn: async (appointment: any) => {
      const res = await apiRequest("POST", "/api/appointments", appointment);
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
      setSelectedSlot(null);
    },
    onError: (error) => {
      console.error("Booking error:", error);
      toast({
        title: "Failed to book appointment",
        description: error.message || "There was an error booking your appointment. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Cancel appointment mutation
  const cancelAppointmentMutation = useMutation({
    mutationFn: async (appointmentId: number) => {
      const res = await apiRequest(
        "PATCH", 
        `/api/appointments/${appointmentId}/status`, 
        { status: "cancelled" }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Appointment cancelled",
        description: "Your appointment has been cancelled successfully.",
      });
    },
    onError: (error) => {
      console.error("Cancellation error:", error);
      toast({
        title: "Failed to cancel appointment",
        description: error.message || "There was an error cancelling your appointment. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Function to handle appointment cancellation
  const cancelAppointment = (appointmentId: number) => {
    // Ask for confirmation before cancelling
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      cancelAppointmentMutation.mutate(appointmentId);
    }
  };

  // Enrich appointment data with doctor and hospital info
  const appointments = Array.isArray(appointmentsRaw) ? appointmentsRaw.map(appointment => {
    // Find the doctor for this appointment
    const doctor = Array.isArray(doctors) 
      ? doctors.find((d: any) => d.id === appointment.doctorId) || { name: "Unknown Doctor", specialty: "Specialist" }
      : { name: "Unknown Doctor", specialty: "Specialist" };
      
    // Find the hospital for this appointment
    const hospital = Array.isArray(hospitals)
      ? hospitals.find((h: any) => h.id === appointment.hospitalId) || { name: "Unknown Hospital" }
      : { name: "Unknown Hospital" };
    
    return {
      ...appointment,
      doctorName: doctor.name,
      specialty: doctor.specialty,
      hospitalName: hospital.name
    };
  }) : [];

  // Set up the form with type assertions to satisfy TypeScript
  const form = useForm<any>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      doctorId: 0,
      hospitalId: 0,
      date: "",
      time: "",
      isVirtual: false,
      notes: "",
      slotId: 0
    }
  });

  // Update form when a slot is selected
  useEffect(() => {
    if (selectedSlot) {
      form.setValue("doctorId", selectedSlot.doctorId);
      form.setValue("hospitalId", selectedSlot.hospitalId);
      form.setValue("date", selectedSlot.date);
      form.setValue("time", selectedSlot.time);
      form.setValue("slotId", selectedSlot.id);
    }
  }, [selectedSlot, form]);

  const onSubmit = (data: any) => {
    if (!selectedSlot) {
      toast({
        title: "No slot selected",
        description: "Please select an available appointment slot first.",
        variant: "destructive"
      });
      return;
    }
    
    // Format the date as expected by the server
    const appointmentDate = new Date(data.date);
    
    // Submit the formatted data
    bookAppointmentMutation.mutate({
      doctorId: data.doctorId,
      hospitalId: data.hospitalId,
      date: appointmentDate.toISOString(), // Convert to ISO string for server
      time: data.time,
      isVirtual: data.isVirtual,
      notes: data.notes
    });
  };

  // Group appointments by upcoming or past
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [pastAppointments, setPastAppointments] = useState<any[]>([]);

  useEffect(() => {
    if (appointments && Array.isArray(appointments)) {
      const now = new Date();
      const upcoming: any[] = [];
      const past: any[] = [];

      appointments.forEach((appointment: any) => {
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
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Book an Appointment</DialogTitle>
              <DialogDescription>
                Select from available appointment slots below.
              </DialogDescription>
            </DialogHeader>
            
            {/* Available slots section */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Available Appointments</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {availableSlots.map((slot) => (
                  <div 
                    key={slot.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedSlot?.id === slot.id 
                        ? 'bg-blue-50 border-blue-300' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{slot.doctorName}</p>
                        <p className="text-sm text-gray-500">{slot.specialty}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center text-gray-600 text-sm">
                          <Calendar className="h-3.5 w-3.5 mr-1" />
                          {new Date(slot.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center text-gray-600 text-sm">
                          <Clock className="h-3.5 w-3.5 mr-1" />
                          {slot.time}
                        </div>
                      </div>
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      {slot.hospitalName}
                    </div>
                    {selectedSlot?.id === slot.id && (
                      <div className="absolute -right-2 -top-2 bg-green-500 text-white rounded-full p-1">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any specific concerns or information for the doctor"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Pay at Hospital Badge */}
                <div className="bg-blue-50 p-3 rounded-md border border-blue-200 flex items-center justify-center">
                  <span className="text-blue-800 font-medium">Pay at Hospital</span>
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={bookAppointmentMutation.isPending || !selectedSlot}
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
                    <div key={appointment.id} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div>
                          <p className="font-medium">Dr. {appointment.doctorName}</p>
                          <p className="text-sm text-gray-500">{appointment.specialty || "Specialist"}</p>
                        </div>
                        <div>
                          <p className="font-medium">{new Date(appointment.date).toLocaleDateString()}</p>
                          <p className="text-sm text-gray-500">{appointment.time}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            appointment.status === "scheduled" ? "bg-blue-100 text-blue-800" :
                            appointment.status === "completed" ? "bg-green-100 text-green-800" :
                            appointment.status === "cancelled" ? "bg-red-100 text-red-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {appointment.status || "Scheduled"}
                          </span>
                          {appointment.isVirtual && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              Virtual
                            </span>
                          )}
                          <div className="flex items-center gap-2 ml-auto">
                            {appointment.status !== "cancelled" && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => cancelAppointment(appointment.id)}
                              >
                                Cancel
                              </Button>
                            )}
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Pay at Hospital
                            </span>
                          </div>
                        </div>
                      </div>
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
                          <p className="font-medium">Dr. {appointment.doctorName}</p>
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
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 ml-auto">
                            Paid
                          </span>
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
    </Layout>
  );
}