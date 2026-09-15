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
  const authPresenter = new AuthPresenter();
  const [loading, setLoading] = useState(false);

  const isValidEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

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
      >
        <View style={styles.container}>
          <Text style={styles.title}>Elderly Wellbeing</Text>

          <Text style={styles.subtitle}>Sign in to continue</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>

            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              autoComplete="email"
            />

            <Text style={styles.label}>Password</Text>

            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              textContentType="password"
              autoComplete="password"
            />

            <LargeButton
              title={loading ? "Logging In..." : "Log In"}
              onPress={handleLogin}
              disabled={loading}
            />
          </View>

          <Text style={styles.note}>
            Caregiver and elderly access will be determined after login.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  scrollContainer: {
    flexGrow: 1,
  },

  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 40,
  },

  title: {
    fontSize: 34,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 32,
  },

  form: {
    gap: 12,
  },

  label: {
    fontSize: 18,
    fontWeight: "600",
  },

  input: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: "#999",
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 18,
    marginBottom: 10,
  },

  note: {
    marginTop: 24,
    fontSize: 14,
    textAlign: "center",
  },
});
