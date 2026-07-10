import { StyleSheet, View } from "react-native"
import { scaleDimension } from "../../utils/responsive"

export default function AuthInputRow({ children, style }) {
  return <View style={[styles.row, style]}>{children}</View>
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: scaleDimension(12),
    width: "100%",
  },
})

