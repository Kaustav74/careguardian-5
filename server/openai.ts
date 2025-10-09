// openai.ts (updated for Chatbase integration)
import fetch from "node-fetch";

const CHATBASE_API_KEY = process.env.CHATBASE_API_KEY;
if (!CHATBASE_API_KEY) {
  throw new Error("CHATBASE_API_KEY environment variable is not set");
}

export async function analyzeSymptoms(
  symptoms: string,
  age: number,
  gender: string,
  medicalHistory?: string | null
): Promise<any> {
  // Call Chatbase API with constructed message about symptoms etc.
  const prompt = `Analyze symptoms: ${symptoms}, Age: ${age}, Gender: ${gender}, Medical History: ${medicalHistory || "none"}`;
  
  const response = await fetch("https://api.chatbase.co/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CHATBASE_API_KEY}`,
    },
    body: JSON.stringify({ message: prompt }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Chatbase error");
  return data.reply;
}

export async function getFirstAidGuidance(query: string): Promise<any> {
  // Similar Chatbase API call for first aid advice
  const prompt = `Provide first aid guidance for: ${query}`;
  
  const response = await fetch("https://api.chatbase.co/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CHATBASE_API_KEY}`,
    },
    body: JSON.stringify({ message: prompt }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Chatbase error");
  return data.reply;
}
