import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format, parseISO, isToday, isBefore } from "date-fns";
import { Calendar, Clock, Pill, Plus, Edit, Trash2, Check, X, AlertTriangle, RefreshCw } from "lucide-react";
import Layout from "@/components/layout/Layout";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog, 
  DialogClose, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// Define type for a medication
interface Medication {
  id: number;
  userId: number;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate: string | null;
  instructions: string | null;
  timeOfDay: string;
  withFood: boolean;
  active: boolean;
  refillDate: string | null;
  createdAt: string;
}

// Define type for a medication log
interface MedicationLog {
  id: number;
  medicationId: number;
  userId: number;
  takenAt: string;
  skipped: boolean;
  notes: string | null;
}

// Form Schema for adding a new medication
const medicationFormSchema = z.object({
  name: z.string().min(1, "Medication name is required"),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.string().min(1, "Frequency is required"),
  startDate: z.date(),
  endDate: z.date().nullable().optional(),
  instructions: z.string().nullable().optional(),
  timeOfDay: z.string().min(1, "Time of day is required"),
  withFood: z.boolean().default(false),
  refillDate: z.date().nullable().optional(),
});

// Form Schema for logging medication
const medicationLogSchema = z.object({
  takenAt: z.date(),
  skipped: z.boolean().default(false),
  notes: z.string().nullable().optional(),
});

type MedicationFormValues = z.infer<typeof medicationFormSchema>;
type MedicationLogFormValues = z.infer<typeof medicationLogSchema>;

