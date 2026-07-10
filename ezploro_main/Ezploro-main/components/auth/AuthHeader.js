import { Ionicons } from "@expo/vector-icons"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { scaleDimension, scaleFont } from "../../utils/responsive"

const DEFAULT_ICON_COLOR = "#333"

export default function AuthHeader({ title, onBack, rightContent = null, iconColor = DEFAULT_ICON_COLOR, titleStyle }) {
  const showBackButton = typeof onBack === "function"

  return (
    <View style={styles.header}>
      {showBackButton ? (
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={scaleDimension(24)} color={iconColor} />
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
      <Text style={[styles.headerTitle, titleStyle]}>{title}</Text>
      {rightContent ? <View style={styles.rightContainer}>{rightContent}</View> : <View style={styles.placeholder} />}
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: scaleDimension(40),
  },
  backButton: {
    padding: scaleDimension(8),
  },
  headerTitle: {
    fontSize: scaleFont(18),
    fontWeight: "600",
    color: "#333",
  },
  placeholder: {
    width: scaleDimension(40),
    alignItems: "flex-start",
  },
  rightContainer: {
    minWidth: scaleDimension(40),
    alignItems: "flex-end",
  },
})

