
'use server';
/**
 * @fileOverview A Genkit flow for generating marketing copy for a daily special food item.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DailySpecialInputSchema = z.object({
  dishName: z.string().describe('The name of the dish to promote.'),
  basePrice: z.number().describe('The normal price of the dish.'),
  discountPercent: z.number().describe('The discount percentage to apply.'),
});
export type DailySpecialInput = z.infer<typeof DailySpecialInputSchema>;

const DailySpecialOutputSchema = z.object({
  promoTitle: z.string().describe('A catchy title for the promotion.'),
  promoDescription: z.string().describe('Engaging description for social media.'),
  finalPrice: z.number().describe('Calculated price after discount.'),
  emoji: z.string().describe('A relevant emoji for the promotion.'),
});
export type DailySpecialOutput = z.infer<typeof DailySpecialOutputSchema>;

export async function dailySpecialGenerator(input: DailySpecialInput): Promise<DailySpecialOutput> {
  return dailySpecialGeneratorFlow(input);
}

const promoPrompt = ai.definePrompt({
  name: 'dailySpecialPrompt',
  input: { schema: DailySpecialInputSchema },
  output: { schema: DailySpecialOutputSchema },
  prompt: `You are a creative marketing expert for "Ezzy Bites", a premium fast food cafe.
Generate a punchy, exciting promotion for the dish: {{{dishName}}}.
The base price is ₹{{{basePrice}}} and we are offering a {{{discountPercent}}}% discount.

Calculated final price: ₹{{#with this}}{{{multiply basePrice (subtract 1 (divide discountPercent 100))}}}{{/with}} (just estimate if math helpers aren't clear, but prefer accuracy).

Include:
1. A catchy headline.
2. A description that makes people hungry.
3. The discounted price prominently.
4. A fun emoji.`,
});

const dailySpecialGeneratorFlow = ai.defineFlow(
  {
    name: 'dailySpecialGeneratorFlow',
    inputSchema: DailySpecialInputSchema,
    outputSchema: DailySpecialOutputSchema,
  },
  async (input) => {
    const { output } = await promoPrompt(input);
    return output!;
  }
);
