import Layout from "@/components/layout/Layout";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { useLocation } from "wouter";

interface Hospital {
  id: number;
  name: string;
  address: string;
  phoneNumber: string;
  email?: string;
  rating: number;
  logo?: string;
  latitude?: string;
  longitude?: string;
}

export default function Hospitals() {
  const [_, navigate] = useLocation();
  const { data, isLoading } = useQuery({ 
    queryKey: ["/api/hospitals"]
  });
  
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [bookingHospital, setBookingHospital] = useState<Hospital | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (data && Array.isArray(data)) {
      setHospitals(data as Hospital[]);
    }
  }, [data]);

  // Function to open Google Maps directions
  const openDirections = (hospital: Hospital) => {
    // Use the hospital's latitude and longitude if available, otherwise use the address
    let destination;
    if (hospital.latitude && hospital.longitude) {
      destination = `${hospital.latitude},${hospital.longitude}`;
    } else {
      destination = encodeURIComponent(hospital.address);
    }
    
    // Open Google Maps in a new tab with directions to the hospital
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&destination_name=${encodeURIComponent(hospital.name)}`;
    window.open(mapsUrl, '_blank');
  };

  // Function to handle booking a visit
  const handleBookVisit = (hospital: Hospital) => {
    setBookingHospital(hospital);
    setDialogOpen(true);
  };

  // Function to confirm hospital visit booking (redirects to appointments page with hospital pre-selected)
  const confirmBookVisit = () => {
    if (bookingHospital) {
      // Navigate to appointments page with the hospital information
      navigate('/appointments');
      setDialogOpen(false);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<i key={`full-${i}`} className="ri-star-fill text-yellow-400"></i>);
    }
    
    if (hasHalfStar) {
      stars.push(<i key="half" className="ri-star-half-fill text-yellow-400"></i>);
    }
    
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<i key={`empty-${i}`} className="ri-star-line text-yellow-400"></i>);
    }
    
    return stars;
  };

  const filteredHospitals = hospitals.filter(hospital => 
    hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hospital.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout title="Hospitals">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Find Hospitals Near You</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Input
              className="pl-10"
              placeholder="Search hospitals by name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <i className="ri-search-line text-gray-400"></i>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))
        ) : filteredHospitals.length > 0 ? (
          filteredHospitals.map((hospital) => (
            <Card key={hospital.id} className="overflow-hidden">
              <div className="p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-16 w-16 rounded bg-gray-200 flex items-center justify-center text-gray-500">
                      <i className="ri-hospital-line text-2xl"></i>
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{hospital.name}</h3>
                    <div className="mt-1 flex items-center">
                      <div className="flex items-center">
                        {renderStars(hospital.rating)}
                      </div>
                      <span className="ml-1 text-sm text-gray-500">
                        {hospital.rating.toFixed(1)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{hospital.address}</p>
                    <div className="mt-3 flex items-center text-sm text-gray-500">
                      <i className="ri-phone-line mr-1"></i>
                      <span>{hospital.phoneNumber}</span>
                    </div>
                    {hospital.email && (
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <i className="ri-mail-line mr-1"></i>
                        <span>{hospital.email}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    className="flex justify-center items-center"
                    onClick={() => openDirections(hospital)}
                  >
                    <i className="ri-map-pin-line mr-1"></i>
                    Directions
                  </Button>
                  <Button 
                    className="flex justify-center items-center"
                    onClick={() => handleBookVisit(hospital)}
                  >
                    <i className="ri-calendar-line mr-1"></i>
                    Book Visit
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <i className="ri-search-line text-5xl text-gray-300"></i>
            <p className="mt-4 text-gray-500">No hospitals found matching "{searchTerm}"</p>
          </div>
        )}
      </div>
      {/* Book Visit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Book a Hospital Visit</DialogTitle>
            <DialogDescription>
              {bookingHospital ? (
                <>
                  You are about to book a visit to <span className="font-medium">{bookingHospital.name}</span>.
                  You'll be redirected to the appointments page to select a time and doctor.
                </>
              ) : 'Schedule your hospital visit'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {bookingHospital && (
              <div className="mb-4">
                <div className="flex items-start mb-3">
                  <div className="h-10 w-10 rounded bg-blue-100 flex items-center justify-center text-blue-500 flex-shrink-0">
                    <i className="ri-hospital-line text-xl"></i>
                  </div>
                  <div className="ml-3">
                    <h4 className="font-medium text-gray-900">{bookingHospital.name}</h4>
                    <p className="text-sm text-gray-500">{bookingHospital.address}</p>
                  </div>
                </div>
                
                <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-700 mb-4">
                  <div className="flex">
                    <i className="ri-information-line mr-2 mt-0.5"></i>
                    <div>
                      <p className="font-medium">Scheduling Information</p>
                      <p>You'll need to select a doctor and an available time slot in the next step.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmBookVisit}>
              Continue to Booking
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
