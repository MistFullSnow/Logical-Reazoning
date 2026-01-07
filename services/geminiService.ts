import { GoogleGenAI, Type } from "@google/genai";
import { Question, Difficulty, TopicDef } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are an expert question setter for the MAH-MBA/MMS-CET entrance exam. 
Your goal is to generate unique, high-quality Logical and Abstract Reasoning questions based on the specific syllabus provided.
The response must be a valid JSON object.
For 'Abstract Reasoning' or 'Visual' topics, you must generate a simple, clean SVG string that represents the problem visually in the 'svg' field. The SVG should be viewbox 0 0 200 100 roughly.
For text-based questions, the 'svg' field should be empty.
Ensure the difficulty matches the request.
`;

export const generateQuestion = async (topic: TopicDef): Promise<Question> => {
  const isVisual = topic.id.includes('visual') || topic.id.includes('abstract');
  
  // Fixed: Removed reference to topic.difficulty which does not exist on TopicDef. Defaulted to Medium.
  const prompt = `
    Generate 1 unique Medium difficulty question for the topic: "${topic.name}".
    Context: ${topic.description}.
    
    ${isVisual ? "This is a visual reasoning question. Create a simple SVG representation of a sequence or pattern." : "This is a text-based logical reasoning question."}
    
    Return the response in this JSON schema:
    {
      "text": "The question text here. If visual, describe what to look for.",
      "svg": "Optional SVG code string here (no markdown, just the <svg> tag and content) if visual, else null",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4", "Option 5"],
      "correctAnswerIndex": 0,
      "explanation": "Detailed explanation of the solution."
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            svg: { type: Type.STRING, nullable: true },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswerIndex: { type: Type.INTEGER },
            explanation: { type: Type.STRING }
          },
          required: ["text", "options", "correctAnswerIndex", "explanation"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    
    if (!data.text || !data.options) {
      throw new Error("Invalid response structure");
    }

    return {
      id: Date.now().toString(),
      text: data.text,
      svg: data.svg,
      options: data.options,
      correctAnswerIndex: data.correctAnswerIndex,
      explanation: data.explanation,
      topic: topic.name,
      difficulty: Difficulty.MEDIUM
    };

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    // Fallback error question to prevent crash
    return {
      id: "error",
      text: "Failed to establish neural link with the AI core. Please try again.",
      options: ["Retry"],
      correctAnswerIndex: 0,
      explanation: "Network or API Key Error.",
      topic: "Error",
      difficulty: Difficulty.EASY
    };
  }
};