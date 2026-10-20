import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { auth } from "../../config/firebase";
import { CheckInManager } from "../../managers/CheckInManager";
import { ReminderManager } from "../../managers/ReminderManager";
import { AuthPresenter } from "../../presenters/AuthPresenter";
import { DatabaseService } from "../../services/DatabaseService";
import { NotificationService } from "../../services/NotificationService";

type CheckInRecord = {
  id: string;
  elderlyUserId: string;
  status: string;
  timestamp?: {
    toDate: () => Date;
  };
};

const formatReminderTime = (time: string) => {
  const [hourText, minute] = time.split(":");
  const hour = Number(hourText);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minute} ${suffix}`;
};

const isToday = (date: Date) => {
  const today = new Date();

  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

const formatLastCheckIn = (date: Date) => {
  const time = date.toLocaleTimeString("en-NZ", {
    hour: "numeric",
    minute: "2-digit",
  });

  if (isToday(date)) {
    return `Today at ${time}`;
  }

  const formattedDate = date.toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return `${formattedDate} at ${time}`;
};

export default function ElderlyDashboard() {
  const authPresenter = new AuthPresenter();
  const checkInManager = new CheckInManager();
  const reminderManager = new ReminderManager();
  const databaseService = new DatabaseService();
  const notificationService = new NotificationService();

  const [submitting, setSubmitting] = useState(false);
  const [nextReminder, setNextReminder] = useState<string | null>(null);
  const [loadingReminder, setLoadingReminder] = useState(true);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState<Date | null>(null);
  const [loadingCheckInStatus, setLoadingCheckInStatus] = useState(true);

  /* --------------------------------------------------
     Load reminder schedule
  -------------------------------------------------- */

  useEffect(() => {
    const loadReminder = async () => {
      try {
        const user = auth.currentUser;

        if (!user) {
          setNextReminder(null);
          return;
        }

        const schedules = await databaseService.getReminderSchedule(user.uid);

        if (schedules.length === 0) {
          setNextReminder(null);
          return;
        }

        const reminderTimes = schedules.flatMap(
          (schedule: any) => schedule.times ?? [],
        );

        const next = reminderManager.getNextReminder(reminderTimes);

        setNextReminder(next);

        const permissionGranted =
          await notificationService.requestPermissions();

        if (permissionGranted) {
          await notificationService.cancelAllReminders();
          await notificationService.scheduleReminderTimes(reminderTimes);
        }
      } catch (error) {
        console.error("Unable to load reminder:", error);
        setNextReminder(null);
      } finally {
        setLoadingReminder(false);
      }
    };

    loadReminder();
  }, []);

  /* --------------------------------------------------
     Load current check-in status
  -------------------------------------------------- */

  useEffect(() => {
    const loadCheckInStatus = async () => {
      try {
        const user = auth.currentUser;

        if (!user) {
          setCheckedInToday(false);
          setLastCheckIn(null);
          return;
        }

        const records = (await databaseService.getCheckIns(
          user.uid,
        )) as CheckInRecord[];

        if (records.length === 0) {
          setCheckedInToday(false);
          setLastCheckIn(null);
          return;
        }

        const sortedRecords = [...records].sort((a, b) => {
          const aTime = a.timestamp?.toDate().getTime() ?? 0;
          const bTime = b.timestamp?.toDate().getTime() ?? 0;

          return bTime - aTime;
        });

        const completedRecords = sortedRecords.filter(
          (record) => record.status === "completed",
        );

        if (completedRecords.length === 0) {
          setCheckedInToday(false);
          setLastCheckIn(null);
          return;
        }

        const latestCompleted = completedRecords[0];
        const latestDate = latestCompleted.timestamp?.toDate();

        if (!latestDate) {
          setCheckedInToday(false);
          setLastCheckIn(null);
          return;
        }

        setLastCheckIn(latestDate);
        setCheckedInToday(isToday(latestDate));
      } catch (error) {
        console.error("Unable to load check-in status:", error);

        setCheckedInToday(false);
        setLastCheckIn(null);
      } finally {
        setLoadingCheckInStatus(false);
      }
    };

    loadCheckInStatus();
  }, []);

  /* --------------------------------------------------
     Complete check-in
  -------------------------------------------------- */

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

      const now = new Date();

      setLastCheckIn(now);
      setCheckedInToday(true);

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

  /* --------------------------------------------------
     Logout
  -------------------------------------------------- */

  const handleLogout = async () => {
    try {
      await authPresenter.logout();

      router.replace("/");
    } catch (error) {
      console.error(error);

      Alert.alert("Logout Failed", "Unable to log out. Please try again.");
    }
  };

  /* --------------------------------------------------
     Display values
  -------------------------------------------------- */

  const statusText = loadingCheckInStatus
    ? "Loading..."
    : checkedInToday
      ? "Checked in today"
      : "No check-in today";

  const reminderText = loadingReminder
    ? "Loading..."
    : nextReminder
      ? formatReminderTime(nextReminder)
      : "No reminder set";

  const lastCheckInText = loadingCheckInStatus
    ? "Loading last check-in..."
    : lastCheckIn
      ? `Last check-in: ${formatLastCheckIn(lastCheckIn)}`
      : "No previous check-ins";

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.topBar}>
        <View style={styles.topBarSpacer} />

        <Text style={styles.screenTitle} accessibilityRole="header">
          Wellbeing Check-in
        </Text>

        <Pressable
          style={styles.logoutButton}
          onPress={handleLogout}
          accessibilityRole="button"
          accessibilityLabel="Log out"
        >
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </Pressable>
      </View>

      <View style={styles.summaryRow}>
        <View
          style={styles.summaryCard}
          accessible
          accessibilityLabel={`Current status. ${statusText}`}
        >
          <Text style={styles.infoLabel}>Current Status</Text>

          <Text style={styles.infoValue}>{statusText}</Text>
        </View>

        <View
          style={styles.summaryCard}
          accessible
          accessibilityLabel={`Next check-in. ${reminderText}`}
        >
          <Text style={styles.infoLabel}>Next Check-in</Text>

          <Text style={styles.nextReminderValue}>{reminderText}</Text>
        </View>
      </View>

      <View style={styles.dashboardRow}>
        <View style={styles.questionCard}>
          <Text style={styles.questionTitle}>Question</Text>

          <View style={styles.questionBox}>
            <Text style={styles.questionText}>How are you feeling today?</Text>

            <Text style={styles.questionHint}>
              Tap the button when you are ready to check in.
            </Text>
          </View>
        </View>

        <View style={styles.actionColumn}>
          <Pressable
            style={[styles.okButton, submitting && styles.disabledButton]}
            onPress={handleCheckIn}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel={
              submitting
                ? "Saving check-in"
                : "I'm OK. Submit wellbeing check-in"
            }
            accessibilityHint="Records that you are okay today"
          >
            <Text style={styles.okButtonText}>
              {submitting ? "Saving..." : "I'M OK ✓"}
            </Text>
          </Pressable>

          <Pressable
            style={styles.historyButton}
            onPress={() => router.push("/elderly/history")}
            accessibilityRole="button"
            accessibilityLabel="View check-in history"
          >
            <Text style={styles.historyButtonText}>History</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.lastCheckIn} accessibilityLiveRegion="polite">
        {lastCheckInText}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 20,
    backgroundColor: "#F8F8F4",
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  topBarSpacer: {
    width: 90,
  },

  screenTitle: {
    flex: 1,
    fontSize: 30,
    fontWeight: "700",
    textAlign: "center",
    color: "#111111",
  },

  logoutButton: {
    minWidth: 90,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: "#BDBDBD",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },

  logoutButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222222",
  },

  summaryRow: {
    flexDirection: "row",
    gap: 14,
  },

  summaryCard: {
    flex: 1,
    minHeight: 110,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#D1D1D1",
    borderRadius: 16,
    padding: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  infoLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#444444",
    textAlign: "center",
  },

  infoValue: {
    marginTop: 8,
    fontSize: 23,
    fontWeight: "700",
    color: "#111111",
    textAlign: "center",
  },

  nextReminderValue: {
    marginTop: 8,
    fontSize: 27,
    fontWeight: "700",
    color: "#111111",
    textAlign: "center",
  },

  dashboardRow: {
    flexDirection: "row",
    gap: 14,
    alignItems: "stretch",
  },

  questionCard: {
    flex: 1.5,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#D1D1D1",
    borderRadius: 16,
    padding: 16,
  },

  questionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 12,
    textAlign: "center",
  },

  questionBox: {
    flex: 1,
    minHeight: 220,
    borderWidth: 2,
    borderColor: "#D8D8D8",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FAFAFA",
  },

  questionText: {
    fontSize: 30,
    fontWeight: "700",
    color: "#111111",
    textAlign: "center",
  },

  questionHint: {
    fontSize: 18,
    lineHeight: 26,
    color: "#555555",
    textAlign: "center",
    marginTop: 14,
  },

  actionColumn: {
    flex: 1,
    justifyContent: "center",
    gap: 16,
  },

  okButton: {
    minHeight: 150,
    borderRadius: 16,
    backgroundColor: "#4E9F3D",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 20,
  },

  disabledButton: {
    opacity: 0.6,
  },

  okButtonText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },

  historyButton: {
    minHeight: 58,
    borderWidth: 2,
    borderColor: "#BDBDBD",
    borderRadius: 12,
    backgroundColor: "#EFEFEF",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  historyButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111111",
  },

  lastCheckIn: {
    fontSize: 18,
    lineHeight: 26,
    color: "#333333",
    textAlign: "center",
  },
});
