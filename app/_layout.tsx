import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: "Nightlife Navigator",
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="(tabs)" 
        options={{ headerShown: false }} 
      />
    </Stack>
  );
}