import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Redirect } from "wouter";

// Define subscription plan types
type SubscriptionPlan = {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  popular?: boolean;
  buttonText: string;
};

export default function Subscription() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  // Subscription plans data
  const subscriptionPlans: SubscriptionPlan[] = [
    {
      id: "basic",
      name: "Basic",
      price: "₹499/month",
      description: "Essential healthcare services for individuals",
      features: [
        "24/7 Chat Support",
        "Basic Health Monitoring",
        "Access to Medical Records",
        "Emergency Contact Services"
      ],
      buttonText: "Coming Soon"
    },
    {
      id: "premium",
      name: "Premium",
      price: "₹999/month",
      description: "Enhanced healthcare for individuals and families",
      features: [
        "All Basic features",
        "Priority Doctor Appointments",
        "Dedicated Health Manager",
        "Monthly Health Check-ups",
        "Family Coverage (up to 4 members)"
      ],
      popular: true,
      buttonText: "Coming Soon"
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "₹2499/month",
      description: "Complete healthcare solution for businesses",
      features: [
        "All Premium features",
        "Corporate Wellness Programs",
        "Employee Health Tracking",
        "Quarterly Health Webinars",
        "Customized Healthcare Solutions",
        "Dedicated Account Manager"
      ],
      buttonText: "Coming Soon"
    }
  ];

  const handleSubscribe = (planId: string) => {
    toast({
      title: "Subscription Coming Soon",
      description: "This feature will be available soon. Thank you for your interest!",
      variant: "default",
    });
  };

  if (isLoading) {
    return (
      <Layout title="Subscription Plans">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  return (
    <Layout title="Subscription Plans">
      <div className="container mx-auto py-8 px-4">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">Choose Your Healthcare Plan</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Select a subscription plan that suits your healthcare needs. Our plans are designed to provide comprehensive healthcare services at affordable prices.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {subscriptionPlans.map((plan) => (
            <Card key={plan.id} className={`flex flex-col h-full ${plan.popular ? 'border-primary border-2 shadow-lg' : ''}`}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{plan.name}</CardTitle>
                  {plan.popular && (
                    <Badge variant="default" className="bg-primary hover:bg-primary">
                      Popular
                    </Badge>
                  )}
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-bold">{plan.price}</span>
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check size={18} className="mr-2 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => handleSubscribe(plan.id)} 
                  className="w-full" 
                  variant={plan.popular ? "default" : "outline"}
                >
                  {plan.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-16 max-w-3xl mx-auto bg-muted p-6 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="text-primary mr-4 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-medium text-lg mb-2">Coming Soon: Subscription Services</h3>
              <p className="text-muted-foreground">
                Our subscription services are currently under development. We're working hard to bring you the best healthcare subscription options with premium benefits and features.
                Thank you for your patience!
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}