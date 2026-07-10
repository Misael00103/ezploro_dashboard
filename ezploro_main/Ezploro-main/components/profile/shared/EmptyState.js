import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const EmptyState = ({ activeTab, darkMode = false }) => {
  const getEmptyMessage = () => {
    switch (activeTab) {
      case "myEvents":
        return "No events created yet";
      case "posts":
        return "No posts yet";
      case "pastEvents":
        return "No past events";
      case "subscribedEvents":
      case "subscribed":
        return "No subscribed events";
      case "events":
        return "No events found";
      default:
        return "Nothing to show";
    }
  };

  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="sad-outline" size={48} color={darkMode ? "#ccc" : "#666"} />
      <Text style={[styles.emptyText, darkMode && styles.emptyTextDark]}>
        {getEmptyMessage()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    marginTop: 12,
    textAlign: "center",
  },
  emptyTextDark: {
    color: "#666",
  },
});

export default EmptyState;