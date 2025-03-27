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
                          className="text-3xl p-6"  // Larger text and input for ease of use
                        />
                      </FormControl>
                      <FormMessage className="text-base" />
                    </FormItem>
                  )}
                />
                
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
                          type="number" 
                          min="1" 
                          max="120"
                          className="text-3xl p-6" // Larger text and input for ease of use
                        />
                      </FormControl>
                      <FormMessage className="text-base" />
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
                          className="text-2xl p-6" // Larger text and input for ease of use
                        />
                      </FormControl>
                      <FormMessage className="text-base" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg">Address</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Your full address where the doctor should visit" 
                          {...field} 
                          rows={3}
                          className="text-xl" // Larger text for ease of use
                        />
                      </FormControl>
                      <FormMessage className="text-base" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="symptoms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex justify-between text-lg">
                        <span>Symptoms</span>
                        {isSpeechSupported && (
                          <div className="flex items-center space-x-2">
                            <Button
                              type="button"
                              variant={listening ? "destructive" : "outline"} 
                              size="sm"
                              onClick={toggleListening}
                              className="h-8"
                            >
                              {listening ? <MicOff className="h-4 w-4 mr-1" /> : <Mic className="h-4 w-4 mr-1" />}
                              {listening ? "Stop" : "Voice Input"}
                            </Button>
                            {transcript && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  resetTranscript();
                                  form.setValue('symptoms', '');
                                }}
                                className="h-8"
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Clear
                              </Button>
                            )}
                          </div>
                        )}
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={isSpeechSupported 
                            ? "Describe your symptoms or click 'Voice Input' to speak" 
                            : "Describe your symptoms in detail"} 
                          {...field} 
                          rows={5}
                          className={`text-xl ${listening ? 'border-primary border-2' : ''}`}
                        />
                      </FormControl>
                      {listening && (
                        <div className="mt-2 animate-pulse text-primary">
                          Listening... Speak clearly about your symptoms
                        </div>
                      )}
                      {!isSpeechSupported && (
                        <FormDescription className="text-amber-600">
                          Voice input is not supported in your browser. Please type your symptoms.
                        </FormDescription>
                      )}
                      <FormMessage className="text-base" />
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
                          className="flex flex-col space-y-4"
                        >
                          <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-blue-50 transition-colors">
                            <RadioGroupItem value="subscription" id="subscription" className="h-6 w-6" />
                            <Label htmlFor="subscription" className="text-lg font-medium cursor-pointer">
                              Included with my subscription
                            </Label>
                          </div>
                          <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-blue-50 transition-colors">
                            <RadioGroupItem value="oneTime" id="oneTime" className="h-6 w-6" />
                            <Label htmlFor="oneTime" className="text-lg font-medium cursor-pointer">
                              One-time payment (₹999)
                            </Label>
                          </div>
                        </RadioGroup>
                        <p className="text-base text-muted-foreground mt-3">
                          <a href="/subscription" className="text-primary hover:underline">
                            View our subscription plans
                          </a> to get unlimited doctor visits and more benefits.
                        </p>
                      </FormControl>
                      <FormMessage className="text-base" />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full text-xl py-8 mt-8"
                  disabled={isSubmitting}
                  size="lg"
                >
                  {isSubmitting ? "Submitting Request..." : "Submit Doctor Request"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        {/* Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-lg">
                <span className="text-primary font-medium">1</span>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-1">Submit Your Request</h3>
                <p className="text-base text-gray-600">
                  Fill out the form with your details and symptoms.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-lg">
                <span className="text-primary font-medium">2</span>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-1">Doctor Assignment</h3>
                <p className="text-base text-gray-600">
                  We'll assign a qualified doctor based on your medical needs.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-lg">
                <span className="text-primary font-medium">3</span>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-1">Confirmation</h3>
                <p className="text-base text-gray-600">
                  You'll receive a confirmation call with the expected arrival time.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-lg">
                <span className="text-primary font-medium">4</span>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-1">Doctor Visit</h3>
                <p className="text-base text-gray-600">
                  The doctor will visit your location at the scheduled time.
                </p>
              </div>
            </div>
            
            <div className="mt-6 p-5 bg-amber-50 border border-amber-200 rounded-lg">
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <i className="ri-information-line mr-2 text-amber-600 text-xl"></i>
                Important Information
              </h3>
              <ul className="text-base text-amber-700 space-y-3">
                <li className="flex">
                  <span className="mr-2">•</span>
                  <span>Doctor availability may vary based on your location in Bengaluru and time of request</span>
                </li>
                <li className="flex">
                  <span className="mr-2">•</span>
                  <span>For emergencies, please call emergency services immediately</span>
                </li>
                <li className="flex">
                  <span className="mr-2">•</span>
                  <span>Premium subscribers get priority scheduling and additional benefits</span>
                </li>
                <li className="flex">
                  <span className="mr-2">•</span>
                  <span>One-time payment can be made via credit card or digital payment methods</span>
                </li>
                <li className="flex">
                  <span className="mr-2">•</span>
                  <span><a href="/subscription" className="text-primary font-medium hover:underline">Subscribe to our premium plans</a> for unlimited doctor visits</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}