import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * @fileOverview Centralized Genkit configuration for Ezzy Bites.
 * Standardizes the AI logic node using the stable Gemini 1.5 Flash model.
 */

const apiKey = process.env.GEMINI_API_KEY;

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey,
    }),
  ],
  // Use the fully qualified stable model identifier for Gemini 1.5 Flash
  model: 'googleai/gemini-1.5-flash-latest',
});
