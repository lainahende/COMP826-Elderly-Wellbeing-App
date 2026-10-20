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
  status: "completed" | "missed" | string;

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

const isYesterday = (date: Date) => {
  const yesterday = new Date();

  yesterday.setDate(yesterday.getDate() - 1);

  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
};

const formatDate = (date: Date) => {
  if (isToday(date)) {
    return "Today";
  }

  if (isYesterday(date)) {
    return "Yesterday";
  }

  return date.toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString("en-NZ", {
    hour: "numeric",
    minute: "2-digit",
  });
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

export default function CaregiverHistoryScreen() {
  const databaseService = new DatabaseService();

  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);

  const [loading, setLoading] = useState(true);

  const [linkedUserFound, setLinkedUserFound] = useState(true);

  useEffect(() => {
    let unsubscribeCheckIns: (() => void) | undefined;

    const loadHistory = async () => {
      try {
        const caregiver = auth.currentUser;

        if (!caregiver) {
          setLinkedUserFound(false);
          setLoading(false);
          return;
        }

        const elderlyUserId = await databaseService.getLinkedElderlyUserId(
          caregiver.uid,
        );

        if (!elderlyUserId) {
          setLinkedUserFound(false);
          setLoading(false);
          return;
        }

        unsubscribeCheckIns = databaseService.subscribeToCheckIns(
          elderlyUserId,
          (records) => {
            const historyRecords = records as CheckInRecord[];

            const sortedRecords = [...historyRecords].sort((a, b) => {
              const aTime = a.timestamp?.toDate().getTime() ?? 0;

              const bTime = b.timestamp?.toDate().getTime() ?? 0;

              return bTime - aTime;
            });

            setCheckIns(sortedRecords);
            setLoading(false);
          },
        );
      } catch (error) {
        console.error("Unable to load caregiver history:", error);

        setCheckIns([]);
        setLoading(false);
      }
    };

    loadHistory();

    return () => {
      if (unsubscribeCheckIns) {
        unsubscribeCheckIns();
      }
    };
  }, []);

  const getRecordDate = (checkIn: CheckInRecord) => {
    if (checkIn.status === "missed" && checkIn.scheduledDate) {
      const [year, month, day] = checkIn.scheduledDate.split("-").map(Number);

      return new Date(year, month - 1, day);
    }

    return checkIn.timestamp?.toDate() ?? null;
  };

  const getRecordTime = (checkIn: CheckInRecord) => {
    if (checkIn.status === "missed" && checkIn.scheduledTime) {
      return formatReminderTime(checkIn.scheduledTime);
    }

    const date = checkIn.timestamp?.toDate();

    if (!date) {
      return "";
    }

    return formatTime(date);
  };

  if (loading) {
    return (
      <View
        style={styles.centerContainer}
        accessible
        accessibilityLabel="Loading check-in history"
      >
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>Loading check-in history...</Text>
      </View>
    );
  }

  if (!linkedUserFound) {
    return (
      <View style={styles.noLinkContainer}>
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
            Check-in History
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

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
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
          Check-in History
        </Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Recent Check-ins</Text>

        <Text style={styles.summaryText}>
          Review completed and missed wellbeing check-ins.
        </Text>
      </View>

      {checkIns.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No check-in records</Text>

          <Text style={styles.emptyText}>
            Completed and missed check-ins will appear here.
          </Text>
        </View>
      ) : (
        <View style={styles.historyList}>
          {checkIns.map((checkIn) => {
            const recordDate = getRecordDate(checkIn);

            if (!recordDate) {
              return null;
            }

            const completed = checkIn.status === "completed";

            const dateText = formatDate(recordDate);

            const timeText = getRecordTime(checkIn);

            return (
              <View
                key={checkIn.id}
                style={styles.historyCard}
                accessible
                accessibilityLabel={`${dateText}. ${timeText}. ${
                  completed ? "Completed" : "Missed"
                }`}
              >
                <View style={styles.historyHeader}>
                  <View style={styles.dateContainer}>
                    <Text style={styles.dateText} testID="check-in-date">
                      {dateText}
                    </Text>

                    {timeText !== "" && (
                      <Text style={styles.timeText}>{timeText}</Text>
                    )}
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      completed ? styles.completedBadge : styles.missedBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        completed ? styles.completedText : styles.missedText,
                      ]}
                    >
                      {completed ? "✓ Completed" : "Missed"}
                    </Text>
                  </View>
                </View>

                {!completed && (
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
    marginTop: 12,
    fontSize: 17,
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

  summaryCard: {
    padding: 16,
    borderWidth: 2,
    borderColor: "#D1D1D1",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },

  summaryTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111111",
    textAlign: "center",
  },

  summaryText: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 22,
    color: "#555555",
    textAlign: "center",
  },

  historyList: {
    gap: 10,
  },

  historyCard: {
    padding: 16,
    borderWidth: 2,
    borderColor: "#D1D1D1",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },

  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  dateContainer: {
    flex: 1,
  },

  dateText: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    color: "#111111",
  },

  timeText: {
    marginTop: 4,
    fontSize: 17,
    color: "#444444",
  },

  statusBadge: {
    minWidth: 104,
    minHeight: 46,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    fontSize: 15,
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
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    fontSize: 15,
    lineHeight: 22,
    color: "#555555",
  },

  emptyCard: {
    padding: 24,
    borderWidth: 2,
    borderColor: "#D1D1D1",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },

  emptyTitle: {
    fontSize: 20,
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
