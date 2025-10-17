import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialized once with the API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export const generate = async (prompt: string) => {
  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    return { generatedText: text };
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Re-throw a custom, safe error for the controller to handle
    throw new Error("Failed to generate content from AI service.");
  }
};