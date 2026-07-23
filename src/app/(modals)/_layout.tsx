import { Stack } from 'expo-router';

export default function ModalsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Camera and crop are full-screen experiences, not card modals */}
      <Stack.Screen name="camera" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="crop" options={{ presentation: 'fullScreenModal' }} />
    </Stack>
  );
}
