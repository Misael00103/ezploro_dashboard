"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import {
  AuthErrorMessage,
  AuthFooterLink,
  AuthHeader,
  AuthPasswordField,
  AuthPrimaryButton,
  AuthScreenLayout,
  AuthTextField,
  AuthWelcome,
} from "../components/auth"
import { useAuth } from "../context/AuthContext"
import { scaleDimension, scaleFont } from "../utils/responsive"

export default function LoginScreen({ navigation }) {
  const { t } = useTranslation()
  const { login, loading } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const signInLabel = t("login.signIn", "Sign In")
  const welcomeTitle = t("login.welcomeTitle", "Welcome back!")
  const welcomeSubtitle = t("login.welcomeSubtitle", "Sign in to your account to continue")
  const emailLabel = t("login.email", "Email")
  const passwordLabel = t("login.password", "Password")
  const forgotPasswordLabel = t("login.forgotPassword", "Forgot Password?")
  const noAccountLabel = t("login.noAccount", "Don't have an account?")
  const signUpLabel = t("login.signUp", "Sign Up")
  const missingFieldsMessage = t("login.missingFields", "Please fill in all fields")
  const signingInLabel = t("login.signingIn", "Signing In...")

  const handleLogin = async () => {
    setError("")
    if (!email || !password) {
      setError(missingFieldsMessage)
      return
    }
    const result = await login(email, password)
    if (result && !result.success) {
      setError(result.error || t("login.invalidCredentials", "Invalid credentials"))
    }
  }

  const handleForgotPassword = () => {
    navigation.navigate("ForgotPassword")
  }

  return (
    <AuthScreenLayout>
      <AuthHeader title={signInLabel} onBack={() => navigation.goBack()} />

      <AuthWelcome title={welcomeTitle} subtitle={welcomeSubtitle} />

      <View style={styles.inputContainer}>
        <AuthTextField
          label={emailLabel}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <AuthPasswordField label={passwordLabel} value={password} onChangeText={setPassword} />

        <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPasswordContainer}>
          <Text style={styles.forgotPasswordText}>{forgotPasswordLabel}</Text>
        </TouchableOpacity>
      </View>

      <AuthErrorMessage>{error}</AuthErrorMessage>

      <AuthPrimaryButton
        title={signInLabel}
        loading={loading}
        loadingLabel={signingInLabel}
        onPress={handleLogin}
      />

      <AuthFooterLink
        prefixText={noAccountLabel}
        linkText={signUpLabel}
        onPress={() => navigation.navigate("SignUp")}
      />
    </AuthScreenLayout>
  )
}

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: scaleDimension(24),
    width: "100%",
  },
  forgotPasswordContainer: {
    alignItems: "flex-end",
  },
  forgotPasswordText: {
    color: "#8B5CF6",
    fontSize: scaleFont(14),
    fontWeight: "500",
  },
})
