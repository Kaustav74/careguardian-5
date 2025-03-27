import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function FirstAid() {
  const { toast } = useToast();

  const handleNotifyClick = () => {
    toast({
      title: "Thank you for your interest!",
      description: "We'll notify you when our AI-powered First Aid Assistant becomes available.",
    });
  };

  return (
    <Layout title="First Aid Guidance">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coming Soon Card */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>CareGuardian First Aid Assistant - Coming Soon!</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center">
            <div className="max-w-3xl">
              <div className="flex justify-center mb-8">
                <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center">
                  <i className="ri-heart-pulse-line text-6xl text-primary"></i>
                </div>
              </div>
              
              <h2 className="text-2xl font-semibold mb-4">We're working on something special</h2>
              
              <p className="text-gray-600 mb-6">
                Our AI-powered First Aid Assistant will be available soon to provide you with reliable
                first aid guidance for various situations. Get instant access to step-by-step instructions
                for managing emergencies while waiting for professional medical help.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="border border-gray-200 rounded-lg p-4 text-left">
                  <div className="flex items-center mb-2">
                    <i className="ri-robot-line text-xl text-primary mr-2"></i>
                    <h3 className="font-medium">AI-Powered Guidance</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Advanced AI technology will provide accurate first aid instructions based on the latest medical guidelines.
                  </p>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4 text-left">
                  <div className="flex items-center mb-2">
                    <i className="ri-message-3-line text-xl text-primary mr-2"></i>
                    <h3 className="font-medium">Interactive Assistant</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Chat with our virtual assistant to get real-time first aid advice for any emergency situation.
                  </p>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4 text-left">
                  <div className="flex items-center mb-2">
                    <i className="ri-file-list-3-line text-xl text-primary mr-2"></i>
                    <h3 className="font-medium">Comprehensive Guides</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Access detailed step-by-step guides for handling common emergencies and medical situations.
                  </p>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4 text-left">
                  <div className="flex items-center mb-2">
                    <i className="ri-service-line text-xl text-primary mr-2"></i>
                    <h3 className="font-medium">24/7 Availability</h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    Get reliable first aid guidance anytime, anywhere, when you need it the most.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button onClick={handleNotifyClick} size="lg">
                  Notify Me When Available
                </Button>
                <Button variant="outline" size="lg" onClick={() => window.open('/auth', '_self')}>
                  Return to Dashboard
                </Button>
              </div>
              
              <div className="mt-8 text-sm text-gray-500">
                <p>
                  <i className="ri-information-line mr-1"></i>
                  This service is designed to provide general guidance only and is not a replacement for professional medical advice or emergency services.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}