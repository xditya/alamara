/**
 * On-device OCR. MOCK for now — later backed by ML Kit (Android) / VisionKit (iOS)
 * via react-native-vision-camera. Feature code must go through this interface.
 */

export function recognizeText(_uri: string): Promise<{ text: string }> {
  return Promise.resolve({ text: '' });
}
