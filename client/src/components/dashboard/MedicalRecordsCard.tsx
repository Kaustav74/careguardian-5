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
    if (data && data.length > 0) {
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
    } else if (!isLoading) {
      setRecords([]);
    }
  }, [data, isLoading]);

  const handleUploadDocument = () => {
    navigate("/medical-records");
  };

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
          ) : records.length === 0 ? (
            <div className="text-center py-8" data-testid="empty-medical-records">
              <i className="ri-file-list-3-line text-4xl text-gray-400 mb-2"></i>
              <p className="text-gray-500 text-sm">No medical records uploaded</p>
              <p className="text-gray-400 text-xs mt-1">Upload your first medical document to see it here</p>
            </div>
          ) : (
            records.map((record) => (
              <div key={record.id} className="border border-gray-200 rounded-lg p-4" data-testid={`medical-record-${record.id}`}>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <i className="ri-file-list-3-line text-xl text-gray-400"></i>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900" data-testid="record-title">{record.title}</h3>
                    <p className="text-xs text-gray-500" data-testid="record-date">{record.date}</p>
                  </div>
                  <div className="ml-auto">
                    <button 
                      className="inline-flex items-center p-1 border border-transparent rounded-full text-gray-500 hover:bg-gray-100 focus:outline-none"
                      data-testid="button-download-record"
                    >
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
            data-testid="button-upload-document"
          >
            Upload Medical Document
          </Button>
        </div>
      </div>
    </div>
  );
}
