import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Loader2, User, Bot } from "lucide-react";

const OPENAI_KEY = "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";

export default function FirstAidAssistant() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I am your First Aid Assistant. Ask any first aid question (e.g., how to treat a burn, perform CPR, or assist in emergencies)."
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Add user message
    const nextMessages = [...messages, { role: "user", content: input.trim() }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    // Auto scroll to bottom after sending
    setTimeout(() => {
      if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }
    }, 0);

    // Call OpenAI Chat API
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: nextMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          temperature: 0.5,
          max_tokens: 300
        })
      });

      const data = await response.json();
      if (data.choices?.[0]?.message?.content) {
        setMessages([
          ...nextMessages,
          { role: "assistant", content: data.choices[0].message.content }
        ]);
      } else {
        setMessages([
          ...nextMessages,
          {
            role: "assistant",
            content: "Sorry, I couldn't process your request. Please try again."
          }
        ]);
      }
    } catch {
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: "Oops! Network error or API failed. Please try again."
        }
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        if (chatRef.current) {
          chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
      }, 50);
    }
  };

  const handleInputKey = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-2">
      <Card>
        <CardHeader>
          <CardTitle>First Aid Assistant</CardTitle>
          <CardDescription>
            Get instant guidance for emergencies, injuries, and first aid. Ask a question or describe a situation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            ref={chatRef}
            className="bg-gray-50 rounded-md mb-4 p-3 h-[380px] overflow-y-auto border text-sm"
            data-testid="chat-window"
          >
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex items-start mb-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" ? (
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-blue-600" />
                    <div className="bg-blue-100 text-blue-900 px-3 py-2 rounded-md max-w-lg">
                      {message.content}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 justify-end">
                    <div className="bg-green-50 text-green-900 px-3 py-2 rounded-md max-w-lg">
                      {message.content}
                    </div>
                    <User className="h-4 w-4 text-green-700" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 mb-1">
                <Bot className="h-4 w-4 text-blue-600" />
                <span className="animate-pulse text-xs font-medium text-blue-600">
                  <Loader2 className="inline-block mr-1 h-4 w-4 animate-spin" />
                  Assistant is typing...
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 border rounded px-3 py-2 text-sm"
              type="text"
              placeholder="Type your first aid question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleInputKey}
              disabled={loading}
              data-testid="chat-input"
            />
            <Button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              data-testid="chat-send"
              className="bg-blue-600 hover:bg-blue-700 px-4"
            >
              Send
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
