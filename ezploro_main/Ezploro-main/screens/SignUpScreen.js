"use client"

import { useState } from "react"
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native"
import {
  AuthDivider,
  AuthErrorMessage,
  AuthFooterLink,
  AuthHeader,
  AuthInputRow,
  AuthPasswordField,
  AuthPrimaryButton,
  AuthScreenLayout,
  AuthTextField,
  AuthWelcome,
} from "../components/auth"
import GoogleSignInButton from "../components/GoogleSignInButton"
import { useAuth } from "../context/AuthContext"
import { useTranslation } from "react-i18next"
import { scaleDimension, scaleFont } from "../utils/responsive"

export default function SignUpScreen({ navigation }) {
  const { t } = useTranslation()
  const { register, loading } = useAuth()
  const [name, setName] = useState("")
  const [lastname, setLastname] = useState("")
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isGoogleUser, setIsGoogleUser] = useState(false)
  const [googleUserData, setGoogleUserData] = useState(null)

  const validateEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value)
  }

  const handleSignUp = async () => {
    setError("")

    if (isGoogleUser && googleUserData) {
      console.log("✅ Usuario de Google ya registrado, yendo al onboarding")
      navigation.replace("Onboarding")
      return
    }

    if (!name || !lastname || !email || !username || !password || !confirmPassword) {
      setError(t("signup.fillAllFields"))
      return
    }
    if (!validateEmail(email)) {
      setError(t("signup.invalidEmail"))
      return
    }
    if (password !== confirmPassword) {
      setError(t("signup.passwordMismatch"))
      return
    }
    if (password.length < 6) {
      setError(t("signup.passwordTooShort"))
      return
    }

    const result = await register({
      email,
      password,
      username,
      name,
      lastname,
      notifications_enabled: true,
    })
    if (!result.success) {
      setError(result.error || t("signup.failed"))
      return
    }

    console.log("✅ Registro exitoso, AppNavigator manejará la navegación")
  }

  const handleGoogleSuccess = (result) => {
    console.log("✅ Google Sign-Up exitoso:", result)

    if (result.isNewUser) {
      console.log("ℹ️ Usuario nuevo, prellenando formulario con datos de Google")

      setIsGoogleUser(true)
      setGoogleUserData(result)

      setName(result.googleUserInfo?.given_name || result.user.name || "")
      setLastname(result.googleUserInfo?.family_name || "")
      setEmail(result.user.email || "")
      setUsername(result.user.username || result.googleUserInfo?.name || "")

      const placeholderPassword = "google_auth_user"
      setPassword(placeholderPassword)
      setConfirmPassword(placeholderPassword)

      Alert.alert(
        "Completa tu perfil",
        `¡Hola ${result.user.name || result.user.email}! Hemos pre-llenado tu información con los datos de Google. Puedes completar los campos adicionales o continuar así.`,
        [
          {
            text: "Continuar con Google",
            onPress: () => {
              console.log("ℹ️ Usuario de Google continuará con datos pre-llenados")
            },
          },
          {
            text: "Completar información",
            onPress: () => {
              console.log("ℹ️ Usuario de Google completará información adicional")
            },
          },
        ]
      )

      return
    }

    const welcomeMessage = t(
      "signup.googleWelcomeBack",
      `¡Bienvenido de vuelta ${result.user.name || result.user.email}!`
    )

    Alert.alert(t("signup.successTitle", "Inicio de sesión exitoso"), welcomeMessage, [
      {
        text: t("common.ok", "OK"),
        onPress: () => {
          console.log("ℹ️ Usuario existente, navegación delegada al AppNavigator")
        },
      },
    ])
  }

  const handleGoogleError = (googleError) => {
    console.error("❌ Error en Google Sign-Up:", googleError)
    setError(googleError)
  }

  const loadingContent = (
    <>
      <ActivityIndicator size="large" color="#8B5CF6" />
      <Text style={styles.loadingText}>{t("signup.creatingAccount")}</Text>
    </>
  )

  return (
    <AuthScreenLayout loading={loading} loadingContent={loadingContent}>
      <AuthHeader title={t("signup.title")} onBack={() => navigation.goBack()} />

      <AuthWelcome title={t("signup.createAccount")} subtitle={t("signup.subtitle")} />

      <View style={styles.inputContainer}>
        <AuthInputRow>
          <AuthTextField
            label={t("signup.firstName")}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            style={styles.halfInput}
          />
          <AuthTextField
            label={t("signup.lastName")}
            value={lastname}
            onChangeText={setLastname}
            autoCapitalize="words"
            style={styles.halfInput}
          />
        </AuthInputRow>

        <AuthTextField
          label={t("signup.email")}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <AuthTextField
          label={t("signup.username")}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        {!isGoogleUser ? (
          <>
            <AuthPasswordField label={t("signup.password")} value={password} onChangeText={setPassword} />
            <AuthPasswordField
              label={t("signup.confirmPassword")}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </>
        ) : null}
      </View>

      <AuthErrorMessage>{error}</AuthErrorMessage>

      <AuthPrimaryButton
        title={isGoogleUser ? t("signup.continue", "Continuar") : t("signup.createAccount")}
        loading={loading}
        loadingLabel={t("signup.creatingAccount")}
        onPress={handleSignUp}
      />

      <AuthDivider label={t("signup.or", "or")} />

      <GoogleSignInButton
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        style={styles.googleButton}
        textStyle={styles.googleButtonText}
        text="Sign up with Google"
        disabled={loading}
      />

      <AuthFooterLink
        prefixText={t("signup.haveAccount")}
        linkText={t("signup.signIn")}
        onPress={() => navigation.navigate("Login")}
      />
    </AuthScreenLayout>
  )
}

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: scaleDimension(24),
    width: "100%",
  },
  halfInput: {
    width: "48%",
  },
  googleButton: {
    marginBottom: scaleDimension(24),
    borderRadius: scaleDimension(12),
    paddingVertical: scaleDimension(16),
  },
  googleButtonText: {
    fontSize: scaleFont(16),
    fontWeight: "600",
  },
  loadingText: {
    marginTop: scaleDimension(16),
    fontSize: scaleFont(16),
    color: "#6B7280",
    textAlign: "center",
  },
})

