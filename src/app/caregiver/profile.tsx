import { StyleSheet, Text, View } from "react-native";

export default function CaregiverProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Caregiver Profile</Text>

      <Text style={styles.item}>Name: Caregiver User</Text>

      <Text style={styles.item}>Email: caregiver@example.com</Text>
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
    marginBottom: 16,
  },
});
