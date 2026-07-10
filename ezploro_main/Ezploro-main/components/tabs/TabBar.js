import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"

const ACCENT_COLOR = "#8B5CF6"

const TabBar = ({ tabs = [], activeTab, onTabChange, darkMode = false }) => {
  return (
    <View style={[styles.container, darkMode && styles.containerDark]}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab, 
              activeTab === tab.key && styles.activeTab, 
              darkMode && styles.tabDark
            ]}
            onPress={() => onTabChange(tab.key)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={tab.icon}
              size={20}
              color={activeTab === tab.key ? ACCENT_COLOR : darkMode ? "#aaa" : "#666"}
              style={styles.icon}
            />
            <Text style={[
              styles.tabText, 
              activeTab === tab.key && styles.activeTabText, 
              darkMode && styles.tabTextDark
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    paddingVertical: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  containerDark: {
    backgroundColor: "#181A20",
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    gap: 6,
  },
  tabDark: {
    backgroundColor: "#2A2D3A",
  },
  activeTab: {
    backgroundColor: "#E3F2FD",
  },
  icon: {
    marginRight: 4,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    marginLeft: 4,
  },
  tabTextDark: {
    color: "#aaa",
  },
  activeTabText: {
    color: ACCENT_COLOR,
    fontWeight: "600",
  },
})

export default TabBar
