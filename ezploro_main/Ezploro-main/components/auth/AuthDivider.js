import { StyleSheet, Text, View } from "react-native"
import { scaleDimension, scaleFont } from "../../utils/responsive"

export default function AuthDivider({ label, containerStyle, textStyle, lineStyle }) {
  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[styles.line, lineStyle]} />
      {label ? <Text style={[styles.text, textStyle]}>{label}</Text> : null}
      <View style={[styles.line, lineStyle]} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: scaleDimension(24),
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  text: {
    marginHorizontal: scaleDimension(16),
    color: "#6B7280",
    fontSize: scaleFont(14),
    fontWeight: "500",
  },
})

