import { TextInput, StyleSheet } from "react-native"

export default function CustomInput({ value, onChangeText, placeholder, style, darkMode = false, ...props }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={darkMode ? "#aaa" : "#666"}
      style={[styles.input, darkMode && styles.inputDark, style]}
      {...props}
    />
  )
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#F9FAFB",
    color: "#000",
    marginBottom: 16,
  },
  inputDark: {
    backgroundColor: "#333644",
    borderColor: "#44475A",
    color: "#fff",
  },
})
