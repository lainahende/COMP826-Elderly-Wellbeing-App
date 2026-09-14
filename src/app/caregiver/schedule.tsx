import { StyleSheet, Text, View } from "react-native";

export default function CaregiverScheduleScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reminder Schedule</Text>

      <Text style={styles.item}>Morning: 8:00 AM</Text>
      <Text style={styles.item}>Afternoon: 2:00 PM</Text>
      <Text style={styles.item}>Evening: 8:00 PM</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 28,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 24,
  },

  item: {
    fontSize: 20,
    paddingVertical: 14,
  },
});
