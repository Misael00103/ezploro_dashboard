"use client"

import { useState } from "react"
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"

export default function PasswordInput({
  value,
  onChangeText,
  placeholder = "Password",
  style,
  darkMode = false,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <View style={[styles.container, style]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={darkMode ? "#aaa" : "#666"}
        secureTextEntry={!showPassword}
        style={[styles.input, darkMode && styles.inputDark]}
        {...props}
      />
      <TouchableOpacity style={styles.iconButton} onPress={() => setShowPassword(!showPassword)}>
        <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color={darkMode ? "#aaa" : "#666"} />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingRight: 50,
    fontSize: 16,
    backgroundColor: "#F9FAFB",
    color: "#000",
  },
  inputDark: {
    backgroundColor: "#333644",
    borderColor: "#44475A",
    color: "#fff",
  },
  iconButton: {
    position: "absolute",
    right: 12,
    top: 12,
    padding: 4,
  },
})
