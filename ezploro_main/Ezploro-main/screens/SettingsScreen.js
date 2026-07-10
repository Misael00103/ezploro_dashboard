
import React, { useState, useEffect } from "react"
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
import { SCREEN_HEIGHT as windowHeight } from "../constants/layout"
import { Text, Switch, Button } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "../context/AuthContext"
import { useTheme } from "../context/ThemeContext"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { API_URL_USERS_UPDATE } from "../config"

// Consistent color palette
const PRIMARY_COLOR = '#4A90E2'
const ACCENT_COLOR = '#8B5CF6'
const BACKGROUND_DARK = '#0F0F23'
const CARD_BACKGROUND_DARK = '#1F222A'
const TEXT_PRIMARY_DARK = '#fff'
const TEXT_SECONDARY_DARK = '#B8B8D9'
const DIVIDER_COLOR_DARK = '#3A3F47'

// Using SCREEN_HEIGHT from layout constants

export default function SettingsScreen({ navigation }) {
  const { logout, logoutNow, user, updateUser } = useAuth()
  const { darkMode, setDarkMode } = useTheme()
  const [showFriends, setShowFriends] = useState(true)
  const [showInQuickAdd, setShowInQuickAdd] = useState(true)
  const [onlineStatus, setOnlineStatus] = useState(user?.online_status || false)

  // Sincronizar estado local con el usuario actualizado
  useEffect(() => {
    setOnlineStatus(user?.online_status || false)
  }, [user?.online_status])
  const [loading, setLoading] = useState(false)

  // Función para cambiar estado online/offline
  const toggleOnlineStatus = async () => {
    try {
      setLoading(true)
      const newStatus = !onlineStatus
      const result = await updateUser({ online_status: newStatus })
      if (result.success) {
        setOnlineStatus(newStatus)
        Alert.alert("Success", newStatus ? "You are now online" : "You are now offline")
      } else {
        throw new Error(result.error || "Failed to update status")
      }
    } catch (error) {
      console.error("Error toggling status:", error)
      Alert.alert("Error", "Failed to update status")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      // Intentar logout normal primero
      let result = await logout()
      
      // Si falla, usar logout inmediato
      if (!result.success) {
        console.warn("⚠️ Logout normal falló, usando logout inmediato...")
        result = await logoutNow()
      }
      
      if (result.success && navigation) {
        navigation.reset({
          index: 0,
          routes: [{ name: "Welcome" }],
        })
      } else if (!navigation) {
        console.error("Navigation no disponible en SettingsScreen")
        Alert.alert("Error", "No se pudo navegar después del logout.")
      } else {
        Alert.alert("Error", "No se pudo desloguear debido a un error interno.")
      }
    } catch (error) {
      console.error("Error al desloguear:", error)
      Alert.alert("Error", "No se pudo desloguear. Intenta de nuevo.")
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, darkMode && styles.safeAreaDark]}>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
      <View style={styles.blackContainer}>
        <View style={styles.topBubble} />
        <View style={styles.bottomBubble} />
        <View style={[styles.container, darkMode && styles.containerDark]}>
        <View style={[styles.header, darkMode && styles.headerDark]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={darkMode ? "#fff" : "#000"} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, darkMode && styles.headerTitleDark]}>Settings</Text>
        </View>
        <ScrollView style={styles.content}>
          <View style={[styles.section, darkMode && styles.sectionDark]}>
            <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>Appearance</Text>
            <View style={styles.settingItem}>
              <Text style={[styles.settingLabel, darkMode && styles.settingLabelDark]}>Dark mode</Text>
              <Switch value={darkMode} onValueChange={setDarkMode} color={ACCENT_COLOR} />
            </View>
          </View>
          <View style={[styles.section, darkMode && styles.sectionDark]}>
            <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>Status</Text>
            <View style={styles.settingItem}>
              <View style={styles.statusInfo}>
                <Text style={[styles.settingLabel, darkMode && styles.settingLabelDark]}>Online status</Text>
                <Text style={[styles.statusSubtext, darkMode && styles.statusSubtextDark]}>
                  {onlineStatus ? "You appear online to others" : "You appear offline to others"}
                </Text>
              </View>
              <Switch value={onlineStatus} onValueChange={toggleOnlineStatus} color={ACCENT_COLOR} disabled={loading} />
            </View>
          </View>
          <View style={[styles.section, darkMode && styles.sectionDark]}>
            <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>Privacy</Text>
            <View style={styles.settingItem}>
              <Text style={[styles.settingLabel, darkMode && styles.settingLabelDark]}>Show my friends</Text>
              <Switch value={showFriends} onValueChange={setShowFriends} color={ACCENT_COLOR} />
            </View>
            <View style={styles.settingItem}>
              <Text style={[styles.settingLabel, darkMode && styles.settingLabelDark]}>Show me in quick add</Text>
              <Switch value={showInQuickAdd} onValueChange={setShowInQuickAdd} color={ACCENT_COLOR} />
            </View>
          </View>
          <View style={[styles.section, darkMode && styles.sectionDark]}>
            <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>Account</Text>
            <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('ChangePassword')}>
              <Text style={[styles.settingLabel, darkMode && styles.settingLabelDark]}>Change password</Text>
              <Ionicons name="chevron-forward" size={20} color={darkMode ? "#aaa" : "#666"} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('BlockedUsers')}>
              <Text style={[styles.settingLabel, darkMode && styles.settingLabelDark]}>Blocked users</Text>
              <Ionicons name="chevron-forward" size={20} color={darkMode ? "#aaa" : "#666"} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('BookmarksList')}>
              <Text style={[styles.settingLabel, darkMode && styles.settingLabelDark]}>My Bookmarks</Text>
              <Ionicons name="chevron-forward" size={20} color={darkMode ? "#aaa" : "#666"} />
            </TouchableOpacity>
          </View>
          <View style={[styles.section, darkMode && styles.sectionDark]}>
            <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>Notifications</Text>
            <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('NotificationSettings')}>
              <Text style={[styles.settingLabel, darkMode && styles.settingLabelDark]}>Push notifications</Text>
              <Ionicons name="chevron-forward" size={20} color={darkMode ? "#aaa" : "#666"} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('EmailNotifications')}>
              <Text style={[styles.settingLabel, darkMode && styles.settingLabelDark]}>Email notifications</Text>
              <Ionicons name="chevron-forward" size={20} color={darkMode ? "#aaa" : "#666"} />
            </TouchableOpacity>
          </View>
          <View style={[styles.section, darkMode && styles.sectionDark]}>
            <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>Support</Text>
            <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('HelpCenter')}>
              <Text style={[styles.settingLabel, darkMode && styles.settingLabelDark]}>Help center</Text>
              <Ionicons name="chevron-forward" size={20} color={darkMode ? "#aaa" : "#666"} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('ContactUs')}>
              <Text style={[styles.settingLabel, darkMode && styles.settingLabelDark]}>Contact us</Text>
              <Ionicons name="chevron-forward" size={20} color={darkMode ? "#aaa" : "#666"} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('TermsOfService')}>
              <Text style={[styles.settingLabel, darkMode && styles.settingLabelDark]}>Terms of service</Text>
              <Ionicons name="chevron-forward" size={20} color={darkMode ? "#aaa" : "#666"} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('PrivacyPolicy')}>
              <Text style={[styles.settingLabel, darkMode && styles.settingLabelDark]}>Privacy policy</Text>
              <Ionicons name="chevron-forward" size={20} color={darkMode ? "#aaa" : "#666"} />
            </TouchableOpacity>
          </View>
        </ScrollView>
        <View style={[styles.footer, darkMode && styles.footerDark]}>
          <Button
            mode="outlined"
            onPress={handleLogout}
            style={[styles.logoutButton, darkMode && styles.logoutButtonDark]}
            labelStyle={styles.logoutButtonLabel}
          >
            Log out
          </Button>
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
  safeAreaDark: {
    backgroundColor: BACKGROUND_DARK,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  containerDark: {
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
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
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  sectionDark: {
    borderBottomColor: DIVIDER_COLOR_DARK,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#000",
  },
  sectionTitleDark: {
    color: "#fff",
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: "#000",
  },
  settingLabelDark: {
    color: "#fff",
  },
  statusInfo: {
    flex: 1,
  },
  statusSubtext: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  statusSubtextDark: {
    color: "#aaa",
  },
  footer: {
    padding: 16,
  },
  footerDark: {
    borderTopColor: DIVIDER_COLOR_DARK,
  },
  logoutButton: {
    borderRadius: 8,
    borderColor: "#f0f0f0",
    backgroundColor: "#f9f9f9",
  },
  logoutButtonDark: {
    borderColor: DIVIDER_COLOR_DARK,
    backgroundColor: CARD_BACKGROUND_DARK,
  },
  logoutButtonLabel: {
    fontSize: 16,
    color: "#FF3B30",
  },
  blackContainer: {
    flex: 1,
    backgroundColor: BACKGROUND_DARK,
  },
  topBubble: {
    position: "absolute",
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    zIndex: 0,
  },
  bottomBubble: {
    position: "absolute",
    bottom: -80,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    zIndex: 0,
  },
})
