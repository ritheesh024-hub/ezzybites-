
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('⚠️ [Ezzy AI] GEMINI_API_KEY is missing from environment variables.');
} else {
  console.log('✅ [Ezzy AI] Gemini client initialized with GEMINI_API_KEY.');
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey,
    }),
  ],
  model: 'googleai/gemini-1.5-flash',
});
