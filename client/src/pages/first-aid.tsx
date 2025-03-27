import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function FirstAid() {
  const { toast } = useToast();

  const handleNotifyClick = () => {
    toast({
      title: "Thank you for your interest!",
      description: "We'll notify you when our AI-powered First Aid Assistant becomes available in Bengaluru.",
    });
  };

  return (
    <Layout title="First Aid Guide">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coming Soon Card */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>CareGuardian First Aid Assistant - Coming Soon!</CardTitle>
            <CardDescription>OpenAI-powered health guidance for Bengaluru residents</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center">
            <div className="max-w-3xl">
              <div className="flex justify-center mb-8">
                <div className="w-32 h-32 rounded-full bg-gradient-to-r from-orange-100 to-green-100 flex items-center justify-center border border-green-200">
                  <i className="ri-heart-pulse-line text-6xl text-primary"></i>
                </div>
              </div>
              
              <h2 className="text-2xl font-semibold mb-4">Coming soon to Bengaluru</h2>
              
              <p className="text-gray-600 mb-6">
                Our OpenAI-powered First Aid Assistant will be available soon to provide you with reliable
                first aid guidance customized for Indian healthcare needs. Get instant access to step-by-step 
                instructions for managing emergencies while waiting for medical help to arrive.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="border border-gray-200 rounded-lg p-4 text-left">
                  <div className="flex items-center mb-2">
                    <i className="ri-robot-line text-xl text-primary mr-2"></i>
                    <h3 className="font-medium">Powered by OpenAI</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Using the latest GPT models to provide accurate first aid instructions based on Indian medical guidelines and locally available resources.
                  </p>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4 text-left">
                  <div className="flex items-center mb-2">
                    <i className="ri-translate-2 text-xl text-primary mr-2"></i>
                    <h3 className="font-medium">Multi-language Support</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Get guidance in English, Hindi, Kannada, and other Indian languages to ensure everyone can access help.
                  </p>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4 text-left">
                  <div className="flex items-center mb-2">
                    <i className="ri-map-pin-line text-xl text-primary mr-2"></i>
                    <h3 className="font-medium">Local Emergency Numbers</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Quick access to Bengaluru-specific emergency contacts including local ambulance services and nearby hospitals.
                  </p>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4 text-left">
                  <div className="flex items-center mb-2">
                    <i className="ri-phone-line text-xl text-primary mr-2"></i>
                    <h3 className="font-medium">Offline Functionality</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Basic first aid guides will be available even without internet connectivity, essential for emergencies.
                  </p>
                </div>
              </div>
              
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-8">
                <h3 className="font-medium flex items-center text-orange-800">
                  <i className="ri-information-line mr-2"></i>
                  For immediate medical emergencies
                </h3>
                <p className="text-sm text-orange-700 mt-1">
                  Please dial 108 for emergency ambulance services or 102 for non-emergency ambulance 
                  services in Bengaluru. For police assistance, dial 100.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button onClick={handleNotifyClick} size="lg" className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600">
                  Get Early Access
                </Button>
                <Button variant="outline" size="lg" onClick={() => window.open('/', '_self')}>
                  Return to Dashboard
                </Button>
              </div>
              
              <div className="mt-8 text-sm text-gray-500">
                <p>
                  <i className="ri-information-line mr-1"></i>
                  This service is designed to provide general guidance only and is not a replacement for professional medical advice or emergency services. 
                  Always seek proper medical attention for serious conditions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}