import Layout from "@/components/layout/Layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MedicalRecord } from "@shared/schema";

// Form schema for uploading a medical record
const recordSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  doctorName: z.string().optional(),
  hospital: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  fileUrl: z.string().optional()
});

type RecordFormValues = z.infer<typeof recordSchema>;

export default function MedicalRecords() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [recordTypes, setRecordTypes] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Get medical records
  const { data, isLoading } = useQuery({ 
    queryKey: ["/api/medical-records"]
  });

  // Upload medical record mutation
  const uploadRecordMutation = useMutation({
    mutationFn: async (record: RecordFormValues) => {
      const res = await apiRequest("POST", "/api/medical-records", record);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medical-records"] });
      toast({
        title: "Record uploaded",
        description: "Your medical record has been uploaded successfully.",
      });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to upload record",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Set up the form
  const form = useForm<RecordFormValues>({
    resolver: zodResolver(recordSchema),
    defaultValues: {
      title: "",
      description: "",
      doctorName: "",
      hospital: "",
      date: new Date().toISOString().split('T')[0],
      fileUrl: ""
    }
  });

  const onSubmit = (data: RecordFormValues) => {
    uploadRecordMutation.mutate(data);
  };

  useEffect(() => {
    if (data) {
      setRecords(data);
      
      // Extract unique types from record titles (e.g., "Blood Test", "X-Ray", etc.)
      const types = data.map((record: MedicalRecord) => {
        const matches = record.title.match(/^(.*?)(?:\s+Results|\s+Report|\s+Scan|\:.*)?$/i);
        return matches ? matches[1] : record.title;
      });
      
      setRecordTypes([...new Set(types)]);
    }
  }, [data]);

  const filteredRecords = selectedType 
    ? records.filter(record => record.title.startsWith(selectedType))
    : records;

  // Group records by year
  const groupedRecords: Record<string, MedicalRecord[]> = {};
  
  filteredRecords.forEach(record => {
    const year = new Date(record.date).getFullYear().toString();
    if (!groupedRecords[year]) {
      groupedRecords[year] = [];
    }
    groupedRecords[year].push(record);
  });

  // Sort years in descending order
  const sortedYears = Object.keys(groupedRecords).sort((a, b) => parseInt(b) - parseInt(a));

  return (
    <Layout title="Medical Records">
      <div className="flex justify-end mb-6">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>Upload Medical Record</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Upload Medical Record</DialogTitle>
              <DialogDescription>
                Upload your medical documents for safekeeping and easy access.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Blood Test Results" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="doctorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Doctor (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Dr. Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="hospital"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hospital/Clinic (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., City Medical Center" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Add notes or details about this record" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fileUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>File Upload</FormLabel>
                      <FormControl>
                        <Input 
                          type="file" 
                          className="cursor-pointer" 
                          accept=".pdf,.jpg,.jpeg,.png" 
                          onChange={(e) => {
                            // In a real app, this would upload the file to a server
                            // and set the returned URL to the field value
                            if (e.target.files?.length) {
                              field.onChange(`file_${Date.now()}`);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={uploadRecordMutation.isPending}
                >
                  {uploadRecordMutation.isPending ? "Uploading..." : "Upload Record"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Medical Records</CardTitle>
        </CardHeader>
        <CardContent>
          {recordTypes.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              <Button 
                variant={selectedType === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType(null)}
              >
                All Records
              </Button>
              {recordTypes.map(type => (
                <Button 
                  key={type}
                  variant={selectedType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(type)}
                >
                  {type}
                </Button>
              ))}
            </div>
          )}

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : filteredRecords.length > 0 ? (
            <div className="space-y-8">
              {sortedYears.map(year => (
                <div key={year}>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{year}</h3>
                  <div className="space-y-3">
                    {groupedRecords[year].map(record => (
                      <div key={record.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <i className="ri-file-list-3-line text-xl text-gray-400"></i>
                          </div>
                          <div className="ml-3 flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-medium text-gray-900">{record.title}</h3>
                              <div className="flex items-center space-x-2">
                                <button className="text-gray-500 hover:text-gray-700">
                                  <i className="ri-eye-line"></i>
                                </button>
                                <button className="text-gray-500 hover:text-gray-700">
                                  <i className="ri-download-line"></i>
                                </button>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(record.date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                            {(record.doctorName || record.hospital) && (
                              <div className="mt-2 flex flex-wrap gap-x-4 text-xs text-gray-500">
                                {record.doctorName && (
                                  <span className="flex items-center">
                                    <i className="ri-user-heart-line mr-1"></i>
                                    {record.doctorName}
                                  </span>
                                )}
                                {record.hospital && (
                                  <span className="flex items-center">
                                    <i className="ri-hospital-line mr-1"></i>
                                    {record.hospital}
                                  </span>
                                )}
                              </div>
                            )}
                            {record.description && (
                              <p className="mt-2 text-sm text-gray-600">{record.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <i className="ri-file-list-3-line text-5xl text-gray-300"></i>
              <p className="mt-4 text-gray-500">
                {selectedType 
                  ? `No ${selectedType} records found` 
                  : "You don't have any medical records yet"}
              </p>
              <Button onClick={() => setDialogOpen(true)} className="mt-4">Upload Your First Record</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}
