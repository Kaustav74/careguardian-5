import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Mic, MicOff, RotateCcw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Form schema for the doctor request
const bringDoctorSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  age: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0 && Number(val) < 120, {
    message: "Please enter a valid age between 1 and 120",
  }),
  contactNumber: z.string().min(10, "Please enter a valid contact number"),
  address: z.string().min(5, "Address must be at least 5 characters long"),
  symptoms: z.string().min(10, "Please describe your symptoms in more detail"),
  paymentOption: z.enum(["subscription", "oneTime"]),
});

type BringDoctorFormValues = z.infer<typeof bringDoctorSchema>;

export default function BringDoctor() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  
  // Speech recognition setup
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  // Check if browser supports speech recognition
  useEffect(() => {
    setIsSpeechSupported(browserSupportsSpeechRecognition);
  }, [browserSupportsSpeechRecognition]);

  // Set up the form
  const form = useForm<BringDoctorFormValues>({
    resolver: zodResolver(bringDoctorSchema),
    defaultValues: {
      name: "",
      age: "",
      contactNumber: "",
      address: "",
      symptoms: "",
      paymentOption: "oneTime",
    },
  });

  // Update symptoms field when transcript changes
  useEffect(() => {
    if (transcript) {
      form.setValue('symptoms', transcript, { shouldValidate: true });
    }
  }, [transcript, form]);

  // Toggle speech recognition
  const toggleListening = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true });
    }
  };

  const onSubmit = (data: BringDoctorFormValues) => {
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log("Form data:", data);
      
      toast({
        title: "Request Submitted",
        description: "Your doctor request has been successfully submitted. We'll contact you shortly.",
      });
      
      form.reset();
      resetTranscript();
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <Layout title="Bring a Doctor">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-2xl">Request a Doctor Visit</CardTitle>
            <CardDescription className="text-lg">
              Fill out the form below to request a doctor to visit your location
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6 bg-blue-50 border-blue-200">
              <i className="ri-information-line text-xl text-blue-500 mr-2"></i>
              <AlertTitle className="text-lg font-medium text-blue-700">Senior-Friendly Form</AlertTitle>
              <AlertDescription className="text-blue-600">
                This form has larger text and inputs. You can also use voice input to describe your symptoms by clicking the "Voice Input" button.
              </AlertDescription>
            </Alert>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg">Full Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Your full name" 
                          {...field}
                          className="p-3 text-lg h-14" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg">Age</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Your age" 
                            {...field} 
                            className="p-3 text-lg h-14"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg">Contact Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Your phone number" 
                            {...field} 
                            className="p-3 text-lg h-14"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg">Full Address</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Your complete address" 
                          {...field} 
                          className="p-3 text-lg min-h-24 leading-relaxed"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="symptoms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg">Symptoms Description</FormLabel>
                      <div className="flex gap-2 mb-2">
                        {isSpeechSupported && (
                          <Button 
                            type="button" 
                            variant={listening ? "destructive" : "secondary"}
                            onClick={toggleListening}
                            className="h-12 text-base px-4 gap-2"
                          >
                            {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                            {listening ? "Stop Voice Input" : "Voice Input"}
                          </Button>
                        )}
                        {transcript && (
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={resetTranscript}
                            className="h-12 text-base px-4 gap-2"
                          >
                            <RotateCcw className="h-5 w-5" />
                            Clear
                          </Button>
                        )}
                      </div>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your symptoms in detail" 
                          {...field} 
                          className="p-3 text-lg min-h-32 leading-relaxed"
                        />
                      </FormControl>
                      {listening && (
                        <p className="text-green-600 text-base mt-1">
                          <Mic className="h-4 w-4 inline mr-1" /> Listening... speak clearly
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentOption"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-lg">Payment Option</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-3"
                        >
                          <div className="flex items-center space-x-3 rounded-md border p-4 shadow-sm">
                            <RadioGroupItem 
                              value="subscription" 
                              id="subscription" 
                              className="h-5 w-5" 
                            />
                            <Label htmlFor="subscription" className="text-lg font-medium flex-1">
                              Use my subscription
                              <p className="text-sm font-normal text-muted-foreground">
                                No additional charge for subscribers
                              </p>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-3 rounded-md border p-4 shadow-sm">
                            <RadioGroupItem 
                              value="oneTime" 
                              id="oneTime" 
                              className="h-5 w-5" 
                            />
                            <Label htmlFor="oneTime" className="text-lg font-medium flex-1">
                              One-time payment
                              <p className="text-sm font-normal text-muted-foreground">
                                ₹999 for a doctor visit
                              </p>
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full h-14 text-lg font-medium"
                >
                  {isSubmitting ? "Submitting..." : "Request Doctor Visit"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">About Doctor Visits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium text-lg mb-1">How it works</h3>
              <p className="text-base text-muted-foreground">
                Our qualified doctors will visit your home within 2 hours of your request (subject to availability).
              </p>
            </div>
            <div>
              <h3 className="font-medium text-lg mb-1">What to expect</h3>
              <ul className="list-disc pl-5 text-base text-muted-foreground space-y-1">
                <li>Initial consultation and diagnosis</li>
                <li>Basic treatment and prescriptions</li>
                <li>Referrals to specialists if needed</li>
                <li>Follow-up recommendations</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-lg mb-1">Subscription benefits</h3>
              <p className="text-base text-muted-foreground">
                Subscribers get unlimited doctor visits, priority scheduling, and no additional charges.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <div className="bg-primary/10 p-4 rounded-lg w-full">
              <p className="text-primary font-medium">
                <i className="ri-time-line mr-2"></i>
                Average response time: 45 minutes
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
}