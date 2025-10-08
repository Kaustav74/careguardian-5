import Layout from "@/components/layout/Layout";
import { useState, useEffect } from "react";
import { useLocation } from "wouter"; // use useLocation, not useNavigate
import { apiRequest } from "@/lib/queryClient";

interface Hospital {
  id: number;
  name: string;
  address?: string;
  city?: string;
}

interface OSMHospital {
  id: number;
  lat: number;
  lon: number;
  tags?: {
    name?: string;
    [key: string]: any;
  };
}

export default function Hospitals() {
  const [registeredHospitals, setRegisteredHospitals] = useState<Hospital[]>([]);
  const [osmHospitals, setOsmHospitals] = useState<OSMHospital[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationInfo, setLocationInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [, navigate] = useLocation(); // Correct hook usage

  // ... all your useEffects as before ...

  // isRegistered remains same

  if (loading) return <Layout title="Hospitals">Loading hospitals...</Layout>;
  if (error) return <Layout title="Hospitals">Error: {error}</Layout>;

  return (
    <Layout title="Hospitals">
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold mb-4">
          Hospitals near you {locationInfo?.address?.city ? `in ${locationInfo.address.city}` : ""}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {osmHospitals.map((hospital) => (
            <div
              key={hospital.id}
              className="border rounded-lg p-4 hover:shadow-lg transition-shadow flex flex-col justify-between"
            >
              <div>
                <h2 className="text-lg font-semibold">{hospital.tags?.name || "Unknown Hospital"}</h2>
                <p className="text-gray-600">{hospital.tags?.address || hospital.tags?.["addr:street"] || ""}</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                {isRegistered(hospital) ? (
                  <span className="text-green-600 font-bold flex items-center gap-1">✓ Registered</span>
                ) : (
                  <span className="text-gray-500 italic">Not Registered</span>
                )}

                <div className="flex gap-2">
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      window.open(
                        `https://www.openstreetmap.org/directions?from=&to=${hospital.lat}%2C${hospital.lon}`,
                        "_blank"
                      );
                    }}
                  >
                    Directions
                  </button>

                  <button
                    className="btn btn-primary btn-sm"
                    disabled={!isRegistered(hospital)}
                    onClick={() => {
                      const regHosp = registeredHospitals.find(
                        (h) => h.name.toLowerCase() === hospital.tags?.name?.toLowerCase()
                      );
                      if (regHosp) {
                        navigate(`/appointments?hospitalId=${regHosp.id}`);
                      }
                    }}
                  >
                    Book Visit
                  </button>

                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
