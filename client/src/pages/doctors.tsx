import Layout from "@/components/layout/Layout";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { Doctor } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

export default function Doctors() {
  const { data, isLoading } = useQuery({ 
    queryKey: ["/api/doctors"]
  });
  
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  
  useEffect(() => {
    if (data) {
      setDoctors(data);
    }
  }, [data]);

  // Get unique specialties for filter
  const specialties = doctors.length 
    ? [...new Set(doctors.map(doctor => doctor.specialty))]
    : [];

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = (
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doctor.hospital && doctor.hospital.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    const matchesSpecialty = !selectedSpecialty || doctor.specialty === selectedSpecialty;
    
    return matchesSearch && matchesSpecialty;
  });

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    
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

  return (
    <Layout title="Doctors">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Find Doctors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Input
              className="pl-10"
              placeholder="Search doctors by name, specialty, or hospital..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <i className="ri-search-line text-gray-400"></i>
            </div>
          </div>
          
          {specialties.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge 
                variant={!selectedSpecialty ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedSpecialty(null)}
              >
                All Specialties
              </Badge>
              {specialties.map(specialty => (
                <Badge 
                  key={specialty}
                  variant={selectedSpecialty === specialty ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedSpecialty(specialty)}
                >
                  {specialty}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))
        ) : filteredDoctors.length > 0 ? (
          filteredDoctors.map((doctor) => (
            <Card key={doctor.id} className="overflow-hidden">
              <div className="p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {doctor.profileImage ? (
                      <img 
                        src={doctor.profileImage} 
                        alt={doctor.name}
                        className="h-16 w-16 rounded-full object-cover" 
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                        <i className="ri-user-heart-line text-2xl"></i>
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{doctor.name}</h3>
                    <p className="text-sm font-medium text-primary-600">{doctor.specialty}</p>
                    {doctor.hospital && (
                      <p className="mt-1 text-sm text-gray-500">
                        <i className="ri-hospital-line mr-1"></i>
                        {doctor.hospital}
                      </p>
                    )}
                    {doctor.rating && (
                      <div className="mt-1 flex items-center">
                        <div className="flex items-center">
                          {renderStars(doctor.rating)}
                        </div>
                        <span className="ml-1 text-sm text-gray-500">
                          {doctor.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                    {doctor.availableDays && doctor.availableDays.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500">Available on:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {doctor.availableDays.map(day => (
                            <span key={day} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                              {day}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button variant="outline" className="flex justify-center items-center">
                    <i className="ri-phone-line mr-1"></i>
                    Contact
                  </Button>
                  <Button className="flex justify-center items-center">
                    <i className="ri-calendar-line mr-1"></i>
                    Book Appointment
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <i className="ri-user-search-line text-5xl text-gray-300"></i>
            <p className="mt-4 text-gray-500">No doctors found matching your search criteria</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
