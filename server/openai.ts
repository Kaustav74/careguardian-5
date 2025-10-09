import fetch from "node-fetch";

const CHATBASE_API_KEY = process.env.CHATBASE_API_KEY;

if (!CHATBASE_API_KEY) {
  throw new Error("CHATBASE_API_KEY environment variable is not set");
}

/**
 * Sends the user's message to Chatbase API and returns the assistant's reply.
 * @param message The user message to send
 * @returns The assistant's reply as a string
 */
export async function getChatbaseReply(message: string): Promise<string> {
  try {
    const response = await fetch("https://api.chatbase.co/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CHATBASE_API_KEY}`,
      },
      body: JSON.stringify({
        message: message,
        // Additional optional Chatbase API parameters can be included here
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Chatbase API error: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();

    // Example assumes the reply is in data.reply, please adjust if response shape differs
    return data.reply || "No reply from Chatbase";
  } catch (error) {
    console.error("Failed to get response from Chatbase:", error);
    throw error;
  }
}
