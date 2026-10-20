import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import LargeButton from "../../components/LargeButton";
import { auth } from "../../config/firebase";
import { DatabaseService } from "../../services/DatabaseService";

const formatReminderTime = (time: string) => {
  const [hourText, minute] = time.split(":");
  const hour = Number(hourText);

  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minute} ${suffix}`;
};

export default function CaregiverSchedule() {
  const databaseService = new DatabaseService();

  const [elderlyUserId, setElderlyUserId] = useState<string | null>(null);

  const [reminderTimes, setReminderTimes] = useState<string[]>([]);

  const [newTime, setNewTime] = useState("");

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  /* --------------------------------------------------
     Load linked elderly user's reminders
  -------------------------------------------------- */

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const caregiver = auth.currentUser;

        if (!caregiver) {
          return;
        }

        const linkedElderlyUserId =
          await databaseService.getLinkedElderlyUserId(caregiver.uid);

        if (!linkedElderlyUserId) {
          setElderlyUserId(null);
          return;
        }

        setElderlyUserId(linkedElderlyUserId);

        const schedules =
          await databaseService.getReminderSchedule(linkedElderlyUserId);

        if (schedules.length === 0) {
          setReminderTimes([]);
          return;
        }

        const times = schedules.flatMap(
          (schedule: any) => schedule.times ?? [],
        );

        setReminderTimes([...times].sort());
      } catch (error) {
        console.error("Unable to load reminder schedule:", error);

        Alert.alert(
          "Unable to Load",
          "The reminder schedule could not be loaded.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadSchedule();
  }, []);

  /* --------------------------------------------------
     Validate HH:mm time
  -------------------------------------------------- */

  const isValidTime = (time: string) => {
    const pattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

    return pattern.test(time);
  };

  /* --------------------------------------------------
     Add reminder
  -------------------------------------------------- */

  const handleAddReminder = () => {
    const trimmedTime = newTime.trim();

    if (!isValidTime(trimmedTime)) {
      Alert.alert(
        "Invalid Time",
        "Enter the time using 24-hour HH:mm format, for example 08:30.",
      );

      return;
    }

    if (reminderTimes.includes(trimmedTime)) {
      Alert.alert("Duplicate Reminder", "This reminder time already exists.");

      return;
    }

    setReminderTimes([...reminderTimes, trimmedTime].sort());

    setNewTime("");
  };

  /* --------------------------------------------------
     Delete reminder
  -------------------------------------------------- */

  const handleDeleteReminder = (time: string) => {
    setReminderTimes(reminderTimes.filter((item) => item !== time));
  };

  /* --------------------------------------------------
     Save reminder schedule
  -------------------------------------------------- */

  const handleSave = async () => {
    if (!elderlyUserId) {
      Alert.alert(
        "Unable to Save",
        "No elderly user is linked to this caregiver account.",
      );

      return;
    }

    try {
      setSaving(true);

      await databaseService.saveReminderSchedule(elderlyUserId, reminderTimes);

      Alert.alert(
        "Schedule Saved",
        "The wellbeing reminder schedule has been updated.",
      );
    } catch (error) {
      console.error("Unable to save reminder schedule:", error);

      Alert.alert(
        "Save Failed",
        "The reminder schedule could not be saved. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  /* --------------------------------------------------
     Loading
  -------------------------------------------------- */

  if (loading) {
    return (
      <View
        style={styles.centerContainer}
        accessible
        accessibilityLabel="Loading reminder schedule"
      >
        <Text style={styles.loadingText}>Loading reminder schedule...</Text>
      </View>
    );
  }

  /* --------------------------------------------------
     No linked elderly user
  -------------------------------------------------- */

  if (!elderlyUserId) {
    return (
      <View style={styles.noLinkContainer}>
        <View style={styles.topBar}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backButtonText}>‹ Back</Text>
          </Pressable>

          <Text style={styles.title} accessibilityRole="header">
            Reminder Schedule
          </Text>
        </View>

        <View style={styles.noLinkCard}>
          <Text style={styles.noLinkTitle}>No Linked User</Text>

          <Text style={styles.message}>
            No elderly user is linked to this caregiver account.
          </Text>
        </View>
      </View>
    );
  }

  /* --------------------------------------------------
     Main screen
  -------------------------------------------------- */

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.topBar}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back to caregiver dashboard"
        >
          <Text style={styles.backButtonText}>‹ Back</Text>
        </Pressable>

        <Text style={styles.title} accessibilityRole="header">
          Reminder Schedule
        </Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Add a reminder</Text>

        <Text style={styles.instructions}>
          Enter a time using 24-hour format, for example 08:30 or 18:00.
        </Text>

        <View style={styles.inputRow}>
          <TextInput
            value={newTime}
            onChangeText={setNewTime}
            placeholder="08:30"
            placeholderTextColor="#777777"
            keyboardType="numbers-and-punctuation"
            style={styles.input}
            maxLength={5}
            accessibilityLabel="Reminder time"
            accessibilityHint="Enter a time using 24-hour format"
          />

          <Pressable
            style={styles.addButton}
            onPress={handleAddReminder}
            accessibilityRole="button"
            accessibilityLabel="Add reminder"
          >
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.scheduleSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle} accessibilityRole="header">
            Reminder Times
          </Text>

          <Text style={styles.reminderCount}>{reminderTimes.length}</Text>
        </View>

        {reminderTimes.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No reminders configured</Text>

            <Text style={styles.emptyText}>
              Add a reminder time above to create the wellbeing schedule.
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {reminderTimes.map((time) => (
              <View
                key={time}
                style={styles.reminderRow}
                accessible
                accessibilityLabel={`Reminder at ${formatReminderTime(time)}`}
              >
                <View style={styles.timeContainer}>
                  <Text style={styles.reminderTime}>
                    {formatReminderTime(time)}
                  </Text>

                  <Text style={styles.reminderTime24}>{time}</Text>
                </View>

                <Pressable
                  style={styles.deleteButton}
                  onPress={() => handleDeleteReminder(time)}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete reminder ${formatReminderTime(
                    time,
                  )}`}
                >
                  <Text style={styles.deleteText}>Delete</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.saveSection}>
        <LargeButton
          title={saving ? "Saving..." : "Save Schedule"}
          onPress={handleSave}
          disabled={saving}
        />

        <Text style={styles.saveHint}>
          Changes are not applied until you save the schedule.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 28,
    gap: 16,
    backgroundColor: "#F8F8F4",
  },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F8F8F4",
  },

  loadingText: {
    fontSize: 18,
    color: "#333333",
    textAlign: "center",
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  backButton: {
    minWidth: 76,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
    borderWidth: 2,
    borderColor: "#BDBDBD",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },

  backButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222222",
  },

  title: {
    flex: 1,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
    color: "#111111",
  },

  infoCard: {
    padding: 16,
    borderWidth: 2,
    borderColor: "#D1D1D1",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },

  infoTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111111",
  },

  instructions: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 22,
    color: "#555555",
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
  },

  input: {
    flex: 1,
    minHeight: 52,
    borderWidth: 2,
    borderColor: "#BDBDBD",
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 20,
    color: "#111111",
    backgroundColor: "#FFFFFF",
  },

  addButton: {
    minWidth: 72,
    minHeight: 52,
    borderRadius: 10,
    backgroundColor: "#4E9F3D",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },

  addButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  scheduleSection: {
    gap: 12,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111111",
  },

  reminderCount: {
    minWidth: 34,
    minHeight: 34,
    borderRadius: 17,
    backgroundColor: "#E7F4E4",
    color: "#286C1D",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    textAlignVertical: "center",
    paddingTop: 6,
  },

  listContainer: {
    gap: 10,
  },

  reminderRow: {
    minHeight: 76,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: "#D1D1D1",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },

  timeContainer: {
    flex: 1,
  },

  reminderTime: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111111",
  },

  reminderTime24: {
    marginTop: 2,
    fontSize: 14,
    color: "#666666",
  },

  deleteButton: {
    minWidth: 76,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: "#C94A4A",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },

  deleteText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#9D2929",
  },

  emptyCard: {
    padding: 22,
    borderWidth: 2,
    borderColor: "#D1D1D1",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#111111",
    textAlign: "center",
  },

  emptyText: {
    marginTop: 7,
    fontSize: 15,
    lineHeight: 22,
    color: "#555555",
    textAlign: "center",
  },

  saveSection: {
    marginTop: 4,
    gap: 8,
  },

  saveHint: {
    fontSize: 14,
    lineHeight: 20,
    color: "#666666",
    textAlign: "center",
  },

  noLinkContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 28,
    gap: 24,
    backgroundColor: "#F8F8F4",
  },

  noLinkCard: {
    marginTop: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: "#D1D1D1",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },

  noLinkTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111111",
    textAlign: "center",
  },

  message: {
    marginTop: 10,
    fontSize: 17,
    lineHeight: 24,
    color: "#555555",
    textAlign: "center",
  },
});
