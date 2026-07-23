import { Stack } from 'expo-router';

export default function ModalsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Scanning is handed to the OS scanner; crop is our own full-screen stage */}
      <Stack.Screen name="crop" options={{ presentation: 'fullScreenModal' }} />
    </Stack>
  );
}
