import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

// Form schema for the doctor request
const bringDoctorSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  contactNumber: z.string().min(10, "Please enter a valid contact number"),
  address: z.string().min(5, "Address must be at least 5 characters long"),
  requestDetails: z.string().min(10, "Please provide more details about your request"),
  paymentOption: z.enum(["subscription", "oneTime"]),
});

type BringDoctorFormValues = z.infer<typeof bringDoctorSchema>;

export default function BringDoctor() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set up the form
  const form = useForm<BringDoctorFormValues>({
    resolver: zodResolver(bringDoctorSchema),
    defaultValues: {
      name: "",
      contactNumber: "",
      address: "",
      requestDetails: "",
      paymentOption: "oneTime",
    },
  });

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
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <Layout title="Bring a Doctor">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Request a Doctor Visit</CardTitle>
            <CardDescription>
              Fill out the form below to request a doctor to visit your location
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your full name" {...field} />
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
                      <FormLabel>Contact Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Your phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Your full address where the doctor should visit" 
                          {...field} 
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="requestDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Request Details</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your medical concern or reason for requesting a doctor" 
                          {...field} 
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="paymentOption"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Payment Option</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="subscription" id="subscription" />
                            <Label htmlFor="subscription" className="font-normal">
                              Included with my subscription
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="oneTime" id="oneTime" />
                            <Label htmlFor="oneTime" className="font-normal">
                              One-time payment (₹999)
                            </Label>
                          </div>
                        </RadioGroup>
                        <p className="text-sm text-muted-foreground mt-2">
                          <a href="/subscription" className="text-primary hover:underline">
                            View our subscription plans
                          </a> to get unlimited doctor visits and more benefits.
                        </p>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting Request..." : "Submit Request"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        {/* Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <span className="text-primary font-medium">1</span>
              </div>
              <div>
                <h3 className="font-medium mb-1">Submit Your Request</h3>
                <p className="text-sm text-gray-600">
                  Fill out the form with your details and medical concern.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <span className="text-primary font-medium">2</span>
              </div>
              <div>
                <h3 className="font-medium mb-1">Doctor Assignment</h3>
                <p className="text-sm text-gray-600">
                  We'll assign a qualified doctor based on your medical needs.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <span className="text-primary font-medium">3</span>
              </div>
              <div>
                <h3 className="font-medium mb-1">Confirmation</h3>
                <p className="text-sm text-gray-600">
                  You'll receive a confirmation call with the expected arrival time.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <span className="text-primary font-medium">4</span>
              </div>
              <div>
                <h3 className="font-medium mb-1">Doctor Visit</h3>
                <p className="text-sm text-gray-600">
                  The doctor will visit your location at the scheduled time.
                </p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2 flex items-center">
                <i className="ri-information-line mr-2 text-primary"></i>
                Important Information
              </h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Doctor availability may vary based on your location in Bengaluru and time of request</li>
                <li>• For emergencies, please call emergency services immediately</li>
                <li>• Premium subscribers get priority scheduling and additional benefits</li>
                <li>• One-time payment can be made via credit card or digital payment methods</li>
                <li>• <a href="/subscription" className="text-primary hover:underline">Subscribe to our premium plans</a> for unlimited doctor visits</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}