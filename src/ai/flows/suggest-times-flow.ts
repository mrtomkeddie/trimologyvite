
'use server';
/**
 * @fileOverview An AI flow to suggest optimal booking times.
 *
 * - suggestTimes - A function that suggests available time slots.
 * - SuggestTimesInput - The input type for the suggestTimes function.
 * - SuggestTimesOutput - The return type for the suggestTimes function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { format } from 'date-fns';

const SuggestTimesInputSchema = z.object({
  duration: z.number().describe('The duration of the service in minutes.'),
  date: z.string().describe('The requested date in "yyyy-MM-dd" format.'),
  workingHours: z.object({
    start: z.string().describe('The start of the workday, e.g., "09:00".'),
    end: z.string().describe('The end of the workday, e.g., "17:00".'),
  }),
  existingBookings: z.array(z.object({
    time: z.string().describe('Start time of an existing booking, e.g., "10:30".'),
    duration: z.number().describe('Duration of the existing booking in minutes.'),
  })),
});
export type SuggestTimesInput = z.infer<typeof SuggestTimesInputSchema>;

const SuggestTimesOutputSchema = z.object({
  times: z.array(z.string()).describe('An array of available start times in "HH:mm" format, sorted chronologically.'),
});
export type SuggestTimesOutput = z.infer<typeof SuggestTimesOutputSchema>;

// Exported wrapper function to be called by server actions
export async function suggestTimes(input: SuggestTimesInput): Promise<SuggestTimesOutput> {
  // Provide current date and time context to the prompt
  const now = new Date();
  const context = {
    ...input,
    currentDate: format(now, 'yyyy-MM-dd'),
    currentTime: format(now, 'HH:mm'),
  };
  const { output } = await suggestTimesFlow(context);
  return output || { times: [] };
}

const suggestTimesPrompt = ai.definePrompt({
  name: 'suggestTimesPrompt',
  input: { schema: SuggestTimesInputSchema.extend({
      currentDate: z.string(),
      currentTime: z.string(),
  }) },
  output: { schema: SuggestTimesOutputSchema },
  prompt: `
    You are an intelligent scheduling assistant for a salon.
    A client wants to book a service that lasts for {{duration}} minutes on {{date}}.

    The staff member's working hours on this day are from {{workingHours.start}} to {{workingHours.end}}.
    They already have the following bookings:
    {{#if existingBookings.length}}
      {{#each existingBookings}}
      - A {{duration}} minute booking at {{time}}.
      {{/each}}
    {{else}}
      No existing bookings.
    {{/if}}

    Your task is to generate a list of all possible start times for the new {{duration}}-minute service.

    Follow these rules strictly:
    1.  Generate potential start times at 15-minute intervals (e.g., 09:00, 09:15, 09:30).
    2.  A new appointment must start and end completely within the working hours.
    3.  A new appointment cannot overlap with any existing bookings. An existing booking at 10:00 for 30 minutes occupies the slot from 10:00 to 10:30. A new appointment cannot start at 10:00 or 10:15, but it could start at 09:30 if it ends by 10:00.
    4.  If the requested date {{date}} is the same as the current date ({{currentDate}}), do not suggest any times that are before the current time ({{currentTime}}).

    Return a JSON object with a key "times" containing an array of all available start time strings in "HH:mm" format, sorted chronologically. If no slots are available, return an empty array.
  `,
});

const suggestTimesFlow = ai.defineFlow(
  {
    name: 'suggestTimesFlow',
    inputSchema: SuggestTimesInputSchema.extend({
        currentDate: z.string(),
        currentTime: z.string(),
    }),
    outputSchema: SuggestTimesOutputSchema,
  },
  async (input) => {
    const { output } = await suggestTimesPrompt(input);
    return output!;
  }
);
