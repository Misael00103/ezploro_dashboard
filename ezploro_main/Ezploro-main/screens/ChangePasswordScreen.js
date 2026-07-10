import React, { useState, useCallback, useMemo } from "react"
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native"
import { Text } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from 'expo-linear-gradient'
import { useTheme } from "../context/ThemeContext"
import { useAuth } from "../context/AuthContext"
import { API_URL_PASSWORD_CHANGE } from "../config"
import AsyncStorage from "@react-native-async-storage/async-storage"

export default function ChangePasswordScreen({ navigation }) {
  const { darkMode } = useTheme()
  const { user, token, changePassword } = useAuth()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const validatePasswords = () => {
    if (!currentPassword.trim()) {
      Alert.alert("Error", "Please enter your current password")
      return false
    }
    if (!newPassword.trim()) {
      Alert.alert("Error", "Please enter a new password")
      return false
    }
    if (newPassword.length < 6) {
      Alert.alert("Error", "New password must be at least 6 characters long")
      return false
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match")
      return false
    }
    if (currentPassword === newPassword) {
      Alert.alert("Error", "New password must be different from current password")
      return false
    }
    return true
  }

  const handleChangePassword = async () => {
    if (!validatePasswords()) return

    setLoading(true)
    try {
      const result = await changePassword(currentPassword, newPassword)
      
      if (result && result.success) {
        Alert.alert(
          "Success", 
          result.message || "Password changed successfully",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        )
        
        // Clear form
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        Alert.alert("Error", result?.error || "Failed to change password")
      }
      
    } catch (error) {
      console.error("❌ Error changing password:", error)
      Alert.alert("Error", error.message || "Failed to change password")
    } finally {
      setLoading(false)
    }
  }

  // Memoized callbacks to prevent re-renders
  const handleCurrentPasswordChange = useCallback((text) => {
    setCurrentPassword(text)
  }, [])

  const handleNewPasswordChange = useCallback((text) => {
    setNewPassword(text)
  }, [])

  const handleConfirmPasswordChange = useCallback((text) => {
    setConfirmPassword(text)
  }, [])

  const toggleCurrentPassword = useCallback(() => {
    setShowCurrentPassword(prev => !prev)
  }, [])

  const toggleNewPassword = useCallback(() => {
    setShowNewPassword(prev => !prev)
  }, [])

  const toggleConfirmPassword = useCallback(() => {
    setShowConfirmPassword(prev => !prev)
  }, [])

  // Memoized styles to prevent recalculation
  const inputLabelStyle = useMemo(() => [
    styles.inputLabel, 
    darkMode && styles.inputLabelDark
  ], [darkMode])

  const passwordInputContainerStyle = useMemo(() => [
    styles.passwordInputContainer, 
    darkMode && styles.passwordInputContainerDark
  ], [darkMode])

  const passwordInputStyle = useMemo(() => [
    styles.passwordInput, 
    darkMode && styles.passwordInputDark
  ], [darkMode])

  const placeholderColor = useMemo(() => darkMode ? "#666" : "#999", [darkMode])
  const iconColor = useMemo(() => darkMode ? "#666" : "#999", [darkMode])

  // Optimized PasswordInput component with memoization
  const renderPasswordInput = useCallback((label, value, onChangeText, showPassword, onToggleShow, placeholder) => (
    <View style={styles.inputContainer}>
      <Text style={inputLabelStyle}>
        {label}
      </Text>
      <View style={passwordInputContainerStyle}>
        <TextInput
          style={passwordInputStyle}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderColor}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
        />
        <TouchableOpacity onPress={onToggleShow} style={styles.eyeButton} activeOpacity={0.7}>
          <Ionicons 
            name={showPassword ? "eye-off" : "eye"} 
            size={20} 
            color={iconColor} 
          />
        </TouchableOpacity>
      </View>
    </View>
  ), [inputLabelStyle, passwordInputContainerStyle, passwordInputStyle, placeholderColor, iconColor])



  return (
    <LinearGradient
      colors={darkMode ? ['#1a1a2e', '#16213e', '#0f3460'] : ['#667eea', '#764ba2', '#f093fb']}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Change Password</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.content}>
            <View style={useMemo(() => [styles.formContainer, darkMode && styles.formContainerDark], [darkMode])}>
              <Text style={useMemo(() => [styles.formTitle, darkMode && styles.formTitleDark], [darkMode])}>
                Update Your Password
              </Text>
              <Text style={useMemo(() => [styles.formSubtitle, darkMode && styles.formSubtitleDark], [darkMode])}>
                Enter your current password and choose a new one
              </Text>

              {renderPasswordInput(
                "Current Password",
                currentPassword,
                handleCurrentPasswordChange,
                showCurrentPassword,
                toggleCurrentPassword,
                "Enter your current password"
              )}

              {renderPasswordInput(
                "New Password",
                newPassword,
                handleNewPasswordChange,
                showNewPassword,
                toggleNewPassword,
                "Enter your new password"
              )}

              {renderPasswordInput(
                "Confirm New Password",
                confirmPassword,
                handleConfirmPasswordChange,
                showConfirmPassword,
                toggleConfirmPassword,
                "Confirm your new password"
              )}

              <TouchableOpacity
                style={[
                  styles.changeButton,
                  loading && styles.changeButtonDisabled
                ]}
                onPress={handleChangePassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark" size={20} color="#fff" />
                    <Text style={styles.changeButtonText}>Change Password</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.securityTips}>
                <Text style={useMemo(() => [styles.tipsTitle, darkMode && styles.tipsTitleDark], [darkMode])}>
                  Password Security Tips:
                </Text>
                <Text style={useMemo(() => [styles.tipText, darkMode && styles.tipTextDark], [darkMode])}>
                  • Use at least 6 characters
                </Text>
                <Text style={useMemo(() => [styles.tipText, darkMode && styles.tipTextDark], [darkMode])}>
                  • Include numbers and special characters
                </Text>
                <Text style={useMemo(() => [styles.tipText, darkMode && styles.tipTextDark], [darkMode])}>
                  • Don't use personal information
                </Text>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  gradientContainer: { flex: 1 },
  safeArea: { flex: 1, paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 },
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  formContainerDark: {
    backgroundColor: 'rgba(31, 34, 42, 0.95)',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  formTitleDark: {
    color: "#fff",
  },
  formSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
  },
  formSubtitleDark: {
    color: "#B8B8D9",
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  inputLabelDark: {
    color: "#fff",
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  passwordInputContainerDark: {
    backgroundColor: "#2A2D35",
    borderColor: "#3A3F47",
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#333",
  },
  passwordInputDark: {
    color: "#fff",
  },
  eyeButton: {
    padding: 14,
  },
  changeButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  changeButtonDisabled: {
    backgroundColor: "#ccc",
  },
  changeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  securityTips: {
    marginTop: 24,
    padding: 16,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  tipsTitleDark: {
    color: "#fff",
  },
  tipText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  tipTextDark: {
    color: "#B8B8D9",
  },
})