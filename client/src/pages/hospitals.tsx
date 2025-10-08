import Layout from "@/components/layout/Layout";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

interface Hospital {
  id: number;
  name: string;
  address: string;
  city?: string;
  phone_number?: string;
  email?: string;
}

export default function Hospitals() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    fetch("/api/hospitals")
      .then((r) => r.json())
      .then((data) => {
        setHospitals(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch hospitals");
        setLoading(false);
      });
  }, []);

  if (loading) return <Layout title="Hospitals">Loading hospitals...</Layout>;
  if (error) return <Layout title="Hospitals">Error: {error}</Layout>;

  return (
    <Layout title="Hospitals">
      <h1 className="text-2xl font-semibold mb-4">Hospitals</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hospitals.length === 0 &&
          <div className="text-center text-gray-500 py-8 w-full col-span-3">
            No hospitals found in the system.
          </div>
        }
        {hospitals.map((hospital) => (
          <div key={hospital.id} className="border rounded-lg p-4 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold">{hospital.name}</h2>
              <p className="text-gray-600">{hospital.address}</p>
              {hospital.city && <p className="text-gray-500">{hospital.city}</p>}
              {hospital.phone_number && <p className="text-gray-500">{hospital.phone_number}</p>}
              {hospital.email && <p className="text-gray-500">{hospital.email}</p>}
            </div>
            <div className="mt-4 flex items-center justify-end">
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate(`/appointments?hospitalId=${hospital.id}`)}
              >
                Book Visit
              </button>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
