import { StyleSheet, Text, View } from "react-native"
import { scaleDimension, scaleFont } from "../../utils/responsive"

export default function AuthWelcome({ title, subtitle, titleStyle, subtitleStyle, children }) {
  return (
    <View style={styles.container}>
      {title ? <Text style={[styles.title, titleStyle]}>{title}</Text> : null}
      {subtitle ? <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text> : null}
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: scaleDimension(36),
  },
  title: {
    fontSize: scaleFont(28),
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: scaleDimension(8),
    textAlign: "center",
  },
  subtitle: {
    fontSize: scaleFont(16),
    color: "#6B7280",
    textAlign: "center",
  },
})

