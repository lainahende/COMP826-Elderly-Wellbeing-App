import { useEffect, useState } from "react";
import {
  ActivityIndicator,
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

const formatCheckInDate = (date: Date) => {
  const time = date.toLocaleTimeString("en-NZ", {
    hour: "numeric",
    minute: "2-digit",
  });

  if (isToday(date)) {
    return `Today - ${time}`;
  }

  if (isYesterday(date)) {
    return `Yesterday - ${time}`;
  }

  const formattedDate = date.toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return `${formattedDate} - ${time}`;
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
            const checkIns = records as CheckInRecord[];

            const sortedRecords = [...checkIns].sort((a, b) => {
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

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />

        <Text style={styles.message}>Loading check-in history...</Text>
      </View>
    );
  }

  if (!linkedUserFound) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>Check-in History</Text>

        <Text style={styles.message}>
          No elderly user is linked to this caregiver account.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Check-in History</Text>

      {checkIns.length === 0 ? (
        <Text style={styles.message}>No check-in records found.</Text>
      ) : (
        checkIns.map((checkIn) => {
          const date = checkIn.timestamp?.toDate();

          if (!date) {
            return null;
          }

          const completed = checkIn.status === "completed";

          return (
            <View key={checkIn.id} style={styles.historyItem}>
              <Text style={styles.dateText}>{formatCheckInDate(date)}</Text>

              <Text style={styles.statusText}>
                {completed ? "✓ Completed" : "Missed"}
              </Text>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 28,
    backgroundColor: "#FFFFFF",
  },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 28,
    gap: 16,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 24,
  },

  historyItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#DDD",
  },

  dateText: {
    fontSize: 20,
    fontWeight: "600",
  },

  statusText: {
    fontSize: 17,
    marginTop: 6,
  },

  message: {
    fontSize: 18,
    textAlign: "center",
  },
});
