import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface MedicalRecordType {
  id: number;
  title: string;
  date: string;
}

export default function MedicalRecordsCard() {
  const [_, navigate] = useLocation();
  const { data, isLoading, error } = useQuery({ 
    queryKey: ["/api/medical-records"] 
  });
  
  const [records, setRecords] = useState<MedicalRecordType[]>([]);

  useEffect(() => {
    if (data) {
      // Format the records for display
      const formattedRecords = data.map((record: any) => ({
        id: record.id,
        title: record.title,
        date: new Date(record.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }));
      
      setRecords(formattedRecords);
    }
  }, [data]);

  const handleUploadDocument = () => {
    navigate("/medical-records");
  };

  // Show demo data if no records are available
  useEffect(() => {
    if (!isLoading && (!data || data.length === 0)) {
      setRecords([
        {
          id: 1,
          title: "Blood Test Results",
          date: "May 15, 2023"
        },
        {
          id: 2,
          title: "Chest X-Ray Report",
          date: "April 28, 2023"
        },
        {
          id: 3,
          title: "Prescription: Dr. Chen",
          date: "April 10, 2023"
        }
      ]);
    }
  }, [isLoading, data]);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Medical Records</h2>
          <a href="/medical-records" className="text-sm font-medium text-primary-600 hover:text-primary-500">View all</a>
        </div>
        <div className="space-y-4">
          {isLoading ? (
            <>
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </>
          ) : (
            records.map((record) => (
              <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <i className="ri-file-list-3-line text-xl text-gray-400"></i>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">{record.title}</h3>
                    <p className="text-xs text-gray-500">{record.date}</p>
                  </div>
                  <div className="ml-auto">
                    <button className="inline-flex items-center p-1 border border-transparent rounded-full text-gray-500 hover:bg-gray-100 focus:outline-none">
                      <i className="ri-download-line"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-6">
          <Button 
            variant="outline"
            className="w-full"
            onClick={handleUploadDocument}
          >
            Upload Medical Document
          </Button>
        </div>
      </div>
    </div>
  );
}
