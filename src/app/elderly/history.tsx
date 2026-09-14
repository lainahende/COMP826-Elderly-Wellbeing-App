import { StyleSheet, Text, View } from "react-native";

export default function ElderlyHistoryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Check-in History</Text>

      <Text style={styles.item}>Today - 8:00 AM ✓</Text>
      <Text style={styles.item}>Yesterday - 8:04 PM ✓</Text>
      <Text style={styles.item}>Yesterday - 10:01 AM ✓</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 28,
    backgroundColor: "#FFFFFF",
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 24,
  },

  item: {
    fontSize: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#DDD",
  },
});
