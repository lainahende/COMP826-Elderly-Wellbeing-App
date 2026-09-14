import { router } from "expo-router";
import { Button, StyleSheet, Text, View } from "react-native";

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Elderly Wellbeing</Text>

      <Button
        title="Open Elderly Dashboard"
        onPress={() => router.push("/elderly/dashboard")}
      />

      <Button
        title="Open Caregiver Dashboard"
        onPress={() => router.push("/caregiver/dashboard")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    gap: 20,
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
  },
});
