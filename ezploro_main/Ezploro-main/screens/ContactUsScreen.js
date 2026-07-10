"use client"
import { useState } from "react"
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  TextInput,
  Alert,
  KeyboardAvoidingView,
} from "react-native"
import { Text, Switch } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../context/ThemeContext"
import { useAuth } from "../context/AuthContext"
import { useContact } from "../hooks/useContact"

export default function ContactUsScreen({ navigation }) {
  const { darkMode } = useTheme()
  const { user, token } = useAuth()
  const { loading, sendContactMessage, validateContactData } = useContact()
  const [name, setName] = useState(user?.display_name || user?.name || "")
  const [email, setEmail] = useState(user?.email || "")
  const [message, setMessage] = useState("")
  const [newsletter, setNewsletter] = useState(false)
  const [errors, setErrors] = useState([])

  // Verificar si el usuario está logueado
  if (!user || !token) {
    return (
      <SafeAreaView style={[styles.safeArea, darkMode && styles.safeAreaDark]}>
        <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
        <View style={[styles.container, darkMode && styles.containerDark]}>
          <View style={[styles.header, darkMode && styles.headerDark]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={darkMode ? "#fff" : "#000"} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, darkMode && styles.headerTitleDark]}>Contact Us</Text>
          </View>

          <View style={styles.loginRequiredContainer}>
            <Ionicons name="lock-closed" size={64} color={darkMode ? "#666" : "#ccc"} />
            <Text style={[styles.loginRequiredTitle, darkMode && styles.loginRequiredTitleDark]}>
              Login Required
            </Text>
            <Text style={[styles.loginRequiredText, darkMode && styles.loginRequiredTextDark]}>
              You need to be logged in to send us a message. Please log in to your account first.
            </Text>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginButtonText}>Go to Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  const sendMessage = async () => {
    // Clear previous errors
    setErrors([])

    // Validate data using the hook
    const contactData = { name, email, message, newsletter }
    const validation = validateContactData(contactData)

    if (!validation.isValid) {
      setErrors(validation.errors)
      Alert.alert("Validation Error", validation.errors.join('\n'))
      return
    }

    // Send message using the hook
    const success = await sendContactMessage(
      contactData,
      (result) => {
        // Success callback
        Alert.alert("Success", "Your message has been sent successfully!", [
          {
            text: "OK",
            onPress: () => {
              // Clear form
              setName(user?.display_name || user?.name || "")
              setEmail(user?.email || "")
              setMessage("")
              setNewsletter(false)
              setErrors([])
              navigation.goBack()
            },
          },
        ])
      },
      (error) => {
        // Error callback
        const errorMessage = error.message || "Failed to send message. Please try again."
        Alert.alert("Error", errorMessage)
      }
    )
  }

  return (
    <SafeAreaView style={[styles.safeArea, darkMode && styles.safeAreaDark]}>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
      <KeyboardAvoidingView
        style={[styles.container, darkMode && styles.containerDark]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[styles.header, darkMode && styles.headerDark]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={darkMode ? "#fff" : "#000"} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, darkMode && styles.headerTitleDark]}>Contact Us</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.section, darkMode && styles.sectionDark]}>
            <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>Get in Touch</Text>
            <Text style={[styles.sectionSubtitle, darkMode && styles.sectionSubtitleDark]}>
              We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </Text>
          </View>

          <View style={[styles.form, darkMode && styles.formDark]}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, darkMode && styles.labelDark]}>Name *</Text>
              <TextInput
                style={[
                  styles.input,
                  darkMode && styles.inputDark,
                  errors.some(e => e.includes('Name')) && styles.inputError
                ]}
                value={name}
                onChangeText={(text) => {
                  setName(text)
                  // Clear name-related errors when user starts typing
                  setErrors(prev => prev.filter(e => !e.includes('Name')))
                }}
                placeholder="Your name"
                placeholderTextColor={darkMode ? "#aaa" : "#666"}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, darkMode && styles.labelDark]}>Email *</Text>
              <TextInput
                style={[
                  styles.input,
                  darkMode && styles.inputDark,
                  errors.some(e => e.includes('Email') || e.includes('email')) && styles.inputError
                ]}
                value={email}
                onChangeText={(text) => {
                  setEmail(text)
                  // Clear email-related errors when user starts typing
                  setErrors(prev => prev.filter(e => !e.includes('Email') && !e.includes('email')))
                }}
                placeholder="your.email@example.com"
                placeholderTextColor={darkMode ? "#aaa" : "#666"}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, darkMode && styles.labelDark]}>Message *</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.messageInput,
                  darkMode && styles.inputDark,
                  errors.some(e => e.includes('Message')) && styles.inputError
                ]}
                value={message}
                onChangeText={(text) => {
                  setMessage(text)
                  // Clear message-related errors when user starts typing
                  setErrors(prev => prev.filter(e => !e.includes('Message')))
                }}
                placeholder="Tell us how we can help you..."
                placeholderTextColor={darkMode ? "#aaa" : "#666"}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              <Text style={styles.characterCount}>
                {message.length}/500 characters
              </Text>
            </View>

            <View style={styles.checkboxGroup}>
              <View style={styles.checkboxRow}>
                <Switch
                  value={newsletter}
                  onValueChange={setNewsletter}
                  color="#6200EE"
                />
                <Text style={[styles.checkboxLabel, darkMode && styles.checkboxLabelDark]}>
                  Subscribe to our newsletter for updates and event notifications
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, darkMode && styles.footerDark]}>
          <TouchableOpacity
            style={[styles.sendButton, loading && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={loading}
          >
            <Text style={styles.sendButtonText}>
              {loading ? "Sending..." : "Send Message"}
            </Text>
          </TouchableOpacity>
        </View>
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
  safeAreaDark: {
    backgroundColor: "#181A20",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  containerDark: {
    backgroundColor: "#181A20",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerDark: {
    borderBottomColor: "#333644",
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  headerTitleDark: {
    color: "#fff",
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionDark: {
    backgroundColor: "#181A20",
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  sectionTitleDark: {
    color: "#fff",
  },
  sectionSubtitle: {
    fontSize: 16,
    color: "#666",
    lineHeight: 22,
  },
  sectionSubtitleDark: {
    color: "#aaa",
  },
  form: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  formDark: {
    backgroundColor: "#181A20",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  labelDark: {
    color: "#fff",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#f8f9fa",
    color: "#000",
  },
  inputDark: {
    backgroundColor: "#23243a",
    borderColor: "#333644",
    color: "#fff",
  },
  messageInput: {
    height: 120,
    paddingTop: 12,
  },
  checkboxGroup: {
    marginTop: 10,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#666",
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  checkboxLabelDark: {
    color: "#aaa",
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  footerDark: {
    borderTopColor: "#333644",
  },
  sendButton: {
    backgroundColor: "#6200EE",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  inputError: {
    borderColor: "#FF3B30",
    borderWidth: 2,
  },
  characterCount: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
    marginTop: 4,
  },
  loginRequiredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  loginRequiredTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginTop: 20,
    marginBottom: 12,
    textAlign: "center",
  },
  loginRequiredTitleDark: {
    color: "#fff",
  },
  loginRequiredText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  loginRequiredTextDark: {
    color: "#aaa",
  },
  loginButton: {
    backgroundColor: "#6200EE",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
})