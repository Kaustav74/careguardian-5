import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import HospitalLayout from "@/components/layout/HospitalLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { User, MapPin, Phone, Mail, Calendar, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function HospitalHomeVisits() {
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  // Fetch hospital details
  const { data: hospital, isLoading: hospitalLoading } = useQuery<any>({
    queryKey: ["/api/hospitals/me"],
  });

  // Fetch home visit requests
  const { data: homeVisits, isLoading: homeVisitsLoading } = useQuery<any[]>({
    queryKey: ["/api/home-visits"],
  });

  // Fetch doctors for this hospital
  const { data: doctors, isLoading: doctorsLoading } = useQuery<any[]>({
    queryKey: ["/api/hospitals", hospital?.id, "doctors"],
    enabled: !!hospital?.id,
  });

  // Get only available doctors
  const availableDoctors = doctors?.filter(d => d.availabilityStatus === "available") || [];

  // Assign doctor mutation
  const assignDoctorMutation = useMutation({
    mutationFn: async ({ requestId, doctorId }: { requestId: number; doctorId: number }) => {
      const response = await fetch(`/api/home-visits/${requestId}/assign`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "assigned",
          assignedHospitalId: hospital.id,
          assignedDoctorId: doctorId,
        }),
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to assign doctor");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/home-visits"] });
      toast({ title: "Doctor assigned successfully" });
      setIsAssignDialogOpen(false);
      setSelectedRequest(null);
      setSelectedDoctor("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to assign doctor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAssignDoctor = () => {
    if (!selectedDoctor || !selectedRequest) {
      toast({
        title: "Please select a doctor",
        variant: "destructive",
      });
      return;
    }

    assignDoctorMutation.mutate({
      requestId: selectedRequest.id,
      doctorId: parseInt(selectedDoctor),
    });
  };

  const openAssignDialog = (request: any) => {
    setSelectedRequest(request);
    setSelectedDoctor("");
    setIsAssignDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "assigned":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "urgent":
        return "text-red-600";
      case "high":
        return "text-orange-600";
      case "normal":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  if (hospitalLoading) {
    return (
      <HospitalLayout title="Home Visit Requests">
        <Skeleton className="h-64 w-full" />
      </HospitalLayout>
    );
  }

  if (!hospital) {
    return (
      <HospitalLayout title="Home Visit Requests">
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
    <HospitalLayout title="Home Visit Requests">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Home Visit Requests</h1>
          <p className="mt-1 text-sm text-gray-500">
            View patient requests and assign available doctors for home visits
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {homeVisits?.filter(h => h.status === "pending").length || 0}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Assigned</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {homeVisits?.filter(h => h.status === "assigned").length || 0}
                  </p>
                </div>
                <User className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Available Doctors</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {availableDoctors.length}
                  </p>
                </div>
                <User className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Requests List */}
        {homeVisitsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : homeVisits && homeVisits.length > 0 ? (
          <div className="space-y-4">
            {homeVisits.map((request) => (
              <Card key={request.id} data-testid={`request-card-${request.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">Home Visit Request #{request.id}</CardTitle>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                        {request.urgency && (
                          <Badge variant="outline" className={getUrgencyColor(request.urgency)}>
                            {request.urgency}
                          </Badge>
                        )}
                      </div>
                      <CardDescription>
                        Requested on {new Date(request.requestedDate).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    {request.status === "pending" && availableDoctors.length > 0 && (
                      <Button 
                        onClick={() => openAssignDialog(request)}
                        data-testid={`button-assign-${request.id}`}
                      >
                        Assign Doctor
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Patient Information */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">Patient Information</h4>
                      {request.user && (
                        <>
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-4 h-4 text-gray-500" />
                            <span>{request.user.fullName || request.user.username}</span>
                          </div>
                          {request.user.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-4 h-4 text-gray-500" />
                              <span>{request.user.email}</span>
                            </div>
                          )}
                          {request.user.phoneNumber && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-4 h-4 text-gray-500" />
                              <span>{request.user.phoneNumber}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Visit Details */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">Visit Details</h4>
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <span>{request.address}</span>
                      </div>
                      {request.preferredDate && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span>Preferred: {new Date(request.preferredDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Medical Condition */}
                  {request.medicalCondition && (
                    <div className="pt-3 border-t">
                      <h4 className="font-semibold text-gray-900 mb-2">Medical Condition</h4>
                      <p className="text-sm text-gray-700">{request.medicalCondition}</p>
                    </div>
                  )}

                  {/* Notes */}
                  {request.notes && (
                    <div className="pt-3 border-t">
                      <h4 className="font-semibold text-gray-900 mb-2">Additional Notes</h4>
                      <p className="text-sm text-gray-700">{request.notes}</p>
                    </div>
                  )}

                  {/* Assigned Doctor */}
                  {request.status === "assigned" && request.assignedDoctor && (
                    <div className="pt-3 border-t">
                      <h4 className="font-semibold text-gray-900 mb-2">Assigned Doctor</h4>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{request.assignedDoctor.name} - {request.assignedDoctor.specialty}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-center">No home visit requests yet</p>
            </CardContent>
          </Card>
        )}

        {/* Assign Doctor Dialog */}
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Doctor to Home Visit</DialogTitle>
              <DialogDescription>
                Select an available doctor to assign to this home visit request
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {availableDoctors.length > 0 ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Available Doctors ({availableDoctors.length})</label>
                    <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                      <SelectTrigger data-testid="select-assign-doctor">
                        <SelectValue placeholder="Select a doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDoctors.map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id.toString()}>
                            {doctor.name} - {doctor.specialty}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedRequest && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-sm mb-2">Request Details</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>Address: {selectedRequest.address}</p>
                        {selectedRequest.medicalCondition && (
                          <p>Condition: {selectedRequest.medicalCondition}</p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No doctors are currently available</p>
                  <p className="text-xs text-gray-500 mt-1">Please update doctor availability first</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAssignDoctor}
                disabled={!selectedDoctor || assignDoctorMutation.isPending || availableDoctors.length === 0}
                data-testid="button-confirm-assign"
              >
                {assignDoctorMutation.isPending ? "Assigning..." : "Assign Doctor"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </HospitalLayout>
  );
}
