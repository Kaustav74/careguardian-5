import Layout from "@/components/layout/Layout";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

interface Hospital {
  id: number;
  name: string;
  address: string;
  city?: string;
}

interface GoogleHospital {
  place_id: string;
  name: string;
  vicinity: string;
  geometry: {
    location: { lat: number; lng: number; }
  };
}

const GOOGLE_API_KEY = "AIzaSyBflJDb_GtqFPapS7jftH3zWAUQX3N_w3U";

export default function Hospitals() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [googleHospitals, setGoogleHospitals] = useState<GoogleHospital[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  // Fetch your registered hospitals from the backend API
  useEffect(() => {
    setLoadingHospitals(true);
    apiRequest("GET", "/api/hospitals")
      .then(data => {
        if (Array.isArray(data)) setHospitals(data);
        else if (data?.hospitals) setHospitals(data.hospitals);
        else setHospitals([]);
      })
      .catch(e => setError(e.message || "Unknown error fetching hospitals"))
      .finally(() => setLoadingHospitals(false));
  }, []);

  // Get user's geolocation
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        err => setError("Geolocation error: " + err.message),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setError("Geolocation is not supported by your browser");
    }
  }, []);

  // Fetch hospitals from Google Maps Places API
  useEffect(() => {
    if (!location) return;
    setLoadingGoogle(true);
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=5000&type=hospital&key=${GOOGLE_API_KEY}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setGoogleHospitals(data.results || []);
        setLoadingGoogle(false);
      })
      .catch(e => {
        setError("Google Maps API error: " + e.message);
        setLoadingGoogle(false);
      });
  }, [location]);

  // Check if a Google hospital is registered in your DB
  const isRegistered = (gh: GoogleHospital) => {
    return hospitals.some(h =>
      h.name.trim().toLowerCase() === gh.name.trim().toLowerCase() ||
      (h.address && gh.vicinity && h.address.toLowerCase().includes(gh.vicinity.toLowerCase()))
    );
  };

  if (loadingHospitals || loadingGoogle) return <Layout title="Hospitals">Loading hospitals...</Layout>;
  if (error) return <Layout title="Hospitals">Error: {error}</Layout>;

  return (
    <Layout title="Hospitals">
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold mb-4">Hospitals Near You</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {googleHospitals.map(hospital => (
            <div key={hospital.place_id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-semibold">{hospital.name}</h2>
                <p className="text-gray-600">{hospital.vicinity}</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                {isRegistered(hospital) ? (
                  <span className="text-green-600 font-bold flex items-center gap-1">
                    ✓ Registered
                  </span>
                ) : (
                  <span className="text-gray-500 italic">
                    Not Registered
                  </span>
                )}
                {/* Placeholders for your existing buttons: Directions, Book Visit */}
                <div className="flex gap-2">
                  <button 
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      const address = encodeURIComponent(hospital.vicinity);
                      window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, "_blank");
                    }}
                  >
                    Directions
                  </button>
                  {/* Your existing navigation can be used for Book Visit if hospital is registered */}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
