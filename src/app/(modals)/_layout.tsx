import { Stack } from 'expo-router';

export default function ModalsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* scan is a full-screen camera experience, not a card modal */}
      <Stack.Screen name="scan" options={{ presentation: 'fullScreenModal' }} />
    </Stack>
  );
}
