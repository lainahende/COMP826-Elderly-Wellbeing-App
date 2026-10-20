import { Pressable, StyleSheet, Text } from "react-native";

interface LargeButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export default function LargeButton({
  title,
  onPress,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
}: LargeButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed && !disabled && styles.pressedButton,
        disabled && styles.disabledButton,
      ]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        disabled,
      }}
    >
      <Text style={[styles.text, disabled && styles.disabledText]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    minHeight: 58,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#4E9F3D",
  },

  pressedButton: {
    opacity: 0.82,
  },

  disabledButton: {
    backgroundColor: "#A8B8A4",
  },

  text: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },

  disabledText: {
    color: "#F3F3F3",
  },
});
