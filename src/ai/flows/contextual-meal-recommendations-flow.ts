
'use server';
/**
 * @fileOverview A Genkit flow for providing personalized meal recommendations based on current weather, time of day, and user mood.
 *
 * - contextualMealRecommendations - A function that handles the meal recommendation process.
 * - ContextualMealRecommendationsInput - The input type for the contextualMealRecommendations function.
 * - ContextualMealRecommendationsOutput - The return type for the contextualMealRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema
const ContextualMealRecommendationsInputSchema = z.object({
  weather: z.string().describe('Current weather conditions (e.g., "sunny", "rainy", "cold", "hot").'),
  timeOfDay: z.string().describe('Current time of day (e.g., "morning", "afternoon", "evening", "night").'),
  userMood: z.string().describe('User mood (e.g., "hungry", "craving something sweet", "feeling adventurous").')
});
export type ContextualMealRecommendationsInput = z.infer<typeof ContextualMealRecommendationsInputSchema>;

// Output Schema
const ContextualMealRecommendationsOutputSchema = z.object({
  recommendations: z.array(
    z.object({
      name: z.string().describe('Name of the recommended meal.'),
      description: z.string().describe('A short description of the meal.'),
      reasoning: z.string().describe('The reason this meal is recommended based on the weather, time of day, and user mood.')
    })
  ).describe('An array of personalized meal recommendations.')
});
export type ContextualMealRecommendationsOutput = z.infer<typeof ContextualMealRecommendationsOutputSchema>;

// Wrapper function
export async function contextualMealRecommendations(
  input: ContextualMealRecommendationsInput
): Promise<ContextualMealRecommendationsOutput> {
  return contextualMealRecommendationsFlow(input);
}

// Define the prompt
const mealRecommendationPrompt = ai.definePrompt({
  name: 'mealRecommendationPrompt',
  input: { schema: ContextualMealRecommendationsInputSchema },
  output: { schema: ContextualMealRecommendationsOutputSchema },
  prompt: `You are an AI assistant for a cafe named "Ezzy Bites". Your task is to recommend meals based on the current context.

Provide a list of personalized meal recommendations considering the following:
- Current Weather: {{{weather}}}
- Time of Day: {{{timeOfDay}}}
- User Mood: {{{userMood}}}

Recommend 2-3 dishes that are suitable for the given conditions.
For each recommendation, include the meal's name, a short description, and a clear reasoning for why it's a good fit based on the provided context.

Example:
If weather is "sunny", time of day is "afternoon", and user mood is "thirsty and want something light", you might recommend:
1. Name: "Mango Tango Smoothie"
   Description: "A refreshing blend of fresh mangoes, yogurt, and a hint of mint."
   Reasoning: "Perfect for a sunny afternoon when you're thirsty and looking for a light, fruity treat."

Output the recommendations in JSON format as specified by the output schema.`
});

// Define the Genkit flow
const contextualMealRecommendationsFlow = ai.defineFlow(
  {
    name: 'contextualMealRecommendationsFlow',
    inputSchema: ContextualMealRecommendationsInputSchema,
    outputSchema: ContextualMealRecommendationsOutputSchema,
  },
  async (input) => {
    const { output } = await mealRecommendationPrompt(input);
    if (!output) {
      throw new Error('Failed to get meal recommendations from the prompt.');
    }
    return output;
  }
);
