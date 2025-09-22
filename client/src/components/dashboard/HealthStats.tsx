import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

type HealthStat = {
  label: string;
  value: string | number;
  unit: string;
  icon: string;
  bgColor: string;
  iconColor: string;
};

export default function HealthStats() {
  const { data: healthData, isLoading, error } = useQuery({
    queryKey: ["/api/health-data/latest"],
  });

  const [stats, setStats] = useState<HealthStat[]>([
    {
      label: "Heart Rate",
      value: "—",
      unit: "BPM",
      icon: "ri-heart-pulse-line",
      bgColor: "bg-red-100",
      iconColor: "text-red-600",
    },
    {
      label: "Blood Pressure",
      value: "—",
      unit: "mmHg",
      icon: "ri-pulse-line",
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      label: "Blood Glucose",
      value: "—",
      unit: "mg/dL",
      icon: "ri-test-tube-line",
      bgColor: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
    {
      label: "Body Temperature",
      value: "—",
      unit: "°F",
      icon: "ri-thermometer-line",
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ]);

  useEffect(() => {
    if (!healthData) return;

    const updatedStats = [...stats];
    
    if (healthData.heartRate) {
      updatedStats[0].value = healthData.heartRate;
    }
    
    if (healthData.bloodPressureSystolic && healthData.bloodPressureDiastolic) {
      updatedStats[1].value = `${healthData.bloodPressureSystolic}/${healthData.bloodPressureDiastolic}`;
    }
    
    if (healthData.bloodGlucose) {
      updatedStats[2].value = healthData.bloodGlucose;
    }
    
    if (healthData.temperature) {
      // Convert from stored int to decimal for display
      updatedStats[3].value = (healthData.temperature / 10).toFixed(1);
    }
    
    setStats(updatedStats);
  }, [healthData]);

  // Mock data for demo if no data is present
  useEffect(() => {
    if (!isLoading && !healthData) {
      const mockStats = [...stats];
      mockStats[0].value = 76;
      mockStats[1].value = "120/80";
      mockStats[2].value = 98;
      mockStats[3].value = 98.6;
      setStats(mockStats);
    }
  }, [isLoading, healthData]);

  return (
    <section>
      <h2 className="text-lg font-medium text-gray-900 mb-4">Your Health Stats</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className={`flex-shrink-0 ${stat.bgColor} rounded-md p-3`}>
                  <i className={`${stat.icon} ${stat.iconColor} text-xl`}></i>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.label}</dt>
                    <dd>
                      <div className="flex items-baseline">
                        {isLoading ? (
                          <Skeleton className="h-8 w-16" />
                        ) : (
                          <>
                            <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
                            <div className="ml-2 text-sm text-gray-500">{stat.unit}</div>
                          </>
                        )}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-4 sm:px-6">
              <div className="text-sm">
                <a href="#" className="font-medium text-primary-600 hover:text-primary-500">View history</a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
