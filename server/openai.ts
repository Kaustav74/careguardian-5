import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Analyzes symptoms provided by the user and returns potential diagnoses
 * 
 * @param symptoms - The symptoms described by the user
 * @param age - The user's age
 * @param gender - The user's gender
 * @param medicalHistory - The user's relevant medical history
 * @returns Analysis results including potential conditions, recommendations, and urgency level
 */
export async function analyzeSymptoms(
  symptoms: string,
  age: number,
  gender: string,
  medicalHistory?: string | null
): Promise<{
  possibleConditions: Array<{ condition: string; probability: string }>;
  recommendations: string[];
  urgencyLevel: "low" | "medium" | "high" | "emergency";
  disclaimer: string;
}> {
  try {
    const prompt = `
      As a medical assistant AI, analyze the following symptoms and provide potential diagnoses and recommendations.
      
      Patient Information:
      - Age: ${age}
      - Gender: ${gender}
      - Symptoms: ${symptoms}
      ${medicalHistory ? `- Medical History: ${medicalHistory}` : ''}
      
      Based on this information, provide:
      1. 2-5 possible conditions that match these symptoms (with probability level: low, medium, or high)
      2. General recommendations for the patient
      3. Urgency level (low, medium, high, or emergency)
      
      Respond with JSON in this format:
      {
        "possibleConditions": [
          {"condition": "Name of condition", "probability": "low/medium/high"}
        ],
        "recommendations": ["recommendation 1", "recommendation 2", ...],
        "urgencyLevel": "low/medium/high/emergency",
        "disclaimer": "Standard medical disclaimer"
      }
      
      IMPORTANT: Include a clear medical disclaimer stating this is not a replacement for professional medical advice.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content || '{}';
    const result = JSON.parse(content);
    
    return {
      possibleConditions: result.possibleConditions || [],
      recommendations: result.recommendations || [],
      urgencyLevel: result.urgencyLevel || "low",
      disclaimer: result.disclaimer || "This analysis is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition."
    };
  } catch (error) {
    console.error("Error analyzing symptoms:", error);
    throw new Error("Failed to analyze symptoms. Please try again later.");
  }
}

/**
 * Gets first aid guidance for a specific medical situation
 * 
 * @param situation - The medical situation requiring first aid
 * @returns First aid guidance including steps and warnings
 */
export async function getFirstAidGuidance(
  situation: string
): Promise<{
  situation: string;
  steps: string[];
  warnings: string[];
  disclaimer: string;
}> {
  try {
    const prompt = `
      As a medical assistant AI, provide first aid guidance for the following situation:
      
      Situation: ${situation}
      
      Based on this information, provide:
      1. Step-by-step first aid instructions
      2. Important warnings or precautions
      
      Respond with JSON in this format:
      {
        "situation": "Brief description of the situation",
        "steps": ["step 1", "step 2", ...],
        "warnings": ["warning 1", "warning 2", ...],
        "disclaimer": "Standard medical disclaimer"
      }
      
      IMPORTANT: Include a clear medical disclaimer stating this is not a replacement for professional medical advice or emergency services.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content || '{}';
    const result = JSON.parse(content);
    
    return {
      situation: result.situation || situation,
      steps: result.steps || [],
      warnings: result.warnings || [],
      disclaimer: result.disclaimer || "This guidance is not a substitute for professional medical advice, diagnosis, or treatment. In case of emergency, call emergency services immediately."
    };
  } catch (error) {
    console.error("Error getting first aid guidance:", error);
    throw new Error("Failed to get first aid guidance. Please try again later.");
  }
}