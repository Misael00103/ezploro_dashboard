import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { scaleDimension, scaleFont } from "../../utils/responsive"

export default function AuthFooterLink({
  prefixText,
  linkText,
  onPress,
  containerStyle,
  prefixStyle,
  linkStyle,
}) {
  return (
    <View style={[styles.container, containerStyle]}>
      {prefixText ? <Text style={[styles.prefix, prefixStyle]}>{prefixText}</Text> : null}
      <TouchableOpacity onPress={onPress}>
        <Text style={[styles.link, linkStyle]}>{linkText}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: scaleDimension(4),
  },
  prefix: {
    color: "#6B7280",
    fontSize: scaleFont(14),
  },
  link: {
    color: "#8B5CF6",
    fontSize: scaleFont(14),
    fontWeight: "600",
  },
})

