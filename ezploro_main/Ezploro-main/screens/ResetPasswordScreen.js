
import React, { useState } from "react"
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native"
import { SCREEN_WIDTH as windowWidth, SCREEN_HEIGHT as windowHeight } from "../constants/layout"
import { Text, TextInput } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "../context/AuthContext"
import { useTranslation } from "react-i18next"

// Using SCREEN_WIDTH and SCREEN_HEIGHT from layout constants

const scaleFont = (size) => {
  const baseWidth = 375
  return Math.min(size * (windowWidth / baseWidth), size * 1.2)
}

const scaleDimension = (size) => {
  const baseWidth = 375
  return Math.min(size * (windowWidth / baseWidth), size * 1.2)
}

export default function ResetPasswordScreen({ navigation, route }) {
  const { t } = useTranslation()
  const { resetPassword, loading } = useAuth()
  const { email, resetToken } = route.params || {}
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const validatePassword = (password) => {
    return password.length >= 6
  }

  const handleResetPassword = async () => {
    setError("")
    setSuccess("")

    if (!newPassword || !confirmPassword) {
      setError(t("please_fill_all_fields") || "Please fill all fields")
      return
    }

    if (!validatePassword(newPassword)) {
      setError(t("password_too_short") || "Password must be at least 6 characters")
      return
    }

    if (newPassword !== confirmPassword) {
      setError(t("passwords_do_not_match") || "Passwords do not match")
      return
    }

    const result = await resetPassword(email, newPassword, confirmPassword)
    if (result && result.success) {
      setSuccess(t("password_reset_success") || "Password reset successfully!")
      setTimeout(() => {
        navigation.navigate("Login")
      }, 2000)
    } else {
      setError(result?.error || t("failed_to_reset_password") || "Failed to reset password")
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
              <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
          keyboardVerticalOffset={Platform.OS === "ios" ? scaleDimension(40) : 0}
        >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{t("reset_password") || "Reset Password"}</Text>
              <View style={styles.placeholder} />
            </View>

            <View style={styles.iconContainer}>
              <Ionicons name="lock-closed-outline" size={80} color="#8B5CF6" />
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.title}>{t("reset_password") || "Reset Password"}</Text>
              <Text style={styles.subtitle}>
                Ingresa una nueva contraseña para <Text style={styles.emailText}>{email}</Text>
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                label={t("new_password") || "New Password"}
                value={newPassword}
                onChangeText={setNewPassword}
                style={styles.input}
                mode="outlined"
                outlineColor="#E5E7EB"
                activeOutlineColor="#8B5CF6"
                outlineStyle={{ borderRadius: scaleDimension(12) }}
                backgroundColor="#F9FAFB"
                secureTextEntry
                contentStyle={{ paddingHorizontal: scaleDimension(16) }}
              />
              <TextInput
                label={t("confirm_password") || "Confirm Password"}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={styles.input}
                mode="outlined"
                outlineColor="#E5E7EB"
                activeOutlineColor="#8B5CF6"
                outlineStyle={{ borderRadius: scaleDimension(12) }}
                backgroundColor="#F9FAFB"
                secureTextEntry
                contentStyle={{ paddingHorizontal: scaleDimension(16) }}
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {success ? <Text style={styles.successText}>{success}</Text> : null}

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? t("resetting") || "Resetting..." : t("reset_password") || "Reset Password"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backToLoginButton} onPress={() => navigation.navigate("Login")}>
              <Text style={styles.backToLoginText}>{t("back_to_sign_in") || "Back to Sign In"}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: scaleDimension(20),
  },
  content: {
    flex: 1,
    paddingHorizontal: scaleDimension(24),
    paddingTop: scaleDimension(20),
  },
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
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: scaleDimension(32),
  },
  textContainer: {
    alignItems: "center",
    marginBottom: scaleDimension(32),
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
    lineHeight: 24,
  },
  emailText: {
    color: "#8B5CF6",
    fontWeight: "600",
  },
  inputContainer: {
    marginBottom: scaleDimension(24),
    width: "100%",
  },
  input: {
    marginBottom: scaleDimension(16),
    width: "100%",
    backgroundColor: "#F9FAFB",
    fontSize: scaleFont(16),
  },
  errorText: {
    color: "#EF4444",
    fontSize: scaleFont(14),
    marginBottom: scaleDimension(16),
    textAlign: "center",
    backgroundColor: "#FEF2F2",
    padding: scaleDimension(12),
    borderRadius: scaleDimension(8),
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  successText: {
    color: "#10B981",
    fontSize: scaleFont(14),
    marginBottom: scaleDimension(16),
    textAlign: "center",
    backgroundColor: "#F0FDF4",
    padding: scaleDimension(12),
    borderRadius: scaleDimension(8),
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  submitButton: {
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
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: scaleFont(16),
    fontWeight: "600",
    textAlign: "center",
  },
  backToLoginButton: {
    paddingVertical: scaleDimension(12),
    alignItems: "center",
  },
  backToLoginText: {
    color: "#8B5CF6",
    fontSize: scaleFont(14),
    fontWeight: "500",
  },
})
