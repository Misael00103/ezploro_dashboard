import React from "react"
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  ScrollView,
} from "react-native"
import { Text } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from 'expo-linear-gradient'
import { useTheme } from "../context/ThemeContext"

export default function TermsOfServiceScreen({ navigation }) {
  const { darkMode } = useTheme()

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
            <Text style={styles.headerTitle}>Terms of Service</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.content}>
            <View style={[styles.section, darkMode && styles.sectionDark]}>
              <Text style={[styles.lastUpdated, darkMode && styles.lastUpdatedDark]}>
                Last updated: December 2024
              </Text>

              <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>1. Acceptance of Terms</Text>
              <Text style={[styles.paragraph, darkMode && styles.paragraphDark]}>
                By accessing and using Scape Events, you accept and agree to be bound by the terms and provision of this agreement.
              </Text>

              <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>2. Use License</Text>
              <Text style={[styles.paragraph, darkMode && styles.paragraphDark]}>
                Permission is granted to temporarily download one copy of Scape Events for personal, non-commercial transitory viewing only.
              </Text>

              <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>3. User Accounts</Text>
              <Text style={[styles.paragraph, darkMode && styles.paragraphDark]}>
                You are responsible for safeguarding the password and for maintaining the confidentiality of your account.
              </Text>

              <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>4. Event Creation and Management</Text>
              <Text style={[styles.paragraph, darkMode && styles.paragraphDark]}>
                Users may create events through the platform. Event creators are responsible for the accuracy of event information and compliance with local laws.
              </Text>

              <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>5. Content Guidelines</Text>
              <Text style={[styles.paragraph, darkMode && styles.paragraphDark]}>
                Users must not post content that is illegal, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable.
              </Text>

              <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>6. Privacy</Text>
              <Text style={[styles.paragraph, darkMode && styles.paragraphDark]}>
                Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service.
              </Text>

              <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>7. Termination</Text>
              <Text style={[styles.paragraph, darkMode && styles.paragraphDark]}>
                We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability.
              </Text>

              <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>8. Changes to Terms</Text>
              <Text style={[styles.paragraph, darkMode && styles.paragraphDark]}>
                We reserve the right to modify these terms at any time. We will notify users of any changes by posting the new Terms of Service on this page.
              </Text>

              <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>9. Contact Information</Text>
              <Text style={[styles.paragraph, darkMode && styles.paragraphDark]}>
                If you have any questions about these Terms of Service, please contact us at legal@scapeevents.com
              </Text>
            </View>
          </ScrollView>
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
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 24,
  },
  sectionDark: {
    backgroundColor: 'rgba(31, 34, 42, 0.95)',
  },
  lastUpdated: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
    fontStyle: "italic",
  },
  lastUpdatedDark: {
    color: "#B8B8D9",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitleDark: {
    color: "#fff",
  },
  paragraph: {
    fontSize: 16,
    color: "#555",
    lineHeight: 24,
    marginBottom: 16,
    textAlign: "justify",
  },
  paragraphDark: {
    color: "#B8B8D9",
  },
})