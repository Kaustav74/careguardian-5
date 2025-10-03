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
    if (data && data.length > 0) {
      const formattedAppointments = data.map((appointment: any) => {
        return {
          id: appointment.id,
          doctorName: appointment.doctorName || "Unknown Doctor",
          specialty: appointment.doctorSpecialty || "General",
          date: new Date(appointment.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          time: appointment.time,
          location: appointment.isVirtual ? "Virtual Consultation" : appointment.hospitalName || "Hospital",
          isVirtual: appointment.isVirtual
        };
      });
      
      setAppointments(formattedAppointments);
    } else if (!isLoading) {
      setAppointments([]);
    }
  }, [data, isLoading]);

  const handleBookNewAppointment = () => {
    navigate("/appointments");
  };

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
          ) : appointments.length === 0 ? (
            <div className="text-center py-8" data-testid="empty-appointments">
              <i className="ri-calendar-line text-4xl text-gray-400 mb-2"></i>
              <p className="text-gray-500 text-sm">No appointments booked</p>
              <p className="text-gray-400 text-xs mt-1">Book your first appointment to see it here</p>
            </div>
          ) : (
            appointments.map((appointment) => (
              <div key={appointment.id} className="bg-gray-50 p-4 rounded-lg" data-testid={`appointment-${appointment.id}`}>
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium text-gray-900" data-testid="appointment-doctor-name">{appointment.doctorName}</p>
                    <p className="text-sm text-gray-500" data-testid="appointment-specialty">{appointment.specialty}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900" data-testid="appointment-date">{appointment.date}</p>
                    <p className="text-sm text-gray-500" data-testid="appointment-time">{appointment.time}</p>
                  </div>
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <div className="flex items-center text-sm text-gray-500">
                    <i className={`${appointment.isVirtual ? 'ri-computer-line' : 'ri-map-pin-line'} mr-1`}></i>
                    <span data-testid="appointment-location">{appointment.location}</span>
                  </div>
                  <div>
                    <button 
                      className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      data-testid={`button-${appointment.isVirtual ? 'join-call' : 'reschedule'}`}
                    >
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
            data-testid="button-book-appointment"
          >
            Book New Appointment
          </Button>
        </div>
      </div>
    </div>
  );
}
