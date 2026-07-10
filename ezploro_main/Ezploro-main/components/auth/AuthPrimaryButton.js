import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from "react-native"
import { scaleDimension, scaleFont } from "../../utils/responsive"

export default function AuthPrimaryButton({
  title,
  loading = false,
  loadingLabel,
  disabled = false,
  style,
  textStyle,
  indicatorColor = "#fff",
  indicatorSize = "small",
  showIndicator = false,
  ...props
}) {
  const isDisabled = disabled || loading
  const displayText = loading ? loadingLabel ?? title : title

  return (
    <TouchableOpacity
      style={[styles.button, isDisabled && styles.buttonDisabled, style]}
      disabled={isDisabled}
      {...props}
    >
      {loading && showIndicator ? (
        <ActivityIndicator color={indicatorColor} size={indicatorSize} />
      ) : (
        <Text style={[styles.buttonText, textStyle]}>{displayText}</Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#8B5CF6",
    paddingVertical: scaleDimension(16),
    borderRadius: scaleDimension(12),
    marginBottom: scaleDimension(24),
    width: "100%",
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: scaleFont(16),
    fontWeight: "600",
    textAlign: "center",
  },
})

