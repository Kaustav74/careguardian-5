import Layout from "@/components/layout/Layout";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

interface Hospital {
  id: number;
  name: string;
  address: string;
  city?: string;
}

export default function DebugHospitals() {
  const [hospitals, setHospitals] = useState<Hospital[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchHospitals() {
      setLoading(true);
      try {
        console.log("Starting fetch /api/hospitals");
        const data = await apiRequest("GET", "/api/hospitals");
        console.log("Raw /api/hospitals response:", data);
        if (Array.isArray(data)) {
          setHospitals(data);
        } else if (data?.hospitals) {
          setHospitals(data.hospitals);
        } else {
          setHospitals([]);
        }
      } catch (e: any) {
        console.error("API fetch error:", e);
        setError(e.message || "Unknown fetch error");
      } finally {
        setLoading(false);
      }
    }

    fetchHospitals();
  }, []);

  if (loading) return <Layout title="Hospitals Debug">Loading hospitals...</Layout>;
  if (error) return <Layout title="Hospitals Debug">Error: {error}</Layout>;

  return (
    <Layout title="Hospitals Debug">
      <h1>Hospital List (Debug)</h1>
      {!hospitals || hospitals.length === 0 ? (
        <p>No hospitals found.</p>
      ) : (
        <ul>
          {hospitals.map((h) => (
            <li key={h.id}>
              {h.name} - {h.address} {h.city ? `(${h.city})` : ""}
            </li>
          ))}
        </ul>
      )}
    </Layout>
  );
}
