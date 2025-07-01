// src/ai/flows/suggest-available-times.ts
'use server';

/**
 * @fileOverview Suggests available time slots based on staff availability and service duration.
 *
 * - suggestAvailableTimes - A function that suggests available time slots.
 * - SuggestAvailableTimesInput - The input type for the suggestAvailableTimes function.
 * - SuggestAvailableTimesOutput - The return type for the suggestAvailableTimes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestAvailableTimesInputSchema = z.object({
  serviceDuration: z
    .number()
    .describe('The duration of the service in minutes.'),
  staffAvailability: z
    .string()
    .describe(
      'The availability of the staff, as a JSON array of objects with start and end times.'
    ),
  preferredDate: z.string().describe('The preferred date for the appointment (YYYY-MM-DD).'),
});
export type SuggestAvailableTimesInput = z.infer<
  typeof SuggestAvailableTimesInputSchema
>;

const SuggestAvailableTimesOutputSchema = z.object({
  availableTimeSlots: z
    .array(z.string())
    .describe('An array of available time slots (HH:mm format).'),
});
export type SuggestAvailableTimesOutput = z.infer<
  typeof SuggestAvailableTimesOutputSchema
>;

export async function suggestAvailableTimes(
  input: SuggestAvailableTimesInput
): Promise<SuggestAvailableTimesOutput> {
  return suggestAvailableTimesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestAvailableTimesPrompt',
  input: {schema: SuggestAvailableTimesInputSchema},
  output: {schema: SuggestAvailableTimesOutputSchema},
  prompt: `You are a salon scheduling assistant. Given the service duration,
  staff availability, and preferred date, suggest a list of available time slots.

  Service Duration: {{serviceDuration}} minutes
  Staff Availability: {{{staffAvailability}}}
  Preferred Date: {{preferredDate}}

  Consider the staff availability and service duration to suggest realistic time slots.
  Respond with only available time slots in HH:mm format in an array.`,
});

const suggestAvailableTimesFlow = ai.defineFlow(
  {
    name: 'suggestAvailableTimesFlow',
    inputSchema: SuggestAvailableTimesInputSchema,
    outputSchema: SuggestAvailableTimesOutputSchema,
  },
  async input => {
    try {
      // Parse staffAvailability to ensure it's a valid JSON array.
      JSON.parse(input.staffAvailability);
    } catch (e: any) {
      throw new Error(
        'Invalid staffAvailability format.  Expected a JSON array of objects with start and end times.'
      );
    }

    const {output} = await prompt(input);
    return output!;
  }
);
