// Save as Hospitals.tsx
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
import { MapPin, Phone, Mail, Navigation, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Hospital {
  id: number;
  name: string;
  address: string;
  city?: string;
  state?: string;
  phoneNumber: string;
  email?: string;
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
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "city" | "nearby">("all");
  const [userCity, setUserCity] = useState<string>("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const fetchHospitals = async () => (await apiRequest("GET", "/api/hospitals")) ?? [];
  const { data, isLoading } = useQuery(["hospitals"], fetchHospitals, {
    onSuccess: (dt) => { setHospitals(dt); }
  });

  useEffect(() => {
    if (user?.city) setUserCity(user.city);
  }, [user]);

  const handleFilterCity = async () => {
    if (!userCity) {
      toast({ title: "No City", description: "Set your city in profile.", variant: "destructive" });
      return;
    }
    setFilterMode("city");
    const resp = await apiRequest("POST", "/api/hospitals/search", { city: userCity });
    setHospitals(resp?.hospitals ?? []);
  };

  const handleFilterNearby = () => {
    if (!("geolocation" in navigator)) {
      toast({ title: "No Geolocation", description: "Your browser doesn't support geolocation.", variant: "destructive" });
      return;
    }
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const resp = await apiRequest("POST", "/api/hospitals/search", { latitude, longitude, maxDistance: 50 });
        setHospitals(resp?.hospitals ?? []);
        setFilterMode("nearby");
        setIsGettingLocation(false);
      },
      () => {
        toast({ title: "Error", description: "Failed to get your location.", variant: "destructive" });
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleShowAll = () => {
    if (data) {
      setHospitals(data);
      setFilterMode("all");
    }
  };

  const openDirections = (hospital: Hospital) => {
    if (!hospital.latitude || !hospital.longitude) {
      toast({ title: "No Location", description: "Hospital location not available.", variant: "destructive" });
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
          const dest = `${hospital.latitude},${hospital.longitude}`;
          window.open(`https://www.google.com/maps/search/?api=1&query=${dest}`, "_blank");
        }
      );
    } else {
      const dest = `${hospital.latitude},${hospital.longitude}`;
      window.open(`https://www.google.com/maps/search/?api=1&query=${dest}`, "_blank");
    }
  };

  const filteredHospitals = hospitals.filter(h =>
    [h.name, h.address, h.city ?? ""].some(f => f.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
            <div className="mt-4 flex gap-2">
              <Button variant={filterMode === "all" ? "default" : "outline"} onClick={handleShowAll}>Show All</Button>
              <Button variant={filterMode === "city" ? "default" : "outline"} disabled={!userCity} onClick={handleFilterCity}>My City</Button>
              <Button variant={filterMode === "nearby" ? "default" : "outline"} disabled={isGettingLocation} onClick={handleFilterNearby}>Nearby</Button>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(isLoading || isGettingLocation) && Array(6).fill(null).map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
            {!isLoading && filteredHospitals.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg text-gray-500">No hospitals found</p>
                <p className="mt-2 text-sm text-gray-400">{searchTerm ? `No results for "${searchTerm}"` : "Try different filters"}</p>
              </div>
            )}
            {!isLoading && filteredHospitals.map(hospital => (
              <div key={hospital.id} className="border rounded-md p-4 hover:shadow-lg transition-shadow flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{hospital.name}</h2>
                  <p className="text-sm text-gray-600">{hospital.address}{hospital.city && `, ${hospital.city}`}</p>
                  <p className="text-sm text-gray-600">{hospital.phoneNumber}</p>
                </div>
                <div className="mt-4 flex justify-between items-center">
                  {hospital.emergencyServices && <Badge variant="destructive">Emergency</Badge>}
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => openDirections(hospital)}>Directions</Button>
                    <Button size="sm" onClick={() => navigate(`/appointments?hospitalId=${hospital.id}`)}>Book</Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
