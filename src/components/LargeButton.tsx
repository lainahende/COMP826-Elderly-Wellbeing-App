import { Pressable, StyleSheet, Text } from "react-native";

interface LargeButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}

export default function LargeButton({
  title,
  onPress,
  disabled = false,
}: LargeButtonProps) {
  return (
    <Pressable
      style={[styles.button, disabled && styles.disabledButton]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 64,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#222",
    paddingHorizontal: 20,
  },

  text: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },

  disabledButton: {
    opacity: 0.5,
  },
});
