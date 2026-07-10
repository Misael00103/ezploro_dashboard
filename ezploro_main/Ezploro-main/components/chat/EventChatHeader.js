import React from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ActivityIndicator 
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

const EventChatHeader = ({ 
  eventTitle,
  messageCount,
  onBack,
  onSync,
  isSyncing = false
}) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <View style={styles.headerInfo}>
        <Text style={styles.headerTitle}>{eventTitle || "Event Chat"}</Text>
        <Text style={styles.statusText}>{messageCount} messages</Text>
      </View>
      <TouchableOpacity style={styles.headerAction} onPress={onSync} disabled={isSyncing}>
        {isSyncing ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons name="logo-google" size={24} color="#fff" />
        )}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "transparent",
  },
  backBtn: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 16,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  statusText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    marginTop: 2,
  },
  headerAction: {
    padding: 8,
  },
})

export default EventChatHeader