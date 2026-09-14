import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import LargeButton from "../../components/LargeButton";

export default function CaregiverDashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Caregiver Dashboard</Text>

      <View style={styles.card}>
        <Text style={styles.name}>Elderly User</Text>
        <Text style={styles.status}>✓ Checked in</Text>

        <Text style={styles.info}>Last check-in: Today at 8:00 AM</Text>

        <Text style={styles.info}>Next check-in: 10:00 AM</Text>
      </View>

      <LargeButton
        title="Reminder Schedule"
        onPress={() => router.push("/caregiver/schedule")}
      />

      <LargeButton
        title="Check-in History"
        onPress={() => router.push("/caregiver/history")}
      />

      <LargeButton
        title="Profile"
        onPress={() => router.push("/caregiver/profile")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 28,
    gap: 20,
    backgroundColor: "#FFFFFF",
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 10,
  },

  card: {
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 12,
    padding: 20,
    gap: 10,
  },

  name: {
    fontSize: 24,
    fontWeight: "600",
  },

  status: {
    fontSize: 22,
  },

  info: {
    fontSize: 18,
  },
});