export default function MedicationTracker() {
  const { toast } = useToast();
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  
  // Query all medications
  const { data: medications, isLoading: isLoadingMedications } = useQuery<Medication[]>({
    queryKey: ["/api/medications"],
  });
  
  // Query active medications
  const { data: activeMedications, isLoading: isLoadingActive } = useQuery<Medication[]>({
    queryKey: ["/api/medications/active"],
  });
  
  // Query medication logs for selected medication
  const { data: medicationLogs, isLoading: isLoadingLogs } = useQuery<MedicationLog[]>({
    queryKey: ["/api/medications", selectedMedication?.id, "logs"],
    enabled: !!selectedMedication,
  });
  
  // Form for adding/editing medication
  const form = useForm<MedicationFormValues>({
    resolver: zodResolver(medicationFormSchema),
    defaultValues: {
      name: "",
      dosage: "",
      frequency: "daily",
      timeOfDay: "morning",
      withFood: false,
      instructions: "",
    },
  });
  
  // Form for logging medication
  const logForm = useForm<MedicationLogFormValues>({
    resolver: zodResolver(medicationLogSchema),
    defaultValues: {
      takenAt: new Date(),
      skipped: false,
      notes: "",
    },
  });
  
  // Create medication mutation
  const createMedicationMutation = useMutation({
    mutationFn: async (medication: MedicationFormValues) => {
      const res = await apiRequest("POST", "/api/medications", medication);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/medications/active"] });
      setShowAddForm(false);
      form.reset();
      toast({
        title: "Success",
        description: "Medication added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add medication",
        variant: "destructive",
      });
    },
  });
  
  // Update medication mutation
  const updateMedicationMutation = useMutation({
    mutationFn: async (medication: MedicationFormValues & { id: number }) => {
      const { id, ...data } = medication;
      const res = await apiRequest("PATCH", `/api/medications/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/medications/active"] });
      setIsEditMode(false);
      setSelectedMedication(null);
      form.reset();
      toast({
        title: "Success",
        description: "Medication updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update medication",
        variant: "destructive",
      });
    },
  });
  
  // Toggle medication active status mutation
  const toggleMedicationMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      const res = await apiRequest("PATCH", `/api/medications/${id}/toggle`, { active });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/medications/active"] });
      toast({
        title: "Success",
        description: "Medication status updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update medication status",
        variant: "destructive",
      });
    },
  });
  
  // Log medication mutation
  const logMedicationMutation = useMutation({
    mutationFn: async ({ id, log }: { id: number; log: MedicationLogFormValues }) => {
      const res = await apiRequest("POST", `/api/medications/${id}/logs`, log);
      return await res.json();
    },
    onSuccess: () => {
      if (selectedMedication) {
        queryClient.invalidateQueries({ queryKey: ["/api/medications", selectedMedication.id, "logs"] });
      }
      setShowLogForm(false);
      logForm.reset({
        takenAt: new Date(),
        skipped: false,
        notes: "",
      });
      toast({
        title: "Success",
        description: "Medication log added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to log medication",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission for add/edit medication
  const onSubmit = (values: MedicationFormValues) => {
    if (isEditMode && selectedMedication) {
      updateMedicationMutation.mutate({ ...values, id: selectedMedication.id });
    } else {
      createMedicationMutation.mutate(values);
    }
  };
  
  // Handle form submission for logging medication
  const onLogSubmit = (values: MedicationLogFormValues) => {
    if (selectedMedication) {
      logMedicationMutation.mutate({ id: selectedMedication.id, log: values });
    }
  };
  
  // Function to toggle medication status
  const toggleMedicationStatus = (medication: Medication) => {
    toggleMedicationMutation.mutate({
      id: medication.id,
      active: !medication.active,
    });
  };
  
  // Function to edit a medication
  const editMedication = (medication: Medication) => {
    setSelectedMedication(medication);
    setIsEditMode(true);
    
    // Convert date strings to Date objects
    const formValues = {
      ...medication,
      startDate: parseISO(medication.startDate),
      endDate: medication.endDate ? parseISO(medication.endDate) : undefined,
      refillDate: medication.refillDate ? parseISO(medication.refillDate) : undefined,
    };
    
    form.reset(formValues);
    setShowAddForm(true);
  };
  
  // Function to show the log form for a medication
  const showLogFormForMedication = (medication: Medication) => {
    setSelectedMedication(medication);
    setShowLogForm(true);
    logForm.reset({
      takenAt: new Date(),
      skipped: false,
      notes: "",
    });
  };
  
  // Function to get medications that need to be taken today
  const getTodaysMedications = () => {
    if (!activeMedications) return [];
    
    return activeMedications.filter(med => {
      const startDate = parseISO(med.startDate);
      const endDate = med.endDate ? parseISO(med.endDate) : null;
      
      return (
        // Started on or before today
        isBefore(startDate, new Date()) || isToday(startDate)
      ) && (
        // Has not ended, or ends on or after today
        !endDate || isToday(endDate) || isBefore(new Date(), endDate)
      );
    });
  };
  
  // Function to check if a medication has been taken today
  const isMedicationTakenToday = (medicationId: number) => {
    if (!medicationLogs) return false;
    
    return medicationLogs.some(log => {
      const logDate = parseISO(log.takenAt);
      return isToday(logDate) && !log.skipped;
    });
  };
  
  // Helper to determine if a refill reminder is needed
  const needsRefill = (medication: Medication) => {
    if (!medication.refillDate) return false;
    
    const refillDate = parseISO(medication.refillDate);
    const today = new Date();
    const oneWeek = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    
    return refillDate.getTime() - today.getTime() <= oneWeek;
  };
  
  // Reset form when closing add form
  const closeAddForm = () => {
    setShowAddForm(false);
    setIsEditMode(false);
    setSelectedMedication(null);
    form.reset();
  };
  
  // When selectedMedication changes, update form values if in edit mode
  useEffect(() => {
    if (selectedMedication && isEditMode) {
      // Convert date strings to Date objects
      const formValues = {
        ...selectedMedication,
        startDate: parseISO(selectedMedication.startDate),
        endDate: selectedMedication.endDate ? parseISO(selectedMedication.endDate) : undefined,
        refillDate: selectedMedication.refillDate ? parseISO(selectedMedication.refillDate) : undefined,
      };
      
      form.reset(formValues);
    }
  }, [selectedMedication, isEditMode, form]);
  
  return (
    <Layout title="Medication Tracker">
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Medication Tracker</h1>
          <Button 
            onClick={() => {
              setShowAddForm(true);
              setIsEditMode(false);
              form.reset();
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Medication
          </Button>
        </div>
        
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="today">Today's Medications</TabsTrigger>
            <TabsTrigger value="all">All Medications</TabsTrigger>
          </TabsList>
          
          {/* Today's Medications Tab */}
          <TabsContent value="today" className="space-y-4">
            {isLoadingActive ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : getTodaysMedications().length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getTodaysMedications().map((medication) => (
                  <Card key={medication.id} className={cn(
                    "relative overflow-hidden",
                    needsRefill(medication) && "border-yellow-400"
                  )}>
                    {needsRefill(medication) && (
                      <div className="absolute top-0 right-0 p-1 bg-yellow-400 text-white text-xs rounded-bl-md flex items-center">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Refill Soon
                      </div>
                    )}
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="flex items-center">
                          <Pill className="h-5 w-5 mr-2 text-primary" />
                          {medication.name}
                        </CardTitle>
                        <Badge variant={isMedicationTakenToday(medication.id) ? "default" : "outline"} className={isMedicationTakenToday(medication.id) ? "bg-green-500" : ""}>
                          {isMedicationTakenToday(medication.id) ? "Taken" : "Pending"}
                        </Badge>
                      </div>
                      <CardDescription>
                        {medication.dosage} - {medication.timeOfDay}
                        {medication.withFood && " (with food)"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="text-sm space-y-1">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>Frequency: {medication.frequency}</span>
                        </div>
                        {medication.instructions && (
                          <div className="text-muted-foreground">
                            {medication.instructions}
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-0">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => showLogFormForMedication(medication)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Log Intake
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => editMedication(medication)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/40 rounded-lg">
                <Pill className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">No Medications For Today</h3>
                <p className="text-muted-foreground mb-4">
                  You don't have any active medications to take today.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAddForm(true);
                    setIsEditMode(false);
                    form.reset();
                  }}
                >
                  Add Your First Medication
                </Button>
              </div>
            )}
          </TabsContent>
          
          {/* All Medications Tab */}
          <TabsContent value="all">
            {isLoadingMedications ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : medications && medications.length > 0 ? (
              <div className="space-y-4">
                <Accordion type="single" collapsible className="w-full">
                  {medications.map((medication) => (
                    <AccordionItem key={medication.id} value={medication.id.toString()}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center">
                            <div className={cn(
                              "h-3 w-3 rounded-full mr-3",
                              medication.active ? "bg-green-500" : "bg-gray-300"
                            )} />
                            <span>{medication.name}</span>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <span className="mr-2">{medication.dosage}</span>
                            <Badge variant="outline" className="mr-2">
                              {medication.frequency}
                            </Badge>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="bg-muted/30 p-4 rounded-md">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <h4 className="text-sm font-medium mb-2">Medication Details</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                  <span>Time: {medication.timeOfDay}</span>
                                </div>
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                  <span>
                                    Start: {format(parseISO(medication.startDate), "PPP")}
                                  </span>
                                </div>
                                {medication.endDate && (
                                  <div className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <span>
                                      End: {format(parseISO(medication.endDate), "PPP")}
                                    </span>
                                  </div>
                                )}
                                {medication.refillDate && (
                                  <div className="flex items-center">
                                    <RefreshCw className="h-4 w-4 mr-2 text-muted-foreground" />
                                    <span>
                                      Refill: {format(parseISO(medication.refillDate), "PPP")}
                                    </span>
                                  </div>
                                )}
                                {medication.withFood && (
                                  <div className="flex items-center">
                                    <span className="text-muted-foreground">Take with food</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {medication.instructions && (
                              <div>
                                <h4 className="text-sm font-medium mb-2">Instructions</h4>
                                <p className="text-sm text-muted-foreground">
                                  {medication.instructions}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex space-x-2 mt-4">
                            <div className="flex-1">
                              <Switch
                                checked={medication.active}
                                onCheckedChange={() => toggleMedicationStatus(medication)}
                                id={`active-${medication.id}`}
                              />
                              <Label
                                htmlFor={`active-${medication.id}`}
                                className="ml-2"
                              >
                                {medication.active ? "Active" : "Inactive"}
                              </Label>
                            </div>
                            
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => showLogFormForMedication(medication)}
                            >
                              Log
                            </Button>
                            
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => editMedication(medication)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/40 rounded-lg">
                <Pill className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">No Medications Added</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't added any medications to track yet.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAddForm(true);
                    setIsEditMode(false);
                    form.reset();
                  }}
                >
                  Add Your First Medication
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Add/Edit Medication Dialog */}
        <Dialog open={showAddForm} onOpenChange={closeAddForm}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{isEditMode ? "Edit Medication" : "Add New Medication"}</DialogTitle>
              <DialogDescription>
                {isEditMode 
                  ? "Update the details of your medication."
                  : "Add details about your medication to track."
                }
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medication Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter medication name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dosage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dosage</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., 500mg, 1 tablet" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frequency</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="daily" id="daily" />
                              <Label htmlFor="daily">Daily</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="twice daily" id="twice-daily" />
                              <Label htmlFor="twice-daily">Twice Daily</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="weekly" id="weekly" />
                              <Label htmlFor="weekly">Weekly</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="as needed" id="as-needed" />
                              <Label htmlFor="as-needed">As Needed</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="timeOfDay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time of Day</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="morning" id="morning" />
                              <Label htmlFor="morning">Morning</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="afternoon" id="afternoon" />
                              <Label htmlFor="afternoon">Afternoon</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="evening" id="evening" />
                              <Label htmlFor="evening">Evening</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="night" id="night" />
                              <Label htmlFor="night">Night</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <Calendar className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date (Optional)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>No end date</span>
                                )}
                                <Calendar className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value ?? undefined}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="refillDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Refill Date (Optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>No refill date</span>
                              )}
                              <Calendar className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value ?? undefined}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="withFood"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Take with food</FormLabel>
                        <FormDescription>
                          Check this if the medication should be taken with food
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special Instructions (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="E.g., Take on an empty stomach, Avoid alcohol"
                          className="resize-none"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit" disabled={createMedicationMutation.isPending || updateMedicationMutation.isPending}>
                    {createMedicationMutation.isPending || updateMedicationMutation.isPending ? (
                      <span className="flex items-center">
                        <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full"></div>
                        Processing...
                      </span>
                    ) : (
                      <span>{isEditMode ? "Update" : "Add"} Medication</span>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* Log Medication Dialog */}
        <Dialog open={showLogForm} onOpenChange={setShowLogForm}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Log Medication</DialogTitle>
              <DialogDescription>
                {selectedMedication && (
                  <span>Record when you took {selectedMedication.name}</span>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...logForm}>
              <form onSubmit={logForm.handleSubmit(onLogSubmit)} className="space-y-4">
                <FormField
                  control={logForm.control}
                  name="takenAt"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date & Time Taken</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP p")
                              ) : (
                                <span>Pick a date and time</span>
                              )}
                              <Calendar className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            defaultMonth={field.value}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={logForm.control}
                  name="skipped"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>I skipped this dose</FormLabel>
                        <FormDescription>
                          Check this if you didn't take the medication
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={logForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any relevant notes or reactions"
                          className="resize-none"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit" disabled={logMedicationMutation.isPending}>
                    {logMedicationMutation.isPending ? (
                      <span className="flex items-center">
                        <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full"></div>
                        Logging...
                      </span>
                    ) : (
                      <span>Save Log</span>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* View Medication Logs */}
        {selectedMedication && medicationLogs && medicationLogs.length > 0 && !showAddForm && !showLogForm && (
          <Dialog open={!!selectedMedication && !showAddForm && !showLogForm} onOpenChange={() => setSelectedMedication(null)}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Medication History</DialogTitle>
                <DialogDescription>
                  History of when you took {selectedMedication.name}
                </DialogDescription>
              </DialogHeader>
              
              <ScrollArea className="h-[300px] rounded-md border p-4">
                <div className="space-y-4">
                  {medicationLogs.map((log) => (
                    <div key={log.id} className="border-b pb-3 last:border-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium flex items-center">
                            {log.skipped ? (
                              <X className="h-4 w-4 text-destructive mr-1" />
                            ) : (
                              <Check className="h-4 w-4 text-green-500 mr-1" />
                            )}
                            {format(parseISO(log.takenAt), "PPP p")}
                          </div>
                          {log.skipped ? (
                            <div className="text-sm text-destructive">Skipped dose</div>
                          ) : (
                            <div className="text-sm text-green-600">Taken</div>
                          )}
                        </div>
                        <Badge variant="outline">
                          {format(parseISO(log.takenAt), "EEE")}
                        </Badge>
                      </div>
                      {log.notes && (
                        <div className="mt-1 text-sm text-muted-foreground">
                          {log.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <DialogFooter>
                <Button 
                  variant="secondary"
                  onClick={() => setSelectedMedication(null)}
                >
                  Close
                </Button>
                <Button 
                  onClick={() => showLogFormForMedication(selectedMedication)}
                >
                  Add New Log
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Layout>
  );
}