import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import LargeButton from "../../components/LargeButton";
import { auth } from "../../config/firebase";
import { MissedCheckInManager } from "../../managers/MissedCheckInManager";
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

type ElderlyProfile = {
  id: string;
  name?: string;
  email?: string;
  role?: string;
};

const isToday = (date: Date) => {
  const today = new Date();

  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

const formatTime = (date: Date) =>
  date.toLocaleTimeString("en-NZ", {
    hour: "numeric",
    minute: "2-digit",
  });

const formatReminderTime = (time: string) => {
  const [hourText, minute] = time.split(":");

  const hour = Number(hourText);

  const suffix = hour >= 12 ? "PM" : "AM";

  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minute} ${suffix}`;
};

export default function CaregiverDashboard() {
  const databaseService = new DatabaseService();

  const reminderManager = new ReminderManager();

  const missedCheckInManager = new MissedCheckInManager();

  const notificationService = new NotificationService();

  const authPresenter = new AuthPresenter();

  const [loading, setLoading] = useState(true);

  const [elderlyProfile, setElderlyProfile] = useState<ElderlyProfile | null>(
    null,
  );

  const [checkedInToday, setCheckedInToday] = useState(false);

  const [lastCheckIn, setLastCheckIn] = useState<Date | null>(null);

  const [nextReminder, setNextReminder] = useState<string | null>(null);

  const seenMissedCheckInIds = useRef<Set<string>>(new Set());

  const initialSnapshotReceived = useRef(false);

  useEffect(() => {
    let unsubscribeCheckIns: (() => void) | undefined;

    const loadDashboard = async () => {
      try {
        const caregiver = auth.currentUser;

        if (!caregiver) {
          return;
        }

        const elderlyUserId = await databaseService.getLinkedElderlyUserId(
          caregiver.uid,
        );

        if (!elderlyUserId) {
          setElderlyProfile(null);

          return;
        }

        /* ------------------------------------------
             Load elderly profile
          ------------------------------------------ */

        const profile = await databaseService.getUserProfile(elderlyUserId);

        setElderlyProfile(profile as ElderlyProfile | null);

        /* ------------------------------------------
             Subscribe to real-time check-ins
          ------------------------------------------ */

        unsubscribeCheckIns = databaseService.subscribeToCheckIns(
          elderlyUserId,
          async (checkIns) => {
            const records = checkIns as CheckInRecord[];

            /* ------------------------------------------
                     Detect new missed check-ins
                  ------------------------------------------ */

            const missedRecords = records.filter(
              (checkIn) => checkIn.status === "missed",
            );

            if (!initialSnapshotReceived.current) {
              missedRecords.forEach((record) => {
                seenMissedCheckInIds.current.add(record.id);
              });

              initialSnapshotReceived.current = true;
            } else {
              const newMissedRecords = missedRecords.filter(
                (record) => !seenMissedCheckInIds.current.has(record.id),
              );

              for (const record of newMissedRecords) {
                seenMissedCheckInIds.current.add(record.id);

                const permissionGranted =
                  await notificationService.requestPermissions();

                if (permissionGranted) {
                  await notificationService.sendMissedCheckInNotification();
                }
              }
            }

            /* ------------------------------------------
                     Existing dashboard status logic
                  ------------------------------------------ */

            if (records.length === 0) {
              setLastCheckIn(null);

              setCheckedInToday(false);

              return;
            }

            const sorted = [...records].sort((a, b) => {
              const aTime = a.timestamp?.toDate().getTime() ?? 0;

              const bTime = b.timestamp?.toDate().getTime() ?? 0;

              return bTime - aTime;
            });

            const latest = sorted[0].timestamp?.toDate();

            if (!latest) {
              setLastCheckIn(null);

              setCheckedInToday(false);

              return;
            }

            setLastCheckIn(latest);

            setCheckedInToday(
              isToday(latest) && sorted[0].status === "completed",
            );
          },
        );

        /* ------------------------------------------
             Load reminder schedule
          ------------------------------------------ */

        const schedules =
          await databaseService.getReminderSchedule(elderlyUserId);

        const reminderTimes = schedules.flatMap(
          (schedule: any) => schedule.times ?? [],
        );

        const next = reminderManager.getNextReminder(reminderTimes);

        setNextReminder(next);

        /* ------------------------------------------
             Process missed reminders
          ------------------------------------------ */

        const existingCheckIns = (await databaseService.getCheckIns(
          elderlyUserId,
        )) as CheckInRecord[];

        const completedCheckIns = existingCheckIns
          .filter((checkIn) => checkIn.status === "completed")
          .map((checkIn) => checkIn.timestamp?.toDate())
          .filter((date): date is Date => date !== undefined);

        await missedCheckInManager.processMissedReminders(
          elderlyUserId,
          reminderTimes,
          completedCheckIns,
        );
      } catch (error) {
        console.error("Unable to load caregiver dashboard:", error);

        Alert.alert(
          "Unable to Load",
          "The caregiver dashboard could not be loaded.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      if (unsubscribeCheckIns) {
        unsubscribeCheckIns();
      }
    };
  }, []);

  const handleLogout = async () => {
    try {
      await authPresenter.logout();

      router.replace("/");
    } catch (error) {
      console.error(error);

      Alert.alert("Logout Failed", "Unable to log out. Please try again.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!elderlyProfile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.title}>Caregiver Dashboard</Text>

        <Text style={styles.message}>
          No elderly user is linked to this caregiver account.
        </Text>

        <LargeButton title="Log Out" onPress={handleLogout} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Caregiver Dashboard</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Elderly Profile</Text>

        <Text style={styles.profileName}>
          {elderlyProfile.name ?? "Elderly User"}
        </Text>

        {elderlyProfile.email && (
          <Text style={styles.subText}>{elderlyProfile.email}</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Current Wellbeing Status</Text>

        <Text style={styles.statusValue}>
          {checkedInToday ? "✓ Checked in today" : "No check-in today"}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Last Check-in</Text>

        <Text style={styles.value}>
          {lastCheckIn
            ? isToday(lastCheckIn)
              ? `Today at ${formatTime(lastCheckIn)}`
              : lastCheckIn.toLocaleString("en-NZ", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })
            : "No previous check-ins"}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Next Scheduled Reminder</Text>

        <Text style={styles.value}>
          {nextReminder ? formatReminderTime(nextReminder) : "No reminder set"}
        </Text>
      </View>

      <LargeButton
        title="View Check-in History"
        onPress={() => router.push("/caregiver/history")}
      />

      <LargeButton
        title="Manage Reminder Schedule"
        onPress={() => router.push("/caregiver/schedule")}
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
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 28,
    gap: 20,
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
  },

  card: {
    padding: 20,
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 12,
  },

  label: {
    fontSize: 18,
    fontWeight: "600",
  },

  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 8,
  },

  statusValue: {
    fontSize: 22,
    fontWeight: "600",
    marginTop: 8,
  },

  value: {
    fontSize: 22,
    marginTop: 8,
  },

  subText: {
    fontSize: 16,
    marginTop: 4,
  },

  message: {
    fontSize: 18,
    textAlign: "center",
  },
});
