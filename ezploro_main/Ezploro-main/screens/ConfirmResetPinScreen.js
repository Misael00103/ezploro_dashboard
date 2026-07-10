import { useState, useRef, useEffect } from "react"
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  Dimensions,
  KeyboardAvoidingView,
  ScrollView,
  TextInput,
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

export default function ConfirmResetPinScreen({ navigation, route }) {
  const { t } = useTranslation()
  const { email } = route.params
  const { confirmResetPin, forgotPassword, loading } = useAuth()
  const [pin, setPin] = useState(["", "", "", "", "", ""])
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [resendLoading, setResendLoading] = useState(false)
  const inputRefs = useRef([])

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  const handlePinChange = (value, index) => {
    const newPin = [...pin]
    newPin[index] = value

    setPin(newPin)
    setError("")

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    if (newPin.every((digit) => digit !== "") && newPin.join("").length === 6) {
      handleConfirmPin(newPin.join(""))
    }
  }

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleConfirmPin = async (pinCode = null) => {
    const codeToConfirm = pinCode || pin.join("")

    if (codeToConfirm.length !== 6) {
      setError(t("enter_complete_code"))
      return
    }

    setError("")
    setSuccess("")

    const result = await confirmResetPin(email, codeToConfirm)
    if (result && result.success) {
      setSuccess(t("code_verified"))
      setTimeout(() => {
        navigation.navigate("ResetPassword", { email })
      }, 1500)
    } else {
      setError(result?.error || t("invalid_or_expired_code"))
      setPin(["", "", "", "", "", ""])
      inputRefs.current[0]?.focus()
    }
  }

  const handleResendCode = async () => {
    setResendLoading(true)
    setError("")
    setSuccess("")

    const result = await forgotPassword(email)
    if (result && result.success) {
      setSuccess(t("new_code_sent"))
      setPin(["", "", "", "", "", ""])
      inputRefs.current[0]?.focus()
    } else {
      setError(result?.error || t("failed_to_resend_code"))
    }
    setResendLoading(false)
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
              <Text style={styles.headerTitle}>{t("verify_code")}</Text>
              <View style={styles.placeholder} />
            </View>

            <View style={styles.iconContainer}>
              <Ionicons name="mail-open-outline" size={80} color="#8B5CF6" />
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.title}>{t("check_your_email")}</Text>
              <Text style={styles.subtitle}>
                {t("code_sent_to")} <Text style={styles.emailText}>{email}</Text>
              </Text>
            </View>

            <View style={styles.pinContainer}>
              {pin.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  style={[styles.pinInput, digit ? styles.pinInputFilled : null, error ? styles.pinInputError : null]}
                  value={digit}
                  onChangeText={(value) => handlePinChange(value.slice(-1), index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {success ? <Text style={styles.successText}>{success}</Text> : null}

            <TouchableOpacity
              style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
              onPress={() => handleConfirmPin()}
              disabled={loading || pin.join("").length !== 6}
            >
              <Text style={styles.confirmButtonText}>
                {loading ? t("verifying") : t("verify_code")}
              </Text>
            </TouchableOpacity>

            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>{t("didnt_receive_code")}</Text>
              <TouchableOpacity style={styles.resendButton} onPress={handleResendCode} disabled={resendLoading}>
                <Text style={styles.resendButtonText}>
                  {resendLoading ? t("sending") : t("resend_code")}
                </Text>
              </TouchableOpacity>
            </View>
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
    marginBottom: scaleDimension(40),
  },
  title: {
    fontSize: scaleFont(28),
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: scaleDimension(12),
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
  pinContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: scaleDimension(32),
    paddingHorizontal: scaleDimension(20),
  },
  pinInput: {
    width: scaleDimension(45),
    height: scaleDimension(55),
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: scaleDimension(12),
    textAlign: "center",
    fontSize: scaleFont(20),
    fontWeight: "600",
    color: "#1F2937",
    backgroundColor: "#F9FAFB",
  },
  pinInputFilled: {
    borderColor: "#8B5CF6",
    backgroundColor: "#F3F4F6",
  },
  pinInputError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
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
  confirmButton: {
    backgroundColor: "#8B5CF6",
    paddingVertical: scaleDimension(16),
    borderRadius: scaleDimension(12),
    marginBottom: scaleDimension(32),
    width: "100%",
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: scaleFont(16),
    fontWeight: "600",
    textAlign: "center",
  },
  resendContainer: {
    alignItems: "center",
  },
  resendText: {
    color: "#6B7280",
    fontSize: scaleFont(14),
    marginBottom: scaleDimension(8),
  },
  resendButton: {
    paddingVertical: scaleDimension(8),
    paddingHorizontal: scaleDimension(16),
  },
  resendButtonText: {
    color: "#8B5CF6",
    fontSize: scaleFont(14),
    fontWeight: "600",
  },
})