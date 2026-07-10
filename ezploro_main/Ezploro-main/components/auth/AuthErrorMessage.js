import { StyleSheet, Text, View } from "react-native"
import { scaleDimension, scaleFont } from "../../utils/responsive"

export default function AuthErrorMessage({ children, containerStyle, textStyle }) {
  if (!children) return null

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.text, textStyle]}>{children}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: scaleDimension(16),
    textAlign: "center",
    backgroundColor: "#FEF2F2",
    padding: scaleDimension(12),
    borderRadius: scaleDimension(8),
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  text: {
    color: "#EF4444",
    fontSize: scaleFont(14),
    textAlign: "center",
  },
})

