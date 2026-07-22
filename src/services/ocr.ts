/**
 * On-device OCR via ML Kit text recognition (Google's on-device model — nothing
 * leaves the phone). Feature code goes through this interface; the review screen
 * runs it over captured pages to auto-classify and pre-fill fields.
 */

import TextRecognition from '@react-native-ml-kit/text-recognition';

export async function recognizeText(uri: string): Promise<{ text: string }> {
  if (!uri) return { text: '' };
  try {
    const result = await TextRecognition.recognize(uri);
    return { text: result?.text ?? '' };
  } catch {
    // Recognition unavailable or failed — fall back to no text (manual entry).
    return { text: '' };
  }
}
