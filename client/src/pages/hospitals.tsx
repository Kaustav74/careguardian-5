import Layout from "@/components/layout/Layout";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";

interface Hospital {
  id: number;
  name: string;
  address: string;
  phoneNumber: string;
  email?: string;
  rating: number;
  logo?: string;
}

export default function Hospitals() {
  const { data, isLoading } = useQuery({ 
    queryKey: ["/api/hospitals"]
  });
  
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (data) {
      setHospitals(data);
    }
  }, [data]);

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
                  <Button variant="outline" className="flex justify-center items-center">
                    <i className="ri-map-pin-line mr-1"></i>
                    Directions
                  </Button>
                  <Button className="flex justify-center items-center">
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
    </Layout>
  );
}
