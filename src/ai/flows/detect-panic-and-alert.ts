'use server';
/**
 * @fileOverview This file defines a Genkit flow for detecting panic or distress in a video feed and triggering appropriate alerts.
 *
 * - detectPanicAndAlert -  detects panic in a video stream and triggers alerts.
 * - DetectPanicAndAlertInput - The input type for the detectPanicAndAlert function.
 * - DetectPanicAndAlertOutput - The return type for the detectPanicAndAlert function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectPanicAndAlertInputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      "A video feed as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DetectPanicAndAlertInput = z.infer<typeof DetectPanicAndAlertInputSchema>;

const DetectPanicAndAlertOutputSchema = z.object({
  panicDetected: z.boolean().describe('Whether panic or distress is detected in the video.'),
  alertLevel: z
    .enum(['low', 'medium', 'high'])
    .describe('The level of alert based on the detected panic.'),
  actionsTaken: z
    .array(z.string())
    .describe('A list of actions taken, such as taking a screenshot or initiating recording.'),
});
export type DetectPanicAndAlertOutput = z.infer<typeof DetectPanicAndAlertOutputSchema>;

export async function detectPanicAndAlert(input: DetectPanicAndAlertInput): Promise<DetectPanicAndAlertOutput> {
  return detectPanicAndAlertFlow(input);
}

const panicDetectionPrompt = ai.definePrompt({
  name: 'panicDetectionPrompt',
  input: {schema: DetectPanicAndAlertInputSchema},
  output: {schema: DetectPanicAndAlertOutputSchema},
  prompt: `You are an AI safety assistant designed to analyze video streams and detect potential danger or distress.

  Analyze the provided video feed and determine if there are indicators of panic, distress, or danger.

  Based on your analysis, set the 'panicDetected' field to true if panic is detected, and provide an appropriate 'alertLevel' (low, medium, or high).

  Also, populate the 'actionsTaken' field with a list of actions that should be taken based on the detected panic level. Possible actions include:
  - "take_screenshot"
  - "initiate_recording"
  - "share_alert_with_authorities"

  Video Feed: {{media url=videoDataUri}}
  `,
});

const detectPanicAndAlertFlow = ai.defineFlow(
  {
    name: 'detectPanicAndAlertFlow',
    inputSchema: DetectPanicAndAlertInputSchema,
    outputSchema: DetectPanicAndAlertOutputSchema,
  },
  async input => {
    const {output} = await panicDetectionPrompt(input);
    return output!;
  }
);
