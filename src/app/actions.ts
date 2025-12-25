
'use server';

import { detectPanicAndAlert, type DetectPanicAndAlertOutput } from '@/ai/flows/detect-panic-and-alert';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export async function runPanicDetection(videoDataUri: string): Promise<DetectPanicAndAlertOutput> {
  // In a real application, you would pass the actual video data URI.
  // For this demo, we use a placeholder to avoid needing a live camera feed.
  // The AI flow is designed to work with data URIs, so we will use the placeholder image URI.
  // This is a conceptual demonstration.
  const placeholderImage = PlaceHolderImages.find(img => img.id === 'keychain-view');

  try {
    // To properly simulate, we'd fetch the image, convert to base64, and create a data URI.
    // However, to keep the demo simple and avoid CORS/network issues in this environment,
    // we will mock the AI response based on a random factor.
    
    // This simulates a successful call to the Genkit flow.
    // To test the real flow, you would need to pass a valid `videoDataUri`.
    // const result = await detectPanicAndAlert({ videoDataUri: placeholderImage!.imageUrl });
    // return result;

    const random = Math.random();
    if (random < 0.33) {
      return {
        panicDetected: true,
        alertLevel: 'high',
        actionsTaken: ['share_alert_with_authorities', 'initiate_recording'],
      };
    } else if (random < 0.66) {
      return {
        panicDetected: true,
        alertLevel: 'medium',
        actionsTaken: ['take_screenshot', 'initiate_recording'],
      };
    } else {
       return {
        panicDetected: false,
        alertLevel: 'low',
        actionsTaken: [],
      };
    }

  } catch (error) {
    console.error('Error during panic detection:', error);
    return {
      panicDetected: false,
      alertLevel: 'low',
      actionsTaken: ['Error during analysis.'],
    };
  }
}
