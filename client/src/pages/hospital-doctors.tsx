import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import HospitalLayout from "@/components/layout/HospitalLayout";
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
import { Loader2, Plus, Mail, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";

const addDoctorSchema = z.object({
  name: z.string().min(1, "Doctor name is required"),
  specialty: z.string().min(1, "Specialty is required"),
  department: z.string().min(1, "Department is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phoneNumber: z.string().optional().or(z.literal("")),
  availabilityStatus: z.enum(["available", "unavailable", "on-leave"]).default("available"),
});

type AddDoctorFormValues = z.infer<typeof addDoctorSchema>;

export default function HospitalDoctors() {
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
      const response = await fetch(`/api/hospitals/${hospital.id}/doctors`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to add doctor");
      return response.json();
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
      const response = await fetch(`/api/doctors/${doctorId}/availability`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to update availability");
      return response.json();
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
        return "bg-green-100 text-green-800";
      case "unavailable":
        return "bg-red-100 text-red-800";
      case "on-leave":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (hospitalLoading) {
    return (
      <HospitalLayout title="Doctors">
        <Skeleton className="h-64 w-full" />
      </HospitalLayout>
    );
  }

  if (!hospital) {
    return (
      <HospitalLayout title="Doctors">
        <Card>
          <CardHeader>
            <CardTitle>Hospital Not Found</CardTitle>
            <CardDescription>
              Your hospital profile hasn't been set up yet.
            </CardDescription>
          </CardHeader>
        </Card>
      </HospitalLayout>
    );
  }

  return (
    <HospitalLayout title="Doctors">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Doctors Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your hospital's doctors and their availability
            </p>
          </div>
          <Dialog open={isAddDoctorOpen} onOpenChange={setIsAddDoctorOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-doctor">
                <Plus className="w-4 h-4 mr-2" />
                Add Doctor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Doctor</DialogTitle>
                <DialogDescription>
                  Add a doctor to your hospital staff
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
                    name="specialty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specialty</FormLabel>
                        <FormControl>
                          <Input placeholder="Cardiology" {...field} data-testid="input-specialty" />
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
                          <Input placeholder="Cardiology Department" {...field} data-testid="input-department" />
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
                          <Input type="email" placeholder="doctor@hospital.com" {...field} />
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
                          <Input placeholder="+1234567890" {...field} />
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
                        <FormLabel>Initial Availability</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select availability" />
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
                    <Button type="submit" disabled={addDoctorMutation.isPending}>
                      {addDoctorMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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

        {/* Doctors List */}
        {doctorsLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        ) : doctors && doctors.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {doctors.map((doctor) => (
              <Card key={doctor.id} data-testid={`doctor-card-${doctor.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{doctor.name}</CardTitle>
                      <CardDescription>{doctor.specialty}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(doctor.availabilityStatus)}>
                      {doctor.availabilityStatus}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Department</p>
                    <p className="text-sm text-gray-600">{doctor.department || "Not specified"}</p>
                  </div>
                  {doctor.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{doctor.email}</span>
                    </div>
                  )}
                  {doctor.phoneNumber && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{doctor.phoneNumber}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t">
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Change Availability
                    </label>
                    <Select
                      value={doctor.availabilityStatus}
                      onValueChange={(value) => handleStatusChange(doctor.id, value)}
                      disabled={updateAvailabilityMutation.isPending}
                    >
                      <SelectTrigger data-testid={`select-status-${doctor.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="unavailable">Unavailable</SelectItem>
                        <SelectItem value="on-leave">On Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-500 text-center mb-4">No doctors added yet</p>
              <Button onClick={() => setIsAddDoctorOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Doctor
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </HospitalLayout>
  );
}
