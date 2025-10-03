import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import AuthPage from "@/pages/auth-page";
import Appointments from "@/pages/appointments";
import Hospitals from "@/pages/hospitals";
import Doctors from "@/pages/doctors";
import MedicalRecords from "@/pages/medical-records";
import FirstAid from "@/pages/first-aid";
import Settings from "@/pages/settings";
import BringDoctor from "@/pages/bring-doctor";
import Subscription from "@/pages/subscription";
import DietRoutine from "@/pages/diet-routine";
import MedicationTracker from "@/pages/medication-tracker";
import HomeVisits from "@/pages/home-visits";
import AmbulanceLocator from "@/pages/ambulance-locator";
import AmbulanceDashboard from "@/pages/ambulance-dashboard";
import HospitalDashboard from "@/pages/hospital-dashboard";
import HospitalDoctors from "@/pages/hospital-doctors";
import HospitalHomeVisits from "@/pages/hospital-home-visits";
import HospitalDepartments from "@/pages/hospital-departments";
import HospitalSettings from "@/pages/hospital-settings";
import SymptomChecker from "@/pages/symptom-checker";
import FitnessTracker from "@/pages/fitness-tracker";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/appointments" component={Appointments} />
      <ProtectedRoute path="/hospitals" component={Hospitals} />
      <ProtectedRoute path="/doctors" component={Doctors} />
      <ProtectedRoute path="/medical-records" component={MedicalRecords} />
      <ProtectedRoute path="/first-aid" component={FirstAid} />
      <ProtectedRoute path="/bring-doctor" component={BringDoctor} />
      <ProtectedRoute path="/home-visits" component={HomeVisits} />
      <ProtectedRoute path="/ambulance-locator" component={AmbulanceLocator} />
      <ProtectedRoute path="/ambulance-dashboard" component={AmbulanceDashboard} />
      <ProtectedRoute path="/hospital-dashboard" component={HospitalDashboard} />
      <ProtectedRoute path="/hospital-doctors" component={HospitalDoctors} />
      <ProtectedRoute path="/hospital-home-visits" component={HospitalHomeVisits} />
      <ProtectedRoute path="/hospital-departments" component={HospitalDepartments} />
      <ProtectedRoute path="/hospital-settings" component={HospitalSettings} />
      <ProtectedRoute path="/subscription" component={Subscription} />
      <ProtectedRoute path="/diet-routine" component={DietRoutine} />
      <ProtectedRoute path="/medication-tracker" component={MedicationTracker} />
      <ProtectedRoute path="/symptom-checker" component={SymptomChecker} />
      <ProtectedRoute path="/fitness-tracker" component={FitnessTracker} />
      <ProtectedRoute path="/settings" component={Settings} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
