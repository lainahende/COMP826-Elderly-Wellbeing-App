import { router } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import LargeButton from "../../components/LargeButton";
import { auth } from "../../config/firebase";
import { CheckInManager } from "../../managers/CheckInManager";
import { AuthPresenter } from "../../presenters/AuthPresenter";

export default function ElderlyDashboard() {
  const authPresenter = new AuthPresenter();
  const checkInManager = new CheckInManager();

  const [submitting, setSubmitting] = useState(false);

  const handleCheckIn = async () => {
    if (submitting) {
      return;
    }

    try {
      setSubmitting(true);

      const user = auth.currentUser;

      if (!user) {
        Alert.alert(
          "Check-in Failed",
          "You must be logged in to complete a check-in.",
        );
        return;
      }

      await checkInManager.completeCheckIn(user.uid);

      Alert.alert(
        "Check-in Complete",
        "Your wellbeing check-in has been recorded.",
      );
    } catch (error) {
      console.error(error);

      Alert.alert(
        "Check-in Failed",
        "Unable to complete your check-in. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authPresenter.logout();

      router.replace("/");
    } catch (error) {
      console.error(error);

      Alert.alert("Logout Failed", "Unable to log out. Please try again.");
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Good Morning</Text>

      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Current Status</Text>

        <Text style={styles.statusValue}>✓ Checked in today</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Next Check-in</Text>

        <Text style={styles.time}>10:00 AM</Text>
      </View>

      <Text style={styles.question}>How are you?</Text>

      <LargeButton
        title={submitting ? "Saving..." : "I'M OK ✓"}
        onPress={handleCheckIn}
        disabled={submitting}
      />

      <Text style={styles.lastCheckIn}>Last check-in: Today at 8:00 AM</Text>

      <LargeButton
        title="View Check-in History"
        onPress={() => router.push("/elderly/history")}
      />

      <LargeButton title="Log Out" onPress={handleLogout} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 28,
    gap: 24,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
  },

  title: {
    fontSize: 34,
    fontWeight: "bold",
    textAlign: "center",
  },

  statusCard: {
    alignItems: "center",
    padding: 20,
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 12,
  },

  statusLabel: {
    fontSize: 20,
  },

  statusValue: {
    fontSize: 24,
    fontWeight: "600",
    marginTop: 8,
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
