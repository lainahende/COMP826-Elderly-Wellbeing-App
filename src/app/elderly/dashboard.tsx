import { router } from "expo-router";
import { Alert, StyleSheet, Text, View } from "react-native";
import LargeButton from "../../components/LargeButton";

export default function ElderlyDashboard() {
  const handleCheckIn = () => {
    Alert.alert(
      "Check-in Complete",
      "Your wellbeing check-in has been recorded.",
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Good Morning</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Next Check-in</Text>
        <Text style={styles.time}>10:00 AM</Text>
      </View>

      <Text style={styles.question}>How are you?</Text>

      <LargeButton title="I'M OK ✓" onPress={handleCheckIn} />

      <Text style={styles.lastCheckIn}>Last check-in: Today at 8:00 AM</Text>

      <LargeButton
        title="View Check-in History"
        onPress={() => router.push("/elderly/history")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 28,
    justifyContent: "center",
    gap: 24,
    backgroundColor: "#FFFFFF",
  },

  title: {
    fontSize: 34,
    fontWeight: "bold",
    textAlign: "center",
  },

  card: {
    alignItems: "center",
    padding: 20,
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 12,
  },

  label: {
    fontSize: 20,
  },

  time: {
    fontSize: 30,
    fontWeight: "bold",
    marginTop: 6,
  },

  question: {
    fontSize: 28,
    fontWeight: "600",
    textAlign: "center",
  },

  lastCheckIn: {
    fontSize: 18,
    textAlign: "center",
  },
});
