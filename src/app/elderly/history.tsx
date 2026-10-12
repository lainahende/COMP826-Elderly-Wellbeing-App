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
  status: string;
  timestamp?: {
    toDate: () => Date;
  };
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

        setCheckIns(sortedRecords as CheckInRecord[]);
      } catch (error) {
        console.error("Unable to load check-ins:", error);

        setCheckIns([]);
      } finally {
        setLoading(false);
      }
    };

    loadCheckIns();
  }, []);

  const formatDate = (timestamp?: CheckInRecord["timestamp"]) => {
    if (!timestamp) {
      return "Unknown date";
    }

    const date = timestamp.toDate();

    return date.toLocaleDateString("en-NZ", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (timestamp?: CheckInRecord["timestamp"]) => {
    if (!timestamp) {
      return "";
    }

    const date = timestamp.toDate();

    return date.toLocaleTimeString("en-NZ", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>Loading check-ins...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Check-in History</Text>

      {checkIns.length === 0 ? (
        <Text style={styles.emptyText}>No check-ins recorded yet.</Text>
      ) : (
        checkIns.map((checkIn) => (
          <View key={checkIn.id} style={styles.card}>
            <Text style={styles.date} testID="check-in-date">
              {formatDate(checkIn.timestamp)}
            </Text>

            <Text style={styles.time}>{formatTime(checkIn.timestamp)}</Text>

            <Text style={styles.status}>Checked in</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 28,
    backgroundColor: "#FFFFFF",
    gap: 16,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 18,
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },

  emptyText: {
    fontSize: 20,
    textAlign: "center",
    marginTop: 40,
  },

  card: {
    padding: 20,
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },

  date: {
    fontSize: 22,
    fontWeight: "600",
  },

  time: {
    fontSize: 18,
    marginTop: 6,
  },

  status: {
    fontSize: 18,
    marginTop: 8,
    fontWeight: "600",
  },
});
