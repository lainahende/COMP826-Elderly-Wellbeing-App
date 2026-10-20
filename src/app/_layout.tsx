import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

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
      setLoading(true);

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

    /*
     * User is not logged in.
     */
    if (!firebaseUser) {
      if (currentSection !== undefined) {
        router.replace("/");
      }

      return;
    }

    /*
     * Elderly user.
     */
    if (role === "elderly") {
      if (currentSection !== "elderly") {
        router.replace("/elderly/dashboard");
      }

      return;
    }

    /*
     * Caregiver user.
     */
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
      <View
        style={styles.loadingContainer}
        accessible
        accessibilityLabel="Loading Elderly Wellbeing"
      >
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>✓</Text>
        </View>

        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  /* --------------------------------------------------
     Navigation stack
  -------------------------------------------------- */

  return (
    <Stack
      screenOptions={{
        headerShown: false,

        contentStyle: {
          backgroundColor: "#F8F8F4",
        },

        animation: "slide_from_right",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          animation: "fade",
        }}
      />

      <Stack.Screen name="elderly/dashboard" />

      <Stack.Screen name="elderly/history" />

      <Stack.Screen name="caregiver/dashboard" />

      <Stack.Screen name="caregiver/history" />

      <Stack.Screen name="caregiver/schedule" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#F8F8F4",
  },

  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#E7F4E4",
    borderWidth: 2,
    borderColor: "#4E9F3D",
  },

  logoText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#286C1D",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 17,
    color: "#555555",
  },
});
