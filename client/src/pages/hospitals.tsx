import Layout from "@/components/layout/Layout";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

interface Hospital {
  id: number;
  name: string;
  address: string;
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

// Helper: fuzzy address check
function addressMatch(dbAddress: string, tags: any) {
  if (!tags) return false;
  const a = dbAddress.toLowerCase();
  return (
    (tags["addr:street"] && a.includes(tags["addr:street"].toLowerCase())) ||
    (tags["addr:full"] && a.includes(tags["addr:full"].toLowerCase())) ||
    (tags["addr:housenumber"] && a.includes(tags["addr:housenumber"].toLowerCase()))
  );
}

export default function Hospitals() {
  const [registeredHospitals, setRegisteredHospitals] = useState<Hospital[]>([]);
  const [osmHospitals, setOsmHospitals] = useState<OSMHospital[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationInfo, setLocationInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();

  // Registered hospitals from backend
  useEffect(() => {
    setLoading(true);
    fetch("/api/hospitals")
      .then((r) => r.json())
      .then((data) => {
        setRegisteredHospitals(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch registered hospitals");
        setLoading(false);
      });
  }, []);

  // Get user geolocation
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => setError("Geolocation error: " + err.message)
    );
  }, []);

  // Reverse geocode location to get city
  useEffect(() => {
    if (!location) return;
    fetch(`/api/location/reverse?lat=${location.lat}&lon=${location.lng}`)
      .then((r) => r.json())
      .then((data) => setLocationInfo(data))
      .catch(() => setError("Failed to fetch location info"));
  }, [location]);

  // OSM hospitals nearby
  useEffect(() => {
    if (!location) return;
    setLoading(true);
    fetch(`/api/location/hospitals?lat=${location.lat}&lon=${location.lng}&radius=5000`)
      .then((r) => r.json())
      .then((data) => {
        setOsmHospitals(data.elements || []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch nearby hospitals");
        setLoading(false);
      });
  }, [location]);

  const isRegistered = (osmHospital: OSMHospital) => {
    if (!osmHospital.tags?.name) return false;
    const osmName = osmHospital.tags.name.toLowerCase().trim();
    return registeredHospitals.some(
      (hosp) =>
        hosp.name.toLowerCase().trim() === osmName ||
        addressMatch(hosp.address, osmHospital.tags)
    );
  };

  if (loading) return <Layout title="Hospitals">Loading hospitals...</Layout>;
  if (error) return <Layout title="Hospitals">Error: {error}</Layout>;

  return (
    <Layout title="Hospitals">
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold mb-4">
          Hospitals near you {locationInfo?.address?.city ? `in ${locationInfo.address.city}` : ""}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {osmHospitals.length === 0 && (
            <div className="text-center text-gray-500 py-8 w-full col-span-3">
              No hospitals found near your location.<br />
              Try enabling location or refreshing the page.
            </div>
          )}
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
                        (h) =>
                          h.name.toLowerCase().trim() === hospital.tags?.name?.toLowerCase().trim()
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
