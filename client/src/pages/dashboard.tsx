import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/layout/Layout";
import DailyRoutineCard from "@/components/dashboard/DailyRoutineCard";
import AppointmentsCard from "@/components/dashboard/AppointmentsCard";
import MedicalRecordsCard from "@/components/dashboard/MedicalRecordsCard";
import ChatbotCard from "@/components/dashboard/ChatbotCard";
import HospitalsSection from "@/components/dashboard/HospitalsSection";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <Layout title="Dashboard">
      <div className="my-4">
        <h1 className="text-2xl font-bold">Welcome to CareGuardian</h1>
        <p className="text-muted-foreground">Your personal healthcare assistant for complete well-being</p>
      </div>

      {/* Main dashboard sections */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DailyRoutineCard />
        <AppointmentsCard />
        <MedicalRecordsCard />
      </div>

      {/* Chatbot Section */}
      <div className="mt-6 mb-8">
        <ChatbotCard />
      </div>

      {/* Hospitals Section */}
      <HospitalsSection />
    </Layout>
  );
}
