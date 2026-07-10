import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"

export default function ScreenHeader({ title, onBackPress, rightComponent, darkMode = false }) {
  return (
    <View style={[styles.header, darkMode && styles.headerDark]}>
      {onBackPress && (
        <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
          <Ionicons name="arrow-back" size={24} color={darkMode ? "#fff" : "#333"} />
        </TouchableOpacity>
      )}
      <Text style={[styles.title, darkMode && styles.titleDark]}>{title}</Text>
      <View style={styles.rightContainer}>{rightComponent || <View style={styles.placeholder} />}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  headerDark: {
    backgroundColor: "#181A20",
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  titleDark: {
    color: "#fff",
  },
  rightContainer: {
    width: 40,
  },
  placeholder: {
    width: 40,
  },
})
