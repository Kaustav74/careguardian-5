import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plus, X, AlertCircle, Activity, Clock, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SymptomCheck } from "@shared/schema";

const symptomCheckFormSchema = z.object({
  age: z.coerce.number().min(1).max(120),
  gender: z.string().min(1, "Gender is required"),
  medicalHistory: z.string().optional(),
});

type SymptomCheckForm = z.infer<typeof symptomCheckFormSchema>;

export default function SymptomChecker() {
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [currentSymptom, setCurrentSymptom] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);
  const { toast } = useToast();

  const form = useForm<SymptomCheckForm>({
    resolver: zodResolver(symptomCheckFormSchema),
    defaultValues: {
      age: 30,
      gender: "",
      medicalHistory: "",
    },
  });

  const { data: symptomHistory, isLoading: isLoadingHistory } = useQuery<SymptomCheck[]>({
    queryKey: ["/api/symptom-checks"],
  });

  const analyzeMutation = useMutation({
    mutationFn: async (data: SymptomCheckForm) => {
      return await apiRequest("/api/symptom-check", "POST", {
        symptoms,
        age: data.age,
        gender: data.gender,
        medicalHistory: data.medicalHistory || null,
      });
    },
    onSuccess: (data) => {
      setAnalysis(data);
      queryClient.invalidateQueries({ queryKey: ["/api/symptom-checks"] });
      toast({
        title: "Analysis Complete",
        description: "Your symptoms have been analyzed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addSymptom = () => {
    if (currentSymptom.trim() && !symptoms.includes(currentSymptom.trim())) {
      setSymptoms([...symptoms, currentSymptom.trim()]);
      setCurrentSymptom("");
    }
  };

  const removeSymptom = (symptom: string) => {
    setSymptoms(symptoms.filter((s) => s !== symptom));
  };

  const onSubmit = (data: SymptomCheckForm) => {
    if (symptoms.length === 0) {
      toast({
        title: "No Symptoms",
        description: "Please add at least one symptom.",
        variant: "destructive",
      });
      return;
    }
    analyzeMutation.mutate(data);
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "emergency":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-symptom-checker-title">Symptom Checker</h1>
          <p className="text-muted-foreground">Get AI-powered preliminary diagnosis</p>
        </div>
        <Activity className="h-10 w-10 text-primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card data-testid="card-symptom-input">
            <CardHeader>
              <CardTitle>Enter Your Symptoms</CardTitle>
              <CardDescription>
                Describe your symptoms in detail for accurate analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter a symptom (e.g., headache, fever)"
                  value={currentSymptom}
                  onChange={(e) => setCurrentSymptom(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSymptom();
                    }
                  }}
                  data-testid="input-symptom"
                />
                <Button onClick={addSymptom} type="button" data-testid="button-add-symptom">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {symptoms.map((symptom) => (
                  <Badge key={symptom} variant="secondary" className="text-sm" data-testid={`badge-symptom-${symptom}`}>
                    {symptom}
                    <button
                      onClick={() => removeSymptom(symptom)}
                      className="ml-2 hover:text-destructive"
                      data-testid={`button-remove-symptom-${symptom}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              {symptoms.length === 0 && (
                <p className="text-sm text-muted-foreground" data-testid="text-no-symptoms">
                  No symptoms added yet. Start by typing a symptom above.
                </p>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-patient-info">
            <CardHeader>
              <CardTitle>Patient Information</CardTitle>
              <CardDescription>
                This information helps provide more accurate analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="30" {...field} data-testid="input-age" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-gender">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="medicalHistory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Medical History (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any relevant medical conditions or medications..."
                            {...field}
                            data-testid="input-medical-history"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={analyzeMutation.isPending || symptoms.length === 0}
                    data-testid="button-analyze"
                  >
                    {analyzeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Analyze Symptoms
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {analysis && (
            <Card data-testid="card-analysis-result">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Analysis Results
                  <Badge className={getRiskLevelColor(analysis.riskLevel)} data-testid="badge-risk-level">
                    {analysis.riskLevel?.toUpperCase()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert data-testid="alert-disclaimer">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {analysis.disclaimer}
                  </AlertDescription>
                </Alert>

                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Possible Conditions
                  </h3>
                  <div className="space-y-2">
                    {analysis.possibleConditions?.map((condition: any, index: number) => (
                      <Card key={index} data-testid={`card-condition-${index}`}>
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start">
                            <span className="font-medium">{condition.condition}</span>
                            <Badge variant="outline" data-testid={`badge-probability-${index}`}>
                              {condition.probability}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Recommendations
                  </h3>
                  <ul className="space-y-2">
                    {analysis.recommendationsArray?.map((rec: string, index: number) => (
                      <li key={index} className="text-sm flex gap-2" data-testid={`text-recommendation-${index}`}>
                        <span className="text-primary">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          <Card data-testid="card-symptom-history">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Previous Checks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingHistory && (
                <div className="flex justify-center p-4" data-testid="loader-history">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}

              {!isLoadingHistory && symptomHistory && symptomHistory.length === 0 && (
                <p className="text-sm text-muted-foreground text-center p-4" data-testid="text-no-history">
                  No previous symptom checks
                </p>
              )}

              {!isLoadingHistory && symptomHistory && symptomHistory.length > 0 && (
                <div className="space-y-3">
                  {symptomHistory.slice(0, 5).map((check) => (
                    <Card key={check.id} data-testid={`card-history-${check.id}`}>
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(check.createdAt!).toLocaleDateString()}
                          </span>
                          <Badge className={getRiskLevelColor(check.riskLevel)} data-testid={`badge-history-risk-${check.id}`}>
                            {check.riskLevel}
                          </Badge>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Symptoms: </span>
                          {check.symptoms.slice(0, 3).join(", ")}
                          {check.symptoms.length > 3 && "..."}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
