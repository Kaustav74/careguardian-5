import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, User, Mail, Phone, Stethoscope } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const addDoctorSchema = z.object({
  name: z.string().min(1, "Doctor name is required"),
  specialty: z.string().min(1, "Specialty is required"),
  department: z.string().min(1, "Department is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phoneNumber: z.string().optional().or(z.literal("")),
  availabilityStatus: z.enum(["available", "unavailable", "on-leave"]).default("available"),
});

type AddDoctorFormValues = z.infer<typeof addDoctorSchema>;

export default function HospitalDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddDoctorOpen, setIsAddDoctorOpen] = useState(false);

  // Fetch current hospital details
  const { data: hospital, isLoading: hospitalLoading } = useQuery<any>({
    queryKey: ["/api/hospitals/me"],
  });

  // Fetch doctors for this hospital
  const { data: doctors, isLoading: doctorsLoading } = useQuery<any[]>({
    queryKey: ["/api/hospitals", hospital?.id, "doctors"],
    enabled: !!hospital?.id,
  });

  // Add doctor form
  const addDoctorForm = useForm<AddDoctorFormValues>({
    resolver: zodResolver(addDoctorSchema),
    defaultValues: {
      name: "",
      specialty: "",
      department: "",
      email: "",
      phoneNumber: "",
      availabilityStatus: "available",
    },
  });

  // Add doctor mutation
  const addDoctorMutation = useMutation({
    mutationFn: async (data: AddDoctorFormValues) => {
      return apiRequest(`/api/hospitals/${hospital.id}/doctors`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hospitals", hospital.id, "doctors"] });
      toast({ title: "Doctor added successfully" });
      setIsAddDoctorOpen(false);
      addDoctorForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add doctor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update doctor availability mutation
  const updateAvailabilityMutation = useMutation({
    mutationFn: async ({ doctorId, status }: { doctorId: number; status: string }) => {
      return apiRequest(`/api/doctors/${doctorId}/availability`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hospitals", hospital.id, "doctors"] });
      toast({ title: "Doctor availability updated" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update availability",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onAddDoctor = (data: AddDoctorFormValues) => {
    addDoctorMutation.mutate(data);
  };

  const handleStatusChange = (doctorId: number, newStatus: string) => {
    updateAvailabilityMutation.mutate({ doctorId, status: newStatus });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500";
      case "unavailable":
        return "bg-red-500";
      case "on-leave":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge className="bg-green-500 hover:bg-green-600">Available</Badge>;
      case "unavailable":
        return <Badge className="bg-red-500 hover:bg-red-600">Unavailable</Badge>;
      case "on-leave":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">On Leave</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  // Group doctors by availability status
  const availableDoctors = doctors?.filter((d) => d.availabilityStatus === "available") || [];
  const unavailableDoctors = doctors?.filter((d) => d.availabilityStatus === "unavailable") || [];
  const onLeaveDoctors = doctors?.filter((d) => d.availabilityStatus === "on-leave") || [];

  if (hospitalLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Hospital Not Found</CardTitle>
            <CardDescription>
              Your hospital profile hasn't been set up yet. Please contact support.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{hospital.name}</h1>
        <p className="text-gray-600">{hospital.address}, {hospital.city}, {hospital.state}</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Doctor Management</h2>
        <Dialog open={isAddDoctorOpen} onOpenChange={setIsAddDoctorOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-doctor">
              <Plus className="mr-2 h-4 w-4" />
              Add Doctor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Doctor</DialogTitle>
              <DialogDescription>
                Assign a new doctor to your hospital
              </DialogDescription>
            </DialogHeader>
            <Form {...addDoctorForm}>
              <form onSubmit={addDoctorForm.handleSubmit(onAddDoctor)} className="space-y-4">
                <FormField
                  control={addDoctorForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Doctor Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Dr. John Doe" {...field} data-testid="input-doctor-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addDoctorForm.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <Input placeholder="Cardiology" {...field} data-testid="input-doctor-department" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addDoctorForm.control}
                  name="specialty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specialty</FormLabel>
                      <FormControl>
                        <Input placeholder="Cardiologist" {...field} data-testid="input-doctor-specialty" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addDoctorForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Optional)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="doctor@example.com" {...field} data-testid="input-doctor-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addDoctorForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="+1234567890" {...field} data-testid="input-doctor-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addDoctorForm.control}
                  name="availabilityStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Availability Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-doctor-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="unavailable">Unavailable</SelectItem>
                          <SelectItem value="on-leave">On Leave</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={addDoctorMutation.isPending}
                    data-testid="button-submit-doctor"
                  >
                    {addDoctorMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Doctor"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {doctorsLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Available Doctors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                Available Doctors ({availableDoctors.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {availableDoctors.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No available doctors</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableDoctors.map((doctor) => (
                    <Card key={doctor.id} className="border-l-4 border-green-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg" data-testid={`text-doctor-name-${doctor.id}`}>{doctor.name}</h3>
                            <p className="text-sm text-gray-600">{doctor.specialty}</p>
                            <p className="text-xs text-gray-500">{doctor.department}</p>
                          </div>
                          {getStatusBadge(doctor.availabilityStatus)}
                        </div>
                        {doctor.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{doctor.email}</span>
                          </div>
                        )}
                        {doctor.phoneNumber && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                            <Phone className="h-3 w-3" />
                            <span>{doctor.phoneNumber}</span>
                          </div>
                        )}
                        <Select
                          onValueChange={(value) => handleStatusChange(doctor.id, value)}
                          defaultValue={doctor.availabilityStatus}
                        >
                          <SelectTrigger className="w-full" data-testid={`select-status-${doctor.id}`}>
                            <SelectValue placeholder="Change status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="unavailable">Unavailable</SelectItem>
                            <SelectItem value="on-leave">On Leave</SelectItem>
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Unavailable Doctors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500"></div>
                Unavailable Doctors ({unavailableDoctors.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {unavailableDoctors.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No unavailable doctors</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {unavailableDoctors.map((doctor) => (
                    <Card key={doctor.id} className="border-l-4 border-red-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg" data-testid={`text-doctor-name-${doctor.id}`}>{doctor.name}</h3>
                            <p className="text-sm text-gray-600">{doctor.specialty}</p>
                            <p className="text-xs text-gray-500">{doctor.department}</p>
                          </div>
                          {getStatusBadge(doctor.availabilityStatus)}
                        </div>
                        {doctor.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{doctor.email}</span>
                          </div>
                        )}
                        {doctor.phoneNumber && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                            <Phone className="h-3 w-3" />
                            <span>{doctor.phoneNumber}</span>
                          </div>
                        )}
                        <Select
                          onValueChange={(value) => handleStatusChange(doctor.id, value)}
                          defaultValue={doctor.availabilityStatus}
                        >
                          <SelectTrigger className="w-full" data-testid={`select-status-${doctor.id}`}>
                            <SelectValue placeholder="Change status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="unavailable">Unavailable</SelectItem>
                            <SelectItem value="on-leave">On Leave</SelectItem>
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Doctors on Leave */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                Doctors on Leave ({onLeaveDoctors.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {onLeaveDoctors.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No doctors on leave</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {onLeaveDoctors.map((doctor) => (
                    <Card key={doctor.id} className="border-l-4 border-yellow-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg" data-testid={`text-doctor-name-${doctor.id}`}>{doctor.name}</h3>
                            <p className="text-sm text-gray-600">{doctor.specialty}</p>
                            <p className="text-xs text-gray-500">{doctor.department}</p>
                          </div>
                          {getStatusBadge(doctor.availabilityStatus)}
                        </div>
                        {doctor.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{doctor.email}</span>
                          </div>
                        )}
                        {doctor.phoneNumber && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                            <Phone className="h-3 w-3" />
                            <span>{doctor.phoneNumber}</span>
                          </div>
                        )}
                        <Select
                          onValueChange={(value) => handleStatusChange(doctor.id, value)}
                          defaultValue={doctor.availabilityStatus}
                        >
                          <SelectTrigger className="w-full" data-testid={`select-status-${doctor.id}`}>
                            <SelectValue placeholder="Change status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="unavailable">Unavailable</SelectItem>
                            <SelectItem value="on-leave">On Leave</SelectItem>
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
