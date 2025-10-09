import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Loader2, User, Bot } from "lucide-react";
import { useNavigate } from "react-router-dom"; // <-- Import the hook

const ANTHROPIC_API_KEY = "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";

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
  const navigate = useNavigate(); // <-- Instantiate the hook

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    const updatedMessages = [...messages, { role: "user", content: userMessage }];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }, 0);

    try {
      let prompt = "";
      updatedMessages.forEach((msg) => {
        if (msg.role === "user") {
          prompt += `
Human: ${msg.content}`;
        } else {
          prompt += `
Assistant: ${msg.content}`;
        }
      });
      prompt += `
Assistant: `;

      const response = await fetch("https://api.anthropic.com/v1/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
        },
        body: JSON.stringify({
          model: "claude-2",
          prompt: prompt,
          max_tokens_to_sample: 300,
          stop_sequences: ["
Human:"],
          temperature: 0.5,
          stream: false,
        }),
      });

      const data = await response.json();
      if (data.completion) {
        setMessages([...updatedMessages, { role: "assistant", content: data.completion.trim() }]);
      } else {
        setMessages([
          ...updatedMessages,
          { role: "assistant", content: "Sorry, I couldn't process your request. Please try again." }
        ]);
      }
    } catch (error) {
      setMessages([
        ...updatedMessages,
        { role: "assistant", content: `Error: ${error.message || "Failed to get response."}` }
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }, 50);
    }
  };

  const handleInputKey = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-2 space-y-4">
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
                    <div className="bg-blue-100 text-blue-900 px-3 py-2 rounded-md max-w-lg whitespace-pre-wrap">
                      {message.content}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 justify-end">
                    <div className="bg-green-50 text-green-900 px-3 py-2 rounded-md max-w-lg whitespace-pre-wrap">
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

      <Button
        onClick={() => navigate("/")} // <-- Changed this line
        variant="outline"
        className="w-full mt-4"
        data-testid="button-continue-dashboard"
      >
        Continue to CareGuardian Dashboard
      </Button>
    </div>
  );
}      updatedMessages.forEach((msg) => {
        if (msg.role === "user") {
          prompt += `\nHuman: ${msg.content}`;
        } else {
          prompt += `\nAssistant: ${msg.content}`;
        }
      });
      prompt += `\nAssistant: `; // Prompt Claude to complete

      const response = await fetch("https://api.anthropic.com/v1/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
        },
        body: JSON.stringify({
          model: "claude-2", // Use the latest Claude version
          prompt: prompt,
          max_tokens_to_sample: 300,
          stop_sequences: ["\nHuman:"], // Stop generating when next human turn starts
          temperature: 0.5,
          stream: false,
        }),
      });

      const data = await response.json();
      if (data.completion) {
        setMessages([...updatedMessages, { role: "assistant", content: data.completion.trim() }]);
      } else {
        setMessages([
          ...updatedMessages,
          { role: "assistant", content: "Sorry, I couldn't process your request. Please try again." }
        ]);
      }
    } catch (error) {
      setMessages([
        ...updatedMessages,
        { role: "assistant", content: `Error: ${error.message || "Failed to get response."}` }
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }, 50);
    }
  };

  const handleInputKey = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-2 space-y-4">
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
                    <div className="bg-blue-100 text-blue-900 px-3 py-2 rounded-md max-w-lg whitespace-pre-wrap">
                      {message.content}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 justify-end">
                    <div className="bg-green-50 text-green-900 px-3 py-2 rounded-md max-w-lg whitespace-pre-wrap">
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

      <Button
        onClick={() => (window.location.href = "https://careguardian.com")}
        variant="outline"
        className="w-full mt-4"
        data-testid="button-continue-dashboard"
      >
        Continue to CareGuardian Dashboard
      </Button>
    </div>
  );
}
