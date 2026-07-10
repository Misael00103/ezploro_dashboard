import React, { useState } from "react"
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  ScrollView,
} from "react-native"
import { Text, Switch } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from 'expo-linear-gradient'
import { useTheme } from "../context/ThemeContext"

export default function EmailNotificationsScreen({ navigation }) {
  const { darkMode } = useTheme()
  const [eventReminders, setEventReminders] = useState(true)
  const [eventUpdates, setEventUpdates] = useState(true)
  const [newFollowers, setNewFollowers] = useState(false)
  const [weeklyDigest, setWeeklyDigest] = useState(true)
  const [promotionalEmails, setPromotionalEmails] = useState(false)

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
            <Text style={styles.headerTitle}>Email Notifications</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.content}>
            <View style={[styles.section, darkMode && styles.sectionDark]}>
              <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>Event Notifications</Text>
              
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, darkMode && styles.settingLabelDark]}>Event reminders</Text>
                  <Text style={[styles.settingDescription, darkMode && styles.settingDescriptionDark]}>
                    Get reminded about upcoming events you're attending
                  </Text>
                </View>
                <Switch value={eventReminders} onValueChange={setEventReminders} />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, darkMode && styles.settingLabelDark]}>Event updates</Text>
                  <Text style={[styles.settingDescription, darkMode && styles.settingDescriptionDark]}>
                    Receive updates when event details change
                  </Text>
                </View>
                <Switch value={eventUpdates} onValueChange={setEventUpdates} />
              </View>
            </View>

            <View style={[styles.section, darkMode && styles.sectionDark]}>
              <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>Social Notifications</Text>
              
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, darkMode && styles.settingLabelDark]}>New followers</Text>
                  <Text style={[styles.settingDescription, darkMode && styles.settingDescriptionDark]}>
                    Get notified when someone follows you
                  </Text>
                </View>
                <Switch value={newFollowers} onValueChange={setNewFollowers} />
              </View>
            </View>

            <View style={[styles.section, darkMode && styles.sectionDark]}>
              <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>Digest & Updates</Text>
              
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, darkMode && styles.settingLabelDark]}>Weekly digest</Text>
                  <Text style={[styles.settingDescription, darkMode && styles.settingDescriptionDark]}>
                    Weekly summary of events and activities
                  </Text>
                </View>
                <Switch value={weeklyDigest} onValueChange={setWeeklyDigest} />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, darkMode && styles.settingLabelDark]}>Promotional emails</Text>
                  <Text style={[styles.settingDescription, darkMode && styles.settingDescriptionDark]}>
                    Receive offers and promotional content
                  </Text>
                </View>
                <Switch value={promotionalEmails} onValueChange={setPromotionalEmails} />
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
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f0f0f0",
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  settingLabelDark: {
    color: "#fff",
  },
  settingDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 18,
  },
  settingDescriptionDark: {
    color: "#B8B8D9",
  },
})