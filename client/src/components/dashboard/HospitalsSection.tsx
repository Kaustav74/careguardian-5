import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface HospitalType {
  id: number;
  name: string;
  address: string;
  phoneNumber: string;
  rating: number;
  logo?: string;
}

export default function HospitalsSection() {
  const [_, navigate] = useLocation();
  const { data, isLoading, error } = useQuery({ 
    queryKey: ["/api/hospitals"]
  });
  
  const [hospitals, setHospitals] = useState<HospitalType[]>([]);

  useEffect(() => {
    if (data) {
      setHospitals(data);
    }
  }, [data]);

  // Show demo data if no hospitals are available
  useEffect(() => {
    if (!isLoading && (!data || data.length === 0)) {
      setHospitals([
        {
          id: 1,
          name: "City Medical Center",
          address: "123 Medical Ave, Chicago, IL",
          phoneNumber: "(312) 555-1234",
          rating: 4.5
        },
        {
          id: 2,
          name: "Memorial Hospital",
          address: "456 Health Blvd, Chicago, IL",
          phoneNumber: "(312) 555-6789",
          rating: 4.0
        },
        {
          id: 3,
          name: "University Medical Center",
          address: "789 University Way, Chicago, IL",
          phoneNumber: "(312) 555-9876",
          rating: 4.8
        }
      ]);
    }
  }, [isLoading, data]);

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

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">Hospitals Near You</h2>
        <a href="/hospitals" className="text-sm font-medium text-primary-600 hover:text-primary-500">View all</a>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <>
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </>
        ) : (
          hospitals.map((hospital) => (
            <div key={hospital.id} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded bg-gray-200 flex items-center justify-center text-gray-500">
                      <i className="ri-hospital-line text-2xl"></i>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{hospital.name}</h3>
                    <div className="mt-1 flex items-center">
                      <div className="flex items-center">
                        {renderStars(hospital.rating)}
                      </div>
                      <span className="ml-1 text-sm text-gray-500">
                        {hospital.rating.toFixed(1)} ({Math.floor(Math.random() * 200) + 50} reviews)
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{hospital.address}</p>
                    <div className="mt-3 flex items-center text-sm text-gray-500">
                      <i className="ri-phone-line mr-1"></i>
                      <span>{hospital.phoneNumber}</span>
                    </div>
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
            </div>
          ))
        )}
      </div>
    </section>
  );
}
