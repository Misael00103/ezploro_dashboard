import React from "react";
import { View, TouchableOpacity, Text, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const ProfileTabs = ({ tabs, activeTab, onChange, accentColor = '#8B5CF6', inactiveColor = '#666', darkMode = false }) => {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.tabRow}
      contentContainerStyle={styles.tabContent}
    >
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tabButton,
            activeTab === tab.key && styles.activeTabButton,
          ]}
          onPress={() => onChange(tab.key)}
        >
          <Ionicons
            name={tab.icon}
            size={18}
            color={activeTab === tab.key ? accentColor : inactiveColor}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: activeTab === tab.key ? accentColor : inactiveColor },
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  tabRow: {
    flexGrow: 0,
  },
  tabContent: {
    paddingHorizontal: 20,
    gap: 20,
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    gap: 6,
  },
  activeTabButton: {
    backgroundColor: "#E3F2FD",
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
});

export default ProfileTabs;