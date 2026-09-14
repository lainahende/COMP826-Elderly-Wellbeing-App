import { StyleSheet, Text, View } from "react-native";

export default function CaregiverDashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Caregiver Dashboard</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
  },
});
