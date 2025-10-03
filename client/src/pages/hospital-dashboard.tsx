import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import HospitalLayout from "@/components/layout/HospitalLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Stethoscope, Building2, Calendar } from "lucide-react";

export default function HospitalDashboard() {
  const { user } = useAuth();

  // Fetch current hospital details
  const { data: hospital, isLoading: hospitalLoading } = useQuery<any>({
    queryKey: ["/api/hospitals/me"],
  });

  // Fetch doctors for this hospital
  const { data: doctors, isLoading: doctorsLoading } = useQuery<any[]>({
    queryKey: ["/api/hospitals", hospital?.id, "doctors"],
    enabled: !!hospital?.id,
  });

  // Fetch home visit requests for this hospital
  const { data: homeVisits, isLoading: homeVisitsLoading } = useQuery<any[]>({
    queryKey: ["/api/home-visits"],
    enabled: !!hospital?.id,
  });

  const stats = [
    {
      title: "Total Doctors",
      value: doctors?.length || 0,
      icon: Users,
      color: "bg-blue-500",
      loading: doctorsLoading,
    },
    {
      title: "Available Doctors",
      value: doctors?.filter((d) => d.availabilityStatus === "available").length || 0,
      icon: Stethoscope,
      color: "bg-green-500",
      loading: doctorsLoading,
    },
    {
      title: "Home Visit Requests",
      value: homeVisits?.filter((hv) => hv.status === "pending").length || 0,
      icon: Calendar,
      color: "bg-orange-500",
      loading: homeVisitsLoading,
    },
    {
      title: "Departments",
      value: hospital?.departments?.length || 0,
      icon: Building2,
      color: "bg-purple-500",
      loading: hospitalLoading,
    },
  ];

  if (hospitalLoading) {
    return (
      <HospitalLayout title="Dashboard">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </HospitalLayout>
    );
  }

  if (!hospital) {
    return (
      <HospitalLayout title="Dashboard">
        <Card>
          <CardHeader>
            <CardTitle>Hospital Not Found</CardTitle>
            <CardDescription>
              Your hospital profile hasn't been set up yet. Please contact support.
            </CardDescription>
          </CardHeader>
        </Card>
      </HospitalLayout>
    );
  }

  return (
    <HospitalLayout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{hospital.name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {hospital.address}, {hospital.city}, {hospital.state}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      {stat.loading ? (
                        <Skeleton className="h-8 w-16 mt-2" />
                      ) : (
                        <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                      )}
                    </div>
                    <div className={`p-3 rounded-full ${stat.color}`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = "/hospital-doctors"}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Manage Doctors
              </CardTitle>
              <CardDescription>
                Add, edit, and manage your hospital's doctors and their availability
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = "/hospital-home-visits"}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-600" />
                Home Visit Requests
              </CardTitle>
              <CardDescription>
                View and assign doctors to patient home visit requests
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.location.href = "/hospital-departments"}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                Departments
              </CardTitle>
              <CardDescription>
                Add and manage your hospital's departments and services
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Overview of recent hospital activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {homeVisits && homeVisits.length > 0 ? (
                homeVisits.slice(0, 5).map((visit) => (
                  <div key={visit.id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Home Visit Request</p>
                      <p className="text-xs text-gray-500">{visit.address}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      visit.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                      visit.status === "assigned" ? "bg-blue-100 text-blue-800" :
                      "bg-green-100 text-green-800"
                    }`}>
                      {visit.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </HospitalLayout>
  );
}
