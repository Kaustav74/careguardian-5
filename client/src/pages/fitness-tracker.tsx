import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, Activity, TrendingUp, Heart, Footprints, Flame, Moon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FitnessData } from "@shared/schema";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const fitnessDataFormSchema = z.object({
  source: z.string().min(1, "Source is required"),
  steps: z.coerce.number().min(0).optional(),
  heartRate: z.coerce.number().min(0).max(300).optional(),
  caloriesBurned: z.coerce.number().min(0).optional(),
  sleepHours: z.coerce.number().min(0).max(24).optional(),
  distance: z.coerce.number().min(0).optional(),
  activeMinutes: z.coerce.number().min(0).optional(),
  weight: z.coerce.number().min(0).optional(),
  date: z.date(),
});

type FitnessDataForm = z.infer<typeof fitnessDataFormSchema>;

export default function FitnessTracker() {
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const form = useForm<FitnessDataForm>({
    resolver: zodResolver(fitnessDataFormSchema),
    defaultValues: {
      source: "manual",
      steps: undefined,
      heartRate: undefined,
      caloriesBurned: undefined,
      sleepHours: undefined,
      distance: undefined,
      activeMinutes: undefined,
      weight: undefined,
      date: new Date(),
    },
  });

  const { data: fitnessData, isLoading } = useQuery<FitnessData[]>({
    queryKey: ["/api/fitness-data"],
  });

  const { data: latestData } = useQuery<FitnessData>({
    queryKey: ["/api/fitness-data/latest"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: FitnessDataForm) => {
      return await apiRequest("/api/fitness-data", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fitness-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/fitness-data/latest"] });
      toast({
        title: "Data Added",
        description: "Fitness data has been recorded successfully.",
      });
      setShowForm(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Add Data",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FitnessDataForm) => {
    createMutation.mutate(data);
  };

  const calculateAverage = (field: keyof FitnessData) => {
    if (!fitnessData || fitnessData.length === 0) return 0;
    const values = fitnessData
      .map((d) => d[field] as number)
      .filter((v) => v !== null && v !== undefined && !isNaN(v));
    if (values.length === 0) return 0;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-fitness-tracker-title">Fitness Tracker</h1>
          <p className="text-muted-foreground">Track your fitness data and health metrics</p>
        </div>
        <Activity className="h-10 w-10 text-primary" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-stats-steps">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Footprints className="h-4 w-4" />
              Daily Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-latest-steps">
              {latestData?.steps?.toLocaleString() || "0"}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg: {calculateAverage("steps").toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-stats-heart">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Heart Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-latest-heart-rate">
              {latestData?.heartRate || "0"} <span className="text-sm">bpm</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Avg: {calculateAverage("heartRate")} bpm
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-stats-calories">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Flame className="h-4 w-4" />
              Calories Burned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-latest-calories">
              {latestData?.caloriesBurned?.toLocaleString() || "0"}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg: {calculateAverage("caloriesBurned").toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-stats-sleep">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Moon className="h-4 w-4" />
              Sleep Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-latest-sleep">
              {latestData?.sleepHours || "0"} <span className="text-sm">hrs</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Avg: {calculateAverage("sleepHours")} hrs
            </p>
          </CardContent>
        </Card>
      </div>

      {!showForm && (
        <Button onClick={() => setShowForm(true)} className="w-full" data-testid="button-show-form">
          <TrendingUp className="mr-2 h-4 w-4" />
          Add Fitness Data
        </Button>
      )}

      {showForm && (
        <Card data-testid="card-add-data-form">
          <CardHeader>
            <CardTitle>Add Fitness Data</CardTitle>
            <CardDescription>
              Manually enter your fitness metrics or sync from your tracker
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                                data-testid="button-select-date"
                              >
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
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
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-source">
                              <SelectValue placeholder="Select source" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="manual">Manual Entry</SelectItem>
                            <SelectItem value="fitbit">Fitbit</SelectItem>
                            <SelectItem value="apple-health">Apple Health</SelectItem>
                            <SelectItem value="google-fit">Google Fit</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="steps"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Steps</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="10000" {...field} data-testid="input-steps" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="heartRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Heart Rate (bpm)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="75" {...field} data-testid="input-heart-rate" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="caloriesBurned"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Calories Burned</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="500" {...field} data-testid="input-calories" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sleepHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sleep Hours</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="8" {...field} data-testid="input-sleep" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="distance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Distance (meters)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="5000" {...field} data-testid="input-distance" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="activeMinutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Active Minutes</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="30" {...field} data-testid="input-active-minutes" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight (kg)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="70" {...field} data-testid="input-weight" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex-1"
                    data-testid="button-submit"
                  >
                    {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Data
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <Card data-testid="card-fitness-history">
        <CardHeader>
          <CardTitle>Fitness History</CardTitle>
          <CardDescription>Your recent fitness data entries</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex justify-center p-4" data-testid="loader-fitness-data">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}

          {!isLoading && (!fitnessData || fitnessData.length === 0) && (
            <p className="text-sm text-muted-foreground text-center p-4" data-testid="text-no-data">
              No fitness data recorded yet. Add your first entry above.
            </p>
          )}

          {!isLoading && fitnessData && fitnessData.length > 0 && (
            <div className="space-y-3">
              {fitnessData.slice(0, 10).map((data) => (
                <Card key={data.id} data-testid={`card-fitness-entry-${data.id}`}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium">
                        {format(new Date(data.date), "MMM dd, yyyy")}
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">{data.source}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      {data.steps && (
                        <div>
                          <span className="text-muted-foreground">Steps:</span> {data.steps.toLocaleString()}
                        </div>
                      )}
                      {data.heartRate && (
                        <div>
                          <span className="text-muted-foreground">HR:</span> {data.heartRate} bpm
                        </div>
                      )}
                      {data.caloriesBurned && (
                        <div>
                          <span className="text-muted-foreground">Cal:</span> {data.caloriesBurned}
                        </div>
                      )}
                      {data.sleepHours && (
                        <div>
                          <span className="text-muted-foreground">Sleep:</span> {data.sleepHours} hrs
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
