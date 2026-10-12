import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

import LargeButton from "../../components/LargeButton";
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

        const latest = sortedRecords[0];

        const latestDate = latest.timestamp?.toDate();

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

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Good Morning</Text>

      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Current Status</Text>

        <Text style={styles.statusValue}>
          {loadingCheckInStatus
            ? "Loading..."
            : checkedInToday
              ? "✓ Checked in today"
              : "No check-in today"}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Next Check-in</Text>

        <Text style={styles.time}>
          {loadingReminder
            ? "Loading..."
            : nextReminder
              ? formatReminderTime(nextReminder)
              : "No reminder set"}
        </Text>
      </View>

      <Text style={styles.question}>How are you?</Text>

      <LargeButton
        title={submitting ? "Saving..." : "I'M OK ✓"}
        onPress={handleCheckIn}
        disabled={submitting}
      />

      <Text style={styles.lastCheckIn}>
        {loadingCheckInStatus
          ? "Loading last check-in..."
          : lastCheckIn
            ? `Last check-in: ${formatLastCheckIn(lastCheckIn)}`
            : "No previous check-ins"}
      </Text>

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
    textAlign: "center",
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
