import { Pressable, StyleSheet, Text } from "react-native";

interface LargeButtonProps {
  title: string;
  onPress: () => void;
}

export default function LargeButton({ title, onPress }: LargeButtonProps) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
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
});
