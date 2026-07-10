import React from "react"
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  ScrollView,
  Linking,
} from "react-native"
import { Text } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from 'expo-linear-gradient'
import { useTheme } from "../context/ThemeContext"

const FAQ_ITEMS = [
  {
    question: "How do I create an event?",
    answer: "Tap the '+' button on the Events tab, fill in the event details, and publish your event."
  },
  {
    question: "How do I invite people to my event?",
    answer: "Open your event and tap 'Invite' to share with friends or make it public for anyone to join."
  },
  {
    question: "Can I edit my event after publishing?",
    answer: "Yes, go to your event and tap 'Edit' to modify details. Attendees will be notified of changes."
  },
  {
    question: "How do I find events near me?",
    answer: "Use the Map tab to see events in your area or search by location in the Events tab."
  },
  {
    question: "What are points and how do I earn them?",
    answer: "Points are earned by creating events, attending events, and engaging with the community."
  }
]

export default function HelpCenterScreen({ navigation }) {
  const { darkMode } = useTheme()

  const openSupport = () => {
    Linking.openURL('mailto:support@scapeevents.com?subject=Help Request')
  }

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
            <Text style={styles.headerTitle}>Help Center</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.content}>
            <View style={[styles.section, darkMode && styles.sectionDark]}>
              <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>Frequently Asked Questions</Text>
              
              {FAQ_ITEMS.map((item, index) => (
                <View key={index} style={styles.faqItem}>
                  <Text style={[styles.question, darkMode && styles.questionDark]}>{item.question}</Text>
                  <Text style={[styles.answer, darkMode && styles.answerDark]}>{item.answer}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.section, darkMode && styles.sectionDark]}>
              <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>Contact Support</Text>
              
              <TouchableOpacity style={styles.contactItem} onPress={openSupport}>
                <Ionicons name="mail-outline" size={24} color="#007AFF" />
                <View style={styles.contactInfo}>
                  <Text style={[styles.contactTitle, darkMode && styles.contactTitleDark]}>Email Support</Text>
                  <Text style={[styles.contactDescription, darkMode && styles.contactDescriptionDark]}>
                    Get help via email within 24 hours
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.contactItem}>
                <Ionicons name="chatbubble-outline" size={24} color="#007AFF" />
                <View style={styles.contactInfo}>
                  <Text style={[styles.contactTitle, darkMode && styles.contactTitleDark]}>Live Chat</Text>
                  <Text style={[styles.contactDescription, darkMode && styles.contactDescriptionDark]}>
                    Chat with our support team
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={[styles.section, darkMode && styles.sectionDark]}>
              <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>App Information</Text>
              
              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, darkMode && styles.infoLabelDark]}>Version</Text>
                <Text style={[styles.infoValue, darkMode && styles.infoValueDark]}>1.0.0</Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={[styles.infoLabel, darkMode && styles.infoLabelDark]}>Last Updated</Text>
                <Text style={[styles.infoValue, darkMode && styles.infoValueDark]}>December 2024</Text>
              </View>
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
    padding: 20,
    marginBottom: 16,
  },
  sectionDark: {
    backgroundColor: 'rgba(31, 34, 42, 0.95)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  sectionTitleDark: {
    color: "#fff",
  },
  faqItem: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f0f0f0",
  },
  question: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  questionDark: {
    color: "#fff",
  },
  answer: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  answerDark: {
    color: "#B8B8D9",
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f0f0f0",
  },
  contactInfo: {
    flex: 1,
    marginLeft: 16,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  contactTitleDark: {
    color: "#fff",
  },
  contactDescription: {
    fontSize: 14,
    color: "#666",
  },
  contactDescriptionDark: {
    color: "#B8B8D9",
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: 16,
    color: "#333",
  },
  infoLabelDark: {
    color: "#fff",
  },
  infoValue: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  infoValueDark: {
    color: "#B8B8D9",
  },
})