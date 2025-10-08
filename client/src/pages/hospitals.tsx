// Hospitals.tsx
import Layout from "@/components/layout/Layout";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { MapPin, Phone, Mail, Navigation, Building2, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Hospital {
  id: number;
  name: string;
  address: string;
  city?: string;
  state?: string;
  phoneNumber: string;
  email?: string;
  rating?: number;
  latitude?: string;
  longitude?: string;
  distance?: number;
  emergencyServices?: boolean;
}

export default function Hospitals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterMode, setFilterMode] = useState<"all" | "city" | "nearby">("all");
  const [userCity, setUserCity] = useState<string>("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const fetchHospitals = async () => {
    const data = await apiRequest("GET", "/api/hospitals");
    return data ?? [];
  };

  const allHospitalsQuery = useQuery(["hospitals"], fetchHospitals, {
    onSuccess: (data: Hospital[]) => {
      setHospitals(data);
    },
    retry: 1,
  });

  useEffect(() => {
    if (user?.city) {
      setUserCity(user.city);
    }
  }, [user]);

  const searchHospitalsByCity = async (city: string) => {
    try {
      setFilterMode("city");
      const data = await apiRequest("POST", "/api/hospitals/search", { city });
      setHospitals(data.hospitals ?? []);
    } catch {
      toast({ title: "Error", description: "Failed to fetch hospitals for your city.", variant: "destructive" });
    }
  };

  const searchHospitalsNearby = (latitude: number, longitude: number) => {
    setFilterMode("nearby");
    apiRequest("POST", "/api/hospitals/search", { latitude, longitude, maxDistance: 50 })
      .then((data) => {
        setHospitals(data.hospitals ?? []);
      })
      .catch(() => {
        toast({ title: "Error", description: "Failed to fetch nearby hospitals.", variant: "destructive" });
      })
      .finally(() => setIsGettingLocation(false));
  };

  const handleShowAll = () => {
    setHospitals(allHospitalsQuery.data ?? []);
    setFilterMode("all");
  };

  const handleCityFilter = () => {
    if (!userCity) {
      toast({ title: "No City Set", description: "Please set your city in your profile to filter by city.", variant: "destructive" });
      return;
    }
    searchHospitalsByCity(userCity);
  };

  const handleLocationSearch = () => {
    if (!("geolocation" in navigator)) {
      toast({ title: "Not Supported", description: "Your browser does not support geolocation.", variant: "destructive" });
      return;
    }
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        searchHospitalsNearby(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        toast({ title: "Location Error", description: "Please enable location services.", variant: "destructive" });
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const openDirections = (hospital: Hospital) => {
    if (!hospital.latitude || !hospital.longitude) {
      toast({ title: "Location Not Available", description: "Hospital location not available.", variant: "destructive" });
      return;
    }
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const origin = `${coords.latitude},${coords.longitude}`;
          const destination = `${hospital.latitude},${hospital.longitude}`;
          window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`, "_blank");
        },
        () => {
          toast({ title: "Location Error", description: "Could not get your location; showing hospital location only.", variant: "destructive" });
          const destination = `${hospital.latitude},${hospital.longitude}`;
          window.open(`https://www.google.com/maps/search/?api=1&query=${destination}`, "_blank");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      toast({ title: "Not Supported", description: "Your browser does not support geolocation. Showing hospital location only.", variant: "destructive" });
      const destination = `${hospital.latitude},${hospital.longitude}`;
      window.open(`https://www.google.com/maps/search/?api=1&query=${destination}`, "_blank");
    }
  };

  const filteredHospitals = hospitals.filter((hospital) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      hospital.name.toLowerCase().includes(searchLower) ||
      hospital.address.toLowerCase().includes(searchLower) ||
      (hospital.city?.toLowerCase().includes(searchLower) ?? false)
    );
  });

  const renderStars = (rating?: number) => {
    if (!rating) return null;
    const stars = [];
    const fullStars = Math.floor(rating);
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
    }
    for (let i = fullStars; i < 5; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />);
    }
    return <div className="flex items-center gap-1">{stars}</div>;
  };

  return (
    <Layout title="Hospitals">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Find Hospitals</CardTitle>
                <CardDescription>
                  {userCity
                    ? `Showing hospitals ${filterMode === "city" ? `in ${userCity}` : filterMode === "nearby" ? "near you" : "all"}`
                    : "Showing all hospitals"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Input
              className="max-w-md"
              placeholder="Search hospitals by name, address, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-hospitals"
            />
            <div className="flex gap-2 mt-3">
              <Button
                variant={filterMode === "all" ? "default" : "outline"}
                onClick={handleShowAll}
                data-testid="button-show-all"
              >
                Show All
              </Button>
              <Button
                variant={filterMode === "city" ? "default" : "outline"}
                disabled={!userCity}
                onClick={handleCityFilter}
                data-testid="button-filter-city"
              >
                <Building2 className="h-4 w-4 mr-2" />
                My City {userCity && `(${userCity})`}
              </Button>
              <Button
                variant={filterMode === "nearby" ? "default" : "outline"}
                onClick={handleLocationSearch}
                disabled={isGettingLocation}
                data-testid="button-filter-nearby"
              >
                <MapPin className="h-4 w-4 mr-2" />
                {isGettingLocation ? "Getting Location..." : "Nearby"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(allHospitalsQuery.isLoading || isGettingLocation) &&
            Array.from({ length: 6 }).map((_, idx) => (
              <Skeleton key={idx} className="h-80 w-full" />
            ))}

          {!allHospitalsQuery.isLoading && filteredHospitals.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Building2 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">No hospitals found</p>
              <p className="text-gray-400 text-sm mt-2">
                {searchTerm ? `No results for "${searchTerm}"` : "Try different search terms or location filters"}
              </p>
            </div>
          )}

          {!allHospitalsQuery.isLoading &&
            filteredHospitals.map((hospital) => (
              <Card key={hospital.id} className="hover:shadow-lg transition-shadow" data-testid={`card-hospital-${hospital.id}`}>
                <CardHeader className="pb-3 flex items-start gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg line-clamp-1">{hospital.name}</CardTitle>
                    {hospital.rating && (
                      <div className="flex items-center gap-2 mt-1">
                        {renderStars(hospital.rating)}
                        <span className="text-sm text-gray-500">{hospital.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 line-clamp-2">
                        {hospital.address}
                        {hospital.city && hospital.state && `, ${hospital.city}, ${hospital.state}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600">{hospital.phoneNumber}</span>
                    </div>
                    {hospital.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-600 truncate">{hospital.email}</span>
                      </div>
                    )}
                    {hospital.distance !== undefined && (
                      <Badge variant="secondary" className="mt-2">
                        {hospital.distance.toFixed(1)} km away
                      </Badge>
                    )}
                  </div>

                  {hospital.emergencyServices && (
                    <Badge variant="destructive" className="text-xs">
                      Emergency Services Available
                    </Badge>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDirections(hospital)}
                      data-testid={`button-directions-${hospital.id}`}
                    >
                      <Navigation className="h-3 w-3 mr-1" />
                      Directions
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => navigate(`/appointments?hospitalId=${hospital.id}`)}
                      data-testid={`button-book-${hospital.id}`}
                    >
                      Book Visit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </Layout>
  );

  function renderStars(rating?: number) {
    if (!rating) return null;
    const stars = [];
    const fullStars = Math.floor(rating);
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
    }
    for (let i = fullStars; i < 5; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />);
    }
    return <div className="flex items-center gap-1">{stars}</div>;
  }
}
