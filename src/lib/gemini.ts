import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set in environment variables');
}

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Get the model for text generation with JSON output
export function getGenerativeModel() {
  return genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 500,
    },
  });
}
