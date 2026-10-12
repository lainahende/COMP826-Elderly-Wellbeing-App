import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import LargeButton from "../../components/LargeButton";
import { auth } from "../../config/firebase";
import { DatabaseService } from "../../services/DatabaseService";

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
     Render
  -------------------------------------------------- */

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.message}>Loading reminder schedule...</Text>
      </View>
    );
  }

  if (!elderlyUserId) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>Reminder Schedule</Text>

        <Text style={styles.message}>
          No elderly user is linked to this caregiver account.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Reminder Schedule</Text>

      <Text style={styles.instructions}>
        Add wellbeing reminder times using 24-hour format.
      </Text>

      <View style={styles.inputRow}>
        <TextInput
          value={newTime}
          onChangeText={setNewTime}
          placeholder="08:30"
          keyboardType="numbers-and-punctuation"
          style={styles.input}
          accessibilityLabel="Reminder time"
        />

        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddReminder}
          accessibilityRole="button"
          accessibilityLabel="Add reminder"
        >
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        {reminderTimes.length === 0 ? (
          <Text style={styles.message}>No reminders configured.</Text>
        ) : (
          reminderTimes.map((time) => (
            <View key={time} style={styles.reminderRow}>
              <Text style={styles.reminderTime}>{time}</Text>

              <TouchableOpacity
                onPress={() => handleDeleteReminder(time)}
                accessibilityRole="button"
                accessibilityLabel={`Delete reminder ${time}`}
              >
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      <LargeButton
        title={saving ? "Saving..." : "Save Schedule"}
        onPress={handleSave}
        disabled={saving}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 28,
    gap: 24,
    backgroundColor: "#FFFFFF",
  },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 28,
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
  },

  instructions: {
    fontSize: 18,
    textAlign: "center",
  },

  inputRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },

  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#AAA",
    borderRadius: 10,
    padding: 14,
    fontSize: 20,
  },

  addButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#333",
  },

  addButtonText: {
    fontSize: 18,
    fontWeight: "600",
  },

  listContainer: {
    gap: 12,
  },

  reminderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 10,
  },

  reminderTime: {
    fontSize: 22,
    fontWeight: "600",
  },

  deleteText: {
    fontSize: 17,
    fontWeight: "600",
  },

  message: {
    fontSize: 18,
    textAlign: "center",
  },
});
