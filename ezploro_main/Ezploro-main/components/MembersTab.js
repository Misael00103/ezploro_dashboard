import React from "react"
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { UserAvatar } from "./UserAvatar"

export const MembersTab = ({ subscribers, subscribersCount, onMemberPress }) => {
  return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.tabTitle}>Members ({subscribersCount})</Text>
      {subscribers.length > 0 ? (
        subscribers.map((item, idx) => (
          <TouchableOpacity
            key={`member_${item.user?.user_id || idx}_${idx}`}
            onPress={() => onMemberPress(item.user?.user_id, item.user?.username)}
            style={styles.memberItem}
          >
            <UserAvatar userObj={item.user} size={50} />
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{item.user?.display_name || item.user?.username || "Unknown User"}</Text>
              <Text style={styles.memberUsername}>@{item.user?.username || "unknown"}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={48} color="#666" />
          <Text style={styles.emptyText}>No members yet</Text>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  tabTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0F0F23",
    marginBottom: 16,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  memberInfo: {
    marginLeft: 12,
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F0F23",
  },
  memberUsername: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
  },
})
