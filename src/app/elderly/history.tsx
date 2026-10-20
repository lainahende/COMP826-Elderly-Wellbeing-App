import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { auth } from "../../config/firebase";
import { DatabaseService } from "../../services/DatabaseService";

type CheckInRecord = {
  id: string;
  elderlyUserId: string;
  status: string;

  timestamp?: {
    toDate: () => Date;
  };

  scheduledTime?: string;
  scheduledDate?: string;
};

const isToday = (date: Date) => {
  const today = new Date();

  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

const formatReminderTime = (time?: string) => {
  if (!time) {
    return "";
  }

  const [hourText, minute] = time.split(":");

  const hour = Number(hourText);

  const suffix = hour >= 12 ? "PM" : "AM";

  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minute} ${suffix}`;
};

export default function ElderlyHistory() {
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);

  const [loading, setLoading] = useState(true);

  const databaseService = new DatabaseService();

  useEffect(() => {
    const loadCheckIns = async () => {
      try {
        const user = auth.currentUser;

        if (!user) {
          setCheckIns([]);
          return;
        }

        const records = (await databaseService.getCheckIns(
          user.uid,
        )) as CheckInRecord[];

        const sortedRecords = [...records].sort((a, b) => {
          const aTime = a.timestamp?.toDate().getTime() ?? 0;

          const bTime = b.timestamp?.toDate().getTime() ?? 0;

          return bTime - aTime;
        });

        setCheckIns(sortedRecords);
      } catch (error) {
        console.error("Unable to load check-ins:", error);

        setCheckIns([]);
      } finally {
        setLoading(false);
      }
    };

    loadCheckIns();
  }, []);

  const formatDate = (checkIn: CheckInRecord) => {
    if (checkIn.status === "missed" && checkIn.scheduledDate) {
      const [year, month, day] = checkIn.scheduledDate.split("-").map(Number);

      const scheduledDate = new Date(year, month - 1, day);

      if (isToday(scheduledDate)) {
        return "Today";
      }

      return scheduledDate.toLocaleDateString("en-NZ", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }

    if (!checkIn.timestamp) {
      return "Unknown date";
    }

    const date = checkIn.timestamp.toDate();

    if (isToday(date)) {
      return "Today";
    }

    return date.toLocaleDateString("en-NZ", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (checkIn: CheckInRecord) => {
    if (checkIn.status === "missed" && checkIn.scheduledTime) {
      return formatReminderTime(checkIn.scheduledTime);
    }

    if (!checkIn.timestamp) {
      return "";
    }

    const date = checkIn.timestamp.toDate();

    return date.toLocaleTimeString("en-NZ", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getStatusText = (status: string) => {
    return status === "missed" ? "Missed" : "Checked in";
  };

  if (loading) {
    return (
      <View
        style={styles.loadingContainer}
        accessible
        accessibilityLabel="Loading check-in history"
      >
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>Loading check-ins...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
    >
      {/* Top navigation */}
      <View style={styles.topBar}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back to dashboard"
        >
          <Text style={styles.backButtonText}>‹ Back</Text>
        </Pressable>

        <Text style={styles.title} accessibilityRole="header">
          Check-in History
        </Text>

        <View style={styles.topBarSpacer} />
      </View>

      {/* Intro */}
      <View style={styles.introCard}>
        <Text style={styles.introTitle}>Your recent check-ins</Text>

        <Text style={styles.introText}>
          This shows when your wellbeing check-ins were completed or missed.
        </Text>
      </View>

      {/* Empty state */}
      {checkIns.length === 0 ? (
        <View
          style={styles.emptyCard}
          accessible
          accessibilityLabel="No check-ins recorded yet"
        >
          <Text style={styles.emptyTitle}>No check-ins yet</Text>

          <Text style={styles.emptyText}>
            Your completed check-ins will appear here.
          </Text>
        </View>
      ) : (
        <View style={styles.historyList}>
          {checkIns.map((checkIn) => {
            const isMissed = checkIn.status === "missed";

            const dateText = formatDate(checkIn);

            const timeText = formatTime(checkIn);

            const statusText = getStatusText(checkIn.status);

            return (
              <View
                key={checkIn.id}
                style={styles.card}
                accessible
                accessibilityLabel={`${dateText}. ${timeText}. ${statusText}.`}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.dateSection}>
                    <Text style={styles.date} testID="check-in-date">
                      {dateText}
                    </Text>

                    {timeText !== "" && (
                      <Text style={styles.time}>{timeText}</Text>
                    )}
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      isMissed ? styles.missedBadge : styles.completedBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        isMissed ? styles.missedText : styles.completedText,
                      ]}
                    >
                      {isMissed ? "Missed" : "✓ Checked in"}
                    </Text>
                  </View>
                </View>

                {isMissed && (
                  <Text style={styles.missedExplanation}>
                    No check-in was recorded during the scheduled check-in
                    period.
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: "#F8F8F4",
    gap: 20,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F8F4",
    padding: 24,
  },

  loadingText: {
    marginTop: 14,
    fontSize: 18,
    color: "#333333",
  },

  /* ------------------------------------------
       Top navigation
    ------------------------------------------ */

  topBar: {
    flexDirection: "row",
    alignItems: "center",
  },

  backButton: {
    width: 90,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#BDBDBD",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
  },

  backButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#222222",
  },

  title: {
    flex: 1,
    fontSize: 30,
    fontWeight: "700",
    textAlign: "center",
    color: "#111111",
  },

  topBarSpacer: {
    width: 90,
  },

  /* ------------------------------------------
       Introduction
    ------------------------------------------ */

  introCard: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#D1D1D1",
    borderRadius: 16,
  },

  introTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111111",
    textAlign: "center",
  },

  introText: {
    marginTop: 8,
    fontSize: 17,
    lineHeight: 25,
    color: "#555555",
    textAlign: "center",
  },

  /* ------------------------------------------
       History
    ------------------------------------------ */

  historyList: {
    gap: 14,
  },

  card: {
    padding: 20,
    borderWidth: 2,
    borderColor: "#D1D1D1",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 14,
  },

  dateSection: {
    flex: 1,
  },

  date: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111111",
  },

  time: {
    fontSize: 18,
    marginTop: 5,
    color: "#444444",
  },

  /* ------------------------------------------
       Status
    ------------------------------------------ */

  statusBadge: {
    minWidth: 120,
    minHeight: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 2,
  },

  completedBadge: {
    backgroundColor: "#E7F4E4",
    borderColor: "#4E9F3D",
  },

  missedBadge: {
    backgroundColor: "#FBEAEA",
    borderColor: "#C94A4A",
  },

  statusText: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },

  completedText: {
    color: "#286C1D",
  },

  missedText: {
    color: "#9D2929",
  },

  missedExplanation: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    fontSize: 16,
    lineHeight: 23,
    color: "#555555",
  },

  /* ------------------------------------------
       Empty state
    ------------------------------------------ */

  emptyCard: {
    marginTop: 20,
    padding: 28,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#D1D1D1",
    borderRadius: 16,
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111111",
    textAlign: "center",
  },

  emptyText: {
    marginTop: 8,
    fontSize: 18,
    lineHeight: 26,
    color: "#555555",
    textAlign: "center",
  },
});
