import { useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function FirstAidChatbase() {
  const [, navigate] = useLocation();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <div className="container mx-auto max-w-xl p-4 flex flex-col min-h-screen">
      <Card className="flex-grow flex flex-col">
        <CardHeader>
          <CardTitle>First Aid Assistant</CardTitle>
          <CardDescription>
            Get instant first aid advice powered by Chatbase.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden mt-2">
          <iframe
            src="https://www.chatbase.co/chatbot-iframe/tGaL6PkzwM3yCHsjQfjk1"
            width="100%"
            style={{ height: "100%", minHeight: "700px", border: 0 }}
            ref={iframeRef}
            title="Chatbase First Aid Chatbot"
          />
        </CardContent>
        <div className="mt-4">
          <Button onClick={() => navigate("/dashboard")} className="w-full">
            Continue to CareGuardian Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
}
