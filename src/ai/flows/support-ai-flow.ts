'use server';
/**
 * @fileOverview Automated Support Assistant for Ezzy Bites.
 * Resolves common customer issues using AI and brand-specific FAQs.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SupportAIInputSchema = z.object({
  message: z.string().describe('The user\'s current question or concern.'),
  category: z.string().optional().describe('The selected support category (e.g. Order, Payment).'),
  orderContext: z.string().optional().describe('Contextual information about the specific order being discussed.'),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string()
  })).optional().describe('The previous messages in the current support session.')
});

export type SupportAIInput = z.infer<typeof SupportAIInputSchema>;

const SupportAIOutputSchema = z.object({
  reply: z.string().describe('The automated response from Ezzy Assistant.'),
  suggestedActions: z.array(z.string()).optional().describe('Suggested follow-up questions or actions.')
});

export type SupportAIOutput = z.infer<typeof SupportAIOutputSchema>;

export async function ezzySupportAI(input: SupportAIInput): Promise<SupportAIOutput> {
  return supportAIFlow(input);
}

const prompt = ai.definePrompt({
  name: 'ezzySupportPrompt',
  // Model inherited from global ai config to prevent 404 URL mapping errors
  input: { schema: SupportAIInputSchema },
  output: { schema: SupportAIOutputSchema },
  prompt: `You are "Ezzy AI", the official automated support assistant for "Ezzy Bites", a premium fast food cafe.
Your goal is to provide fast, helpful, and polite resolutions to customer concerns without human intervention.

RESTAURANT KNOWLEDGE:
- Name: Ezzy Bites
- Location: Pocharam Campus, Near Anurag University, Hyderabad.
- Timings: 08:00 AM to 10:00 PM daily.
- Delivery: 3km radius around campus. FREE on orders above ₹149. Flat ₹40 below that.
- Payments: Cash on Delivery, UPI, and Online Wallets.
- Cancellation: Allowed within 5 minutes of placing order.

CATEGORY CONTEXT:
{{#if category}}Category: {{{category}}}{{/if}}
{{#if orderContext}}Order Details: {{{orderContext}}}{{/if}}

USER MESSAGE:
{{{message}}}

GUIDELINES:
1. Be concise and friendly.
2. If the user wants to cancel an order and it's within 5 minutes, tell them they can do it from the tracking page.
3. If they have payment issues (amount deducted), tell them to wait 24-48 hours for an automatic refund from their bank.
4. If they received wrong/cold food, offer a sincere apology and suggest they rate the items for our chefs to see.
5. Do NOT promise human intervention or live chat. You ARE the resolution node.
6. Provide suggested actions like "How to cancel?", "Check refund status", etc.

Output your reply in the defined JSON schema.`
});

const supportAIFlow = ai.defineFlow(
  {
    name: 'supportAIFlow',
    inputSchema: SupportAIInputSchema,
    outputSchema: SupportAIOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      if (!output) throw new Error('AI failed to generate a response.');
      return output;
    } catch (error) {
      console.error('🔥 [Ezzy AI] Flow Execution Error:', error);
      throw error;
    }
  }
);
