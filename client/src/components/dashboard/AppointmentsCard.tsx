import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface AppointmentTypes {
  id: number;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  location: string;
  isVirtual: boolean;
}

export default function AppointmentsCard() {
  const [_, navigate] = useLocation();
  const { data, isLoading, error } = useQuery({ 
    queryKey: ["/api/appointments"] 
  });
  
  const [appointments, setAppointments] = useState<AppointmentTypes[]>([]);

  useEffect(() => {
    if (data) {
      // Map the data from the API to the format we need
      const formattedAppointments = data.map((appointment: any) => {
        // Get doctor data to show name and specialty
        // In a real app, we would join this with doctor data
        return {
          id: appointment.id,
          doctorName: appointment.doctorName || "Dr. Michael Chen",
          specialty: appointment.specialty || "Cardiologist",
          date: new Date(appointment.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          time: appointment.time,
          location: appointment.isVirtual ? "Virtual Consultation" : appointment.location || "City Medical Center",
          isVirtual: appointment.isVirtual
        };
      });
      
      setAppointments(formattedAppointments);
    }
  }, [data]);

  const handleBookNewAppointment = () => {
    navigate("/appointments");
  };

  // Show demo data if no appointments are available
  useEffect(() => {
    if (!isLoading && (!data || data.length === 0)) {
      setAppointments([
        {
          id: 1,
          doctorName: "Dr. Michael Chen",
          specialty: "Cardiologist",
          date: "May 24, 2023",
          time: "10:30 AM",
          location: "City Medical Center",
          isVirtual: false
        },
        {
          id: 2,
          doctorName: "Dr. Sarah Williams",
          specialty: "Dermatologist",
          date: "June 3, 2023",
          time: "2:15 PM",
          location: "Virtual Consultation",
          isVirtual: true
        }
      ]);
    }
  }, [isLoading, data]);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Upcoming Appointments</h2>
          <a href="/appointments" className="text-sm font-medium text-primary-600 hover:text-primary-500">View all</a>
        </div>
        <div className="space-y-4">
          {isLoading ? (
            <>
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </>
          ) : (
            appointments.map((appointment) => (
              <div key={appointment.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{appointment.doctorName}</p>
                    <p className="text-sm text-gray-500">{appointment.specialty}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{appointment.date}</p>
                    <p className="text-sm text-gray-500">{appointment.time}</p>
                  </div>
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <div className="flex items-center text-sm text-gray-500">
                    <i className={`${appointment.isVirtual ? 'ri-computer-line' : 'ri-map-pin-line'} mr-1`}></i>
                    <span>{appointment.location}</span>
                  </div>
                  <div>
                    <button className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                      {appointment.isVirtual ? 'Join Call' : 'Reschedule'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-6">
          <Button 
            className="w-full"
            onClick={handleBookNewAppointment}
          >
            Book New Appointment
          </Button>
        </div>
      </div>
    </div>
  );
}
