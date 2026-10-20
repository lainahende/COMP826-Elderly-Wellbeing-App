import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import LargeButton from "../components/LargeButton";
import { AuthPresenter } from "../presenters/AuthPresenter";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const authPresenter = new AuthPresenter();

  /* --------------------------------------------------
     Validate email
  -------------------------------------------------- */

  const isValidEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailRegex.test(value);
  };

  /* --------------------------------------------------
     Login
  -------------------------------------------------- */

  const handleLogin = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password.trim()) {
      Alert.alert(
        "Missing Information",
        "Please enter both your email and password.",
      );

      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");

      return;
    }

    try {
      setLoading(true);

      const user = await authPresenter.login(trimmedEmail, password);

      if (user.role === "elderly") {
        router.replace("/elderly/dashboard");
      } else if (user.role === "caregiver") {
        router.replace("/caregiver/dashboard");
      } else {
        Alert.alert(
          "Login Error",
          "This account does not have a valid user role.",
        );
      }
    } catch (error) {
      console.error(error);

      Alert.alert(
        "Login Failed",
        "The email or password you entered is incorrect.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* App heading */}

          <View style={styles.headingContainer}>
            <View
              style={styles.logoCircle}
              accessible
              accessibilityLabel="Elderly Wellbeing"
            >
              <Text style={styles.logoText}>✓</Text>
            </View>

            <Text style={styles.title} accessibilityRole="header">
              Elderly Wellbeing
            </Text>

            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

          {/* Login form */}

          <View style={styles.formCard}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>

              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor="#777777"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                autoComplete="email"
                returnKeyType="next"
                editable={!loading}
                accessibilityLabel="Email address"
                accessibilityHint="Enter the email address for your account"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>

              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor="#777777"
                secureTextEntry
                textContentType="password"
                autoComplete="password"
                returnKeyType="done"
                editable={!loading}
                onSubmitEditing={handleLogin}
                accessibilityLabel="Password"
                accessibilityHint="Enter your account password"
              />
            </View>

            <View style={styles.buttonContainer}>
              <LargeButton
                title={loading ? "Logging In..." : "Log In"}
                onPress={handleLogin}
                disabled={loading}
              />
            </View>
          </View>

          {/* Supporting text */}

          <Text style={styles.note}>
            Your account will automatically open the correct elderly or
            caregiver dashboard.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: "#F8F8F4",
  },

  scrollContainer: {
    flexGrow: 1,
  },

  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 30,
  },

  headingContainer: {
    alignItems: "center",
    marginBottom: 24,
  },

  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    backgroundColor: "#E7F4E4",
    borderWidth: 2,
    borderColor: "#4E9F3D",
  },

  logoText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#286C1D",
  },

  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "700",
    color: "#111111",
    textAlign: "center",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 17,
    lineHeight: 23,
    color: "#555555",
    textAlign: "center",
  },

  formCard: {
    width: "100%",
    padding: 18,
    borderWidth: 2,
    borderColor: "#D1D1D1",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
  },

  fieldGroup: {
    marginBottom: 16,
  },

  label: {
    marginBottom: 7,
    fontSize: 17,
    fontWeight: "700",
    color: "#222222",
  },

  input: {
    minHeight: 54,
    borderWidth: 2,
    borderColor: "#BDBDBD",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 17,
    color: "#111111",
    backgroundColor: "#FFFFFF",
  },

  buttonContainer: {
    marginTop: 4,
  },

  note: {
    marginTop: 18,
    paddingHorizontal: 8,
    fontSize: 14,
    lineHeight: 20,
    color: "#666666",
    textAlign: "center",
  },
});
