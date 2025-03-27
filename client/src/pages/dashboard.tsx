import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/layout/Layout";
import HealthStats from "@/components/dashboard/HealthStats";
import AppointmentsCard from "@/components/dashboard/AppointmentsCard";
import MedicalRecordsCard from "@/components/dashboard/MedicalRecordsCard";
import ChatbotCard from "@/components/dashboard/ChatbotCard";
import HospitalsSection from "@/components/dashboard/HospitalsSection";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <Layout title="Dashboard">
      {/* Health Stats Section */}
      <HealthStats />

      {/* Main dashboard sections */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <AppointmentsCard />
        <MedicalRecordsCard />
        <ChatbotCard />
      </div>

      {/* Hospitals Section */}
      <HospitalsSection />
    </Layout>
  );
}
