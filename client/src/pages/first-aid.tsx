import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Loader2, User, Bot } from "lucide-react";

export default function FirstAidAssistant() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I am your First Aid Assistant. Ask any first aid question." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });
      const data = await response.json();

      if (response.ok) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: "Error: " + data.message }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Failed to fetch response." }]);
    } finally {
      setLoading(false);
      setTimeout(() => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" }), 100);
    }
  };

  return (
    <div className="container mx-auto max-w-xl p-4">
      <Card>
        <CardHeader>
          <CardTitle>First Aid Assistant</CardTitle>
          <CardDescription>Get instant first aid advice powered by Chatbase.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col space-y-4 h-[400px] overflow-y-auto" ref={chatRef}>
          {messages.map((msg, i) => (
            <div key={i} className={`flex space-x-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && <Bot className="h-6 w-6 text-blue-500" />}
              {msg.role === "user" && <User className="h-6 w-6 text-green-500" />}
              <div
                className={`rounded-lg p-2 max-w-[70%] ${
                  msg.role === "assistant" ? "bg-blue-100 text-blue-900" : "bg-green-100 text-green-900"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex space-x-3 justify-start animate-pulse">
              <Bot className="h-6 w-6 text-blue-500" />
              <div className="rounded-lg p-2 max-w-[70%] bg-blue-100 text-blue-900">Typing...</div>
            </div>
          )}
        </CardContent>
        <div className="flex space-x-2 mt-4">
          <input
            type="text"
            className="flex-1 rounded border border-gray-300 p-2"
            placeholder="Ask your first aid question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={loading}
          />
          <Button onClick={handleSend} disabled={loading}>
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send"}
          </Button>
        </div>
        <div className="mt-6">
          <Button onClick={() => navigate("/")} className="w-full">
            Continue to CareGuardian Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
}
