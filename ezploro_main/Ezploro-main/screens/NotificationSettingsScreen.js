"use client"
import { useState, useEffect } from "react"
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
} from "react-native"
import { Text, Switch } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../context/ThemeContext"
import { useAuth } from "../context/AuthContext"
import { BASE_URL_IMAGE } from "../config"
import AsyncStorage from "@react-native-async-storage/async-storage"

// Consistent color palette
const PRIMARY_COLOR = '#4A90E2'
const ACCENT_COLOR = '#8B5CF6'
const BACKGROUND_DARK = '#0F0F23'
const CARD_BACKGROUND_DARK = '#1F222A'
const TEXT_PRIMARY_DARK = '#fff'
const TEXT_SECONDARY_DARK = '#B8B8D9'
const DIVIDER_COLOR_DARK = '#3A3F47'

const NOTIFICATION_TYPES = [
  { key: "likes", label: "Likes", description: "When someone likes your posts or events" },
  { key: "comments", label: "Comments", description: "When someone comments on your content" },
  { key: "events", label: "Events", description: "Event reminders and updates" },
  { key: "social", label: "Social", description: "Friend requests and follows" },
  { key: "marketing", label: "Marketing", description: "Promotional content and offers" },
  { key: "reminders", label: "Reminders", description: "Event and task reminders" },
]

export default function NotificationSettingsScreen({ navigation }) {
  const { darkMode } = useTheme()
  const { user } = useAuth()
  const [preferences, setPreferences] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      const token = await AsyncStorage.getItem("token")
      const response = await fetch(`${BASE_URL_IMAGE}/api/notifications/preferences`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        const prefs = {}
        NOTIFICATION_TYPES.forEach(type => {
          const pref = data.preferences?.find(p => p.type === type.key)
          prefs[type.key] = {
            pushEnabled: pref?.pushEnabled ?? true,
            emailEnabled: pref?.emailEnabled ?? true,
          }
        })
        setPreferences(prefs)
      }
    } catch (error) {
      console.error("Error fetching preferences:", error)
    } finally {
      setLoading(false)
    }
  }

  const updatePreference = async (type, field, value) => {
    try {
      const newPrefs = {
        ...preferences,
        [type]: {
          ...preferences[type],
          [field]: value,
        }
      }
      setPreferences(newPrefs)

      const token = await AsyncStorage.getItem("token")
      const preferencesArray = Object.entries(newPrefs).map(([key, pref]) => ({
        type: key,
        isEnabled: pref.pushEnabled || pref.emailEnabled,
        pushEnabled: pref.pushEnabled,
        emailEnabled: pref.emailEnabled,
      }))

      await fetch(`${BASE_URL_IMAGE}/api/notifications/preferences`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ preferences: preferencesArray }),
      })
    } catch (error) {
      console.error("Error updating preferences:", error)
      Alert.alert("Error", "Failed to update notification preferences")
    }
  }

  const renderNotificationType = (type) => (
    <View key={type.key} style={[styles.notificationItem, darkMode && styles.notificationItemDark]}>
      <View style={styles.notificationInfo}>
        <Text style={[styles.notificationLabel, darkMode && styles.notificationLabelDark]}>
          {type.label}
        </Text>
        <Text style={[styles.notificationDescription, darkMode && styles.notificationDescriptionDark]}>
          {type.description}
        </Text>
      </View>
      <View style={styles.switchContainer}>
        <View style={styles.switchRow}>
          <Ionicons name="phone-portrait-outline" size={16} color={darkMode ? "#aaa" : "#666"} />
          <Switch
            value={preferences[type.key]?.pushEnabled ?? true}
            onValueChange={(value) => updatePreference(type.key, "pushEnabled", value)}
            color={ACCENT_COLOR}
          />
        </View>
        <View style={styles.switchRow}>
          <Ionicons name="mail-outline" size={16} color={darkMode ? "#aaa" : "#666"} />
          <Switch
            value={preferences[type.key]?.emailEnabled ?? true}
            onValueChange={(value) => updatePreference(type.key, "emailEnabled", value)}
            color={ACCENT_COLOR}
          />
        </View>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={[styles.safeArea, darkMode && styles.safeAreaDark]}>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
      <View style={[styles.container, darkMode && styles.containerDark]}>
        <View style={[styles.header, darkMode && styles.headerDark]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={darkMode ? "#fff" : "#000"} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, darkMode && styles.headerTitleDark]}>Push Notifications</Text>
        </View>

        <ScrollView style={styles.content}>
          <View style={[styles.section, darkMode && styles.sectionDark]}>
            <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>Notification Types</Text>
            <Text style={[styles.sectionSubtitle, darkMode && styles.sectionSubtitleDark]}>
              Choose which notifications you want to receive via push and email
            </Text>
          </View>

          <View style={[styles.legendContainer, darkMode && styles.legendContainerDark]}>
            <View style={styles.legendItem}>
              <Ionicons name="phone-portrait-outline" size={16} color={darkMode ? "#aaa" : "#666"} />
              <Text style={[styles.legendText, darkMode && styles.legendTextDark]}>Push</Text>
            </View>
            <View style={styles.legendItem}>
              <Ionicons name="mail-outline" size={16} color={darkMode ? "#aaa" : "#666"} />
              <Text style={[styles.legendText, darkMode && styles.legendTextDark]}>Email</Text>
            </View>
          </View>

          {NOTIFICATION_TYPES.map(renderNotificationType)}
        </ScrollView>
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
  safeAreaDark: {
    backgroundColor: BACKGROUND_DARK,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  containerDark: {
    backgroundColor: BACKGROUND_DARK,
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
    borderBottomColor: DIVIDER_COLOR_DARK,
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
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sectionDark: {
    borderBottomColor: DIVIDER_COLOR_DARK,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  sectionTitleDark: {
    color: "#fff",
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  sectionSubtitleDark: {
    color: "#aaa",
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "#f8f9fa",
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 12,
  },
  legendContainerDark: {
    backgroundColor: CARD_BACKGROUND_DARK,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
  },
  legendText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  legendTextDark: {
    color: "#aaa",
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  notificationItemDark: {
    borderBottomColor: DIVIDER_COLOR_DARK,
  },
  notificationInfo: {
    flex: 1,
    marginRight: 16,
  },
  notificationLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  notificationLabelDark: {
    color: "#fff",
  },
  notificationDescription: {
    fontSize: 12,
    color: "#666",
    lineHeight: 16,
  },
  notificationDescriptionDark: {
    color: "#aaa",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 16,
  },
})