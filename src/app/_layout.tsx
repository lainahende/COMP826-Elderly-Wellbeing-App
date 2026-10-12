import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { Stack, router, useSegments } from "expo-router";

import { User as FirebaseUser, onAuthStateChanged } from "firebase/auth";

import { doc, getDoc } from "firebase/firestore";

import * as Notifications from "expo-notifications";

import { auth, db } from "../config/firebase";

type UserRole = "elderly" | "caregiver" | null;

export default function RootLayout() {
  const segments = useSegments();

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  const [role, setRole] = useState<UserRole>(null);

  const [loading, setLoading] = useState(true);

  /* --------------------------------------------------
     Authentication listener
  -------------------------------------------------- */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const userDocument = await getDoc(doc(db, "users", user.uid));

        if (userDocument.exists()) {
          const userData = userDocument.data();

          setRole(userData.role as UserRole);
        } else {
          setRole(null);
        }
      } catch (error) {
        console.error("Error loading user role:", error);

        setRole(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  /* --------------------------------------------------
     Route protection
  -------------------------------------------------- */

  useEffect(() => {
    if (loading) {
      return;
    }

    const currentSection = segments[0];

    // User is not logged in
    if (!firebaseUser) {
      if (currentSection !== undefined) {
        router.replace("/");
      }

      return;
    }

    // Elderly user
    if (role === "elderly") {
      if (currentSection !== "elderly") {
        router.replace("/elderly/dashboard");
      }

      return;
    }

    // Caregiver user
    if (role === "caregiver") {
      if (currentSection !== "caregiver") {
        router.replace("/caregiver/dashboard");
      }
    }
  }, [firebaseUser, role, loading, segments]);

  /* --------------------------------------------------
     Notification tap handling
  -------------------------------------------------- */

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;

        if (data?.type === "wellbeing-reminder") {
          router.push("/elderly/dashboard");
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, []);

  /* --------------------------------------------------
     Loading screen
  -------------------------------------------------- */

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  /* --------------------------------------------------
     Navigation stack
  -------------------------------------------------- */

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Login",
        }}
      />

      <Stack.Screen
        name="elderly/dashboard"
        options={{
          title: "Elderly Dashboard",
        }}
      />

      <Stack.Screen
        name="elderly/history"
        options={{
          title: "Check-in History",
        }}
      />

      <Stack.Screen
        name="caregiver/dashboard"
        options={{
          title: "Caregiver Dashboard",
        }}
      />

      <Stack.Screen
        name="caregiver/history"
        options={{
          title: "Check-in History",
        }}
      />

      <Stack.Screen
        name="caregiver/schedule"
        options={{
          title: "Reminder Schedule",
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
