import React, { useEffect, useState } from "react"
import {
  View,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Image,
} from "react-native"
import { Text } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "../context/AuthContext"
import { useTranslation } from "react-i18next"

const { width: windowWidth, height: windowHeight } = Dimensions.get("window")

const scaleFont = (size) => {
  const baseWidth = 375
  return Math.min(size * (windowWidth / baseWidth), size * 1.2)
}

const scaleDimension = (size) => {
  const baseWidth = 375
  return Math.min(size * (windowWidth / baseWidth), size * 1.2)
}

export default function PasswordChangedConfirmationScreen({ navigation, route }) {
  const { t } = useTranslation()
  const { login } = useAuth()
  const { email, newPassword } = route.params || {}
  const [autoLoginStatus, setAutoLoginStatus] = useState("loading") // loading, success, failed

  useEffect(() => {
    const attemptAutoLogin = async () => {
      if (email && newPassword) {
        const result = await login(email, newPassword)
        if (result.success) {
          setAutoLoginStatus("success")
          // Navigate to MainApp after a short delay to show success message
          setTimeout(() => {
            navigation.replace("MainApp") // Use replace to clear the stack
          }, 1500)
        } else {
          setAutoLoginStatus("failed")
          // Navigate back to login if auto-login fails
          setTimeout(() => {
            navigation.replace("Login", { error: result.error || t("failed_auto_login") })
          }, 2000)
        }
      } else {
        // If email or password missing, cannot auto-login
        setAutoLoginStatus("failed")
        setTimeout(() => {
          navigation.replace("Login", { error: t("missing_credentials_for_auto_login") })
        }, 2000)
      }
    }

    attemptAutoLogin()
  }, [email, newPassword, login, navigation, t])

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            {autoLoginStatus === "loading" && (
              <ActivityIndicator size="large" color="#8B5CF6" />
            )}
            {autoLoginStatus === "success" && (
              <Ionicons name="checkmark-circle-outline" size={80} color="#10B981" />
            )}
            {autoLoginStatus === "failed" && (
              <Ionicons name="close-circle-outline" size={80} color="#EF4444" />
            )}
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.title}>
              {autoLoginStatus === "loading" && t("attempting_auto_login")}
              {autoLoginStatus === "success" && t("password_changed_successfully")}
              {autoLoginStatus === "failed" && t("auto_login_failed")}
            </Text>
            <Text style={styles.subtitle}>
              {autoLoginStatus === "loading" && t("please_wait_while_we_log_you_in")}
              {autoLoginStatus === "success" && t("you_will_be_redirected_shortly")}
              {autoLoginStatus === "failed" && t("please_try_logging_in_manually")}
            </Text>
          </View>
        </View>
      </View>
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
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scaleDimension(24),
  },
  content: {
    alignItems: "center",
    width: "100%",
  },
  iconContainer: {
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
})
