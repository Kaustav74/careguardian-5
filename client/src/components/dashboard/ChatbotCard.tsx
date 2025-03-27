import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Message {
  id: number;
  message: string;
  isUserMessage: boolean;
  timestamp: Date;
}

export default function ChatbotCard() {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Get the chat history
  const { data: historyData, isLoading } = useQuery({
    queryKey: ["/api/chat/history"],
    // Don't show a spinner on initial load, we have predefined welcome message
    staleTime: 0,
  });
  
  // Mutation for sending messages
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/chat/message", {
        message,
        isUserMessage: true
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/history"] });
      // Add the messages to the chat history
      setChatHistory(prev => [
        ...prev,
        data.userMessage,
        data.botResponse
      ]);
    },
  });
  
  // Update chat history when data loads
  useEffect(() => {
    if (historyData) {
      setChatHistory(historyData);
    }
  }, [historyData]);
  
  // Initialize with a welcome message if there's no history
  useEffect(() => {
    if (!isLoading && (!historyData || historyData.length === 0)) {
      setChatHistory([
        {
          id: 0,
          message: "Hello! I'm your virtual first aid assistant. How can I help you today?",
          isUserMessage: false,
          timestamp: new Date()
        }
      ]);
    }
  }, [isLoading, historyData]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    sendMessageMutation.mutate(message);
    setMessage("");
  };
  
  // Topic suggestions
  const topics = ["CPR Instructions", "Allergy Reaction", "Bleeding Control"];

  const handleTopicClick = (topic: string) => {
    sendMessageMutation.mutate(`Tell me about ${topic}`);
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">First Aid Assistant</h2>
          <button className="text-gray-400 hover:text-gray-500">
            <i className="ri-information-line"></i>
          </button>
        </div>
        <ScrollArea 
          className="h-64 border border-gray-200 rounded-lg p-3 mb-4 bg-gray-50"
          ref={scrollAreaRef}
        >
          <div className="space-y-2">
            {chatHistory.map((msg) => (
              <div 
                key={msg.id}
                className={`chatbot-message p-3 max-w-[75%] mb-2 ${
                  msg.isUserMessage 
                    ? 'user-message bg-primary-100 ml-auto rounded-[16px_16px_0_16px]' 
                    : 'bot-message bg-gray-100 mr-auto rounded-[16px_16px_16px_0]'
                }`}
              >
                <p className="text-sm whitespace-pre-line">{msg.message}</p>
              </div>
            ))}
            
            {sendMessageMutation.isPending && (
              <div className="bot-message bg-gray-100 mr-auto rounded-[16px_16px_16px_0] p-3 max-w-[75%] mb-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <form onSubmit={handleSendMessage} className="relative">
          <Input
            type="text"
            placeholder="Ask about first aid..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="pr-10"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <button 
              type="submit"
              className="text-primary-600 hover:text-primary-700 focus:outline-none"
              disabled={sendMessageMutation.isPending}
            >
              <i className="ri-send-plane-fill"></i>
            </button>
          </div>
        </form>
        <div className="mt-4">
          <div className="flex space-x-2">
            {topics.map((topic) => (
              <button
                key={topic}
                type="button"
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-full text-xs text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                onClick={() => handleTopicClick(topic)}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
