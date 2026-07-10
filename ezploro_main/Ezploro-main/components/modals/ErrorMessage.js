import { View, Text, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"

export default function ErrorMessage({ message, darkMode = false }) {
  if (!message) return null

  return (
    <View style={[styles.container, darkMode && styles.containerDark]}>
      <Ionicons name="alert-circle" size={20} color="#EF4444" />
      <Text style={[styles.text, darkMode && styles.textDark]}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
    marginBottom: 16,
    gap: 8,
  },
  containerDark: {
    backgroundColor: "#3A2A2A",
    borderColor: "#5A3A3A",
  },
  text: {
    flex: 1,
    color: "#EF4444",
    fontSize: 14,
  },
  textDark: {
    color: "#FF8787",
  },
})
