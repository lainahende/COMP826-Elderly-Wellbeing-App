import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Login" }} />

      <Stack.Screen
        name="elderly/dashboard"
        options={{ title: "Elderly Dashboard" }}
      />

      <Stack.Screen
        name="caregiver/dashboard"
        options={{ title: "Caregiver Dashboard" }}
      />
    </Stack>
  );
}
