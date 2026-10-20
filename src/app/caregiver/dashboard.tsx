import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

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

const formatLastCheckIn = (date: Date) => {
  if (isToday(date)) {
    return `Today at ${formatTime(date)}`;
  }

  return date.toLocaleString("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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

        const profile = await databaseService.getUserProfile(elderlyUserId);

        setElderlyProfile(profile as ElderlyProfile | null);

        unsubscribeCheckIns = databaseService.subscribeToCheckIns(
          elderlyUserId,
          async (checkIns) => {
            const records = checkIns as CheckInRecord[];

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

            const completedRecords = sorted.filter(
              (record) => record.status === "completed",
            );

            if (completedRecords.length === 0) {
              setLastCheckIn(null);

              setCheckedInToday(false);

              return;
            }

            const latestCompleted = completedRecords[0].timestamp?.toDate();

            if (!latestCompleted) {
              setLastCheckIn(null);

              setCheckedInToday(false);

              return;
            }

            setLastCheckIn(latestCompleted);

            setCheckedInToday(isToday(latestCompleted));
          },
        );

        const schedules =
          await databaseService.getReminderSchedule(elderlyUserId);

        const reminderTimes = schedules.flatMap(
          (schedule: any) => schedule.times ?? [],
        );

        const next = reminderManager.getNextReminder(reminderTimes);

        setNextReminder(next);

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
      <View
        style={styles.loadingContainer}
        accessible
        accessibilityLabel="Loading caregiver dashboard"
      >
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (!elderlyProfile) {
    return (
      <View style={styles.noLinkContainer}>
        <View style={styles.topBar}>
          <Text style={styles.title} accessibilityRole="header">
            Caregiver Dashboard
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

        <View style={styles.noLinkCard}>
          <Text style={styles.noLinkTitle}>No Linked User</Text>

          <Text style={styles.message}>
            No elderly user is linked to this caregiver account.
          </Text>
        </View>
      </View>
    );
  }

  const statusText = checkedInToday
    ? "✓ Checked in today"
    : "No check-in today";

  const lastCheckInText = lastCheckIn
    ? formatLastCheckIn(lastCheckIn)
    : "No previous check-ins";

  const reminderText = nextReminder
    ? formatReminderTime(nextReminder)
    : "No reminder set";

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.topBar}>
        <Text style={styles.title} accessibilityRole="header">
          Caregiver Dashboard
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

      <View
        style={styles.profileCard}
        accessible
        accessibilityLabel={`Elderly Profile. ${
          elderlyProfile.name ?? "Elderly User"
        }${elderlyProfile.email ? `. ${elderlyProfile.email}` : ""}`}
      >
        <View style={styles.profileIcon}>
          <Text style={styles.profileIconText}>
            {(elderlyProfile.name ?? "E").charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.profileDetails}>
          <Text style={styles.label}>Elderly Profile</Text>

          <Text style={styles.profileName}>
            {elderlyProfile.name ?? "Elderly User"}
          </Text>

          {elderlyProfile.email && (
            <Text style={styles.subText}>{elderlyProfile.email}</Text>
          )}
        </View>
      </View>

      <View
        style={styles.summaryCard}
        accessible
        accessibilityLabel={`Current wellbeing status. ${statusText}`}
      >
        <Text style={styles.summaryLabel}>Current Wellbeing Status</Text>

        <Text style={styles.statusValue}>{statusText}</Text>
      </View>

      <View
        style={styles.summaryCard}
        accessible
        accessibilityLabel={`Next scheduled reminder. ${reminderText}`}
      >
        <Text style={styles.summaryLabel}>Next Scheduled Reminder</Text>

        <Text style={styles.reminderValue}>{reminderText}</Text>
      </View>

      <View
        style={styles.summaryCard}
        accessible
        accessibilityLabel={`Last check-in. ${lastCheckInText}`}
      >
        <Text style={styles.summaryLabel}>Last Check-in</Text>

        <Text style={styles.lastCheckInValue}>{lastCheckInText}</Text>
      </View>

      <Text style={styles.sectionTitle} accessibilityRole="header">
        Caregiver Actions
      </Text>

      <Pressable
        style={styles.primaryAction}
        onPress={() => router.push("/caregiver/history")}
        accessibilityRole="button"
        accessibilityLabel="View check-in history"
        accessibilityHint="Shows completed and missed check-ins"
      >
        <Text style={styles.primaryActionTitle}>View Check-in History</Text>

        <Text style={styles.primaryActionDescription}>
          Review completed and missed check-ins
        </Text>
      </Pressable>

      <Pressable
        style={styles.secondaryAction}
        onPress={() => router.push("/caregiver/schedule")}
        accessibilityRole="button"
        accessibilityLabel="Manage reminder schedule"
        accessibilityHint="Change the elderly user's reminder times"
      >
        <Text style={styles.secondaryActionTitle}>
          Manage Reminder Schedule
        </Text>

        <Text style={styles.secondaryActionDescription}>
          Add, remove or update reminder times
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 28,
    gap: 14,
    backgroundColor: "#F8F8F4",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F8F8F4",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 17,
    color: "#333333",
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 2,
  },

  title: {
    flex: 1,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
    color: "#111111",
  },

  logoutButton: {
    minWidth: 76,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: "#BDBDBD",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },

  logoutButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222222",
  },

  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderWidth: 2,
    borderColor: "#D1D1D1",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },

  profileIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E7F4E4",
    borderWidth: 2,
    borderColor: "#4E9F3D",
    marginRight: 14,
  },

  profileIconText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#286C1D",
  },

  profileDetails: {
    flex: 1,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555555",
  },

  profileName: {
    fontSize: 21,
    lineHeight: 27,
    fontWeight: "700",
    color: "#111111",
    marginTop: 2,
  },

  subText: {
    fontSize: 15,
    lineHeight: 21,
    marginTop: 3,
    color: "#444444",
  },

  summaryCard: {
    minHeight: 96,
    paddingVertical: 16,
    paddingHorizontal: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#D1D1D1",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },

  summaryLabel: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: "#444444",
    textAlign: "center",
  },

  statusValue: {
    marginTop: 8,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: "700",
    color: "#111111",
    textAlign: "center",
  },

  reminderValue: {
    marginTop: 8,
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "700",
    color: "#111111",
    textAlign: "center",
  },

  lastCheckInValue: {
    marginTop: 8,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    color: "#111111",
    textAlign: "center",
  },

  sectionTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    color: "#111111",
    marginTop: 4,
  },

  primaryAction: {
    minHeight: 96,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: "#4E9F3D",
  },

  primaryActionTitle: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },

  primaryActionDescription: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: "#FFFFFF",
    textAlign: "center",
  },

  secondaryAction: {
    minHeight: 96,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: "#BDBDBD",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },

  secondaryActionTitle: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: "700",
    color: "#111111",
    textAlign: "center",
  },

  secondaryActionDescription: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: "#555555",
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
