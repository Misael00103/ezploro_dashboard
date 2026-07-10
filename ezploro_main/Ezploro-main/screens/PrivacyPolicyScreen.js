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

export default function PrivacyPolicyScreen({ navigation }) {
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
            <Text style={styles.headerTitle}>Privacy Policy</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.content}>
            <View style={[styles.section, darkMode && styles.sectionDark]}>
              <Text style={[styles.lastUpdated, darkMode && styles.lastUpdatedDark]}>
                Last updated: December 2024
              </Text>

              <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>1. Information We Collect</Text>
              <Text style={[styles.paragraph, darkMode && styles.paragraphDark]}>
                We collect information you provide directly to us, such as when you create an account, create events, or contact us for support.
              </Text>

              <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>2. How We Use Your Information</Text>
              <Text style={[styles.paragraph, darkMode && styles.paragraphDark]}>
                We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.
              </Text>

              <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>3. Information Sharing</Text>
              <Text style={[styles.paragraph, darkMode && styles.paragraphDark]}>
                We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.
              </Text>

              <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>4. Data Security</Text>
              <Text style={[styles.paragraph, darkMode && styles.paragraphDark]}>
                We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
              </Text>

              <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>5. Location Information</Text>
              <Text style={[styles.paragraph, darkMode && styles.paragraphDark]}>
                With your permission, we may collect and use your location information to help you discover events near you and improve our services.
              </Text>

              <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>6. Cookies and Tracking</Text>
              <Text style={[styles.paragraph, darkMode && styles.paragraphDark]}>
                We use cookies and similar tracking technologies to enhance your experience and analyze how our service is used.
              </Text>

              <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>7. Your Rights</Text>
              <Text style={[styles.paragraph, darkMode && styles.paragraphDark]}>
                You have the right to access, update, or delete your personal information. You can also opt out of certain communications from us.
              </Text>

              <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>8. Children's Privacy</Text>
              <Text style={[styles.paragraph, darkMode && styles.paragraphDark]}>
                Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13.
              </Text>

              <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>9. Changes to This Policy</Text>
              <Text style={[styles.paragraph, darkMode && styles.paragraphDark]}>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.
              </Text>

              <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>10. Contact Us</Text>
              <Text style={[styles.paragraph, darkMode && styles.paragraphDark]}>
                If you have any questions about this Privacy Policy, please contact us at privacy@scapeevents.com
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