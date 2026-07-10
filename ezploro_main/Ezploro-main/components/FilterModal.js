import React from "react"
import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet, Platform } from "react-native"
import { Ionicons } from "@expo/vector-icons"

const FilterModal = ({
  visible,
  selectedFilter,
  selectedCategory,
  filterCategories,
  onClose,
  onFilterSelect,
  onCategoryToggle,
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Events</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* All Events Option */}
            <TouchableOpacity
              style={[styles.categoryItem, selectedFilter === "all_events" && styles.categoryItemActive]}
              onPress={() => {
                onFilterSelect("all_events", null, null)
                onClose()
              }}
            >
              <Ionicons name="grid-outline" size={20} color={selectedFilter === "all_events" ? "#8B5CF6" : "#B8B8B8"} />
              <Text style={styles.categoryLabel}>Todos los Eventos</Text>
              {selectedFilter === "all_events" && <Ionicons name="checkmark" size={20} color="#8B5CF6" />}
            </TouchableOpacity>

            {/* Categories with Subcategories */}
            {Object.entries(filterCategories).map(([categoryKey, category]) => (
              <View key={categoryKey} style={styles.categorySection}>
                <TouchableOpacity
                  style={[styles.categoryItem, selectedFilter === categoryKey && styles.categoryItemActive]}
                  onPress={() => {
                    if (selectedCategory === categoryKey) {
                      onCategoryToggle(null)
                    } else {
                      onCategoryToggle(categoryKey)
                    }
                  }}
                >
                  <Ionicons
                    name={category.icon}
                    size={20}
                    color={selectedFilter === categoryKey ? category.color : "#B8B8B8"}
                  />
                  <Text style={styles.categoryLabel}>{category.label}</Text>
                  <Ionicons
                    name={selectedCategory === categoryKey ? "chevron-up" : "chevron-down"}
                    size={16}
                    color="#B8B8B8"
                  />
                </TouchableOpacity>

                {/* Subcategories */}
                {selectedCategory === categoryKey && (
                  <View style={styles.subcategoriesContainer}>
                    {/* Main Category Option */}
                    <TouchableOpacity
                      style={[styles.subcategoryItem, selectedFilter === categoryKey && styles.subcategoryItemActive]}
                      onPress={() => {
                        onFilterSelect(categoryKey, categoryKey, null)
                        onClose()
                      }}
                    >
                      <Text style={styles.subcategoryLabel}>Todos {category.label}</Text>
                      {selectedFilter === categoryKey && <Ionicons name="checkmark" size={16} color="#8B5CF6" />}
                    </TouchableOpacity>

                    {/* Individual Subcategories */}
                    {category.subcategories.map((subcategory) => (
                      <TouchableOpacity
                        key={subcategory.name}
                        style={[
                          styles.subcategoryItem,
                          selectedFilter === subcategory.name && styles.subcategoryItemActive,
                        ]}
                        onPress={() => {
                          onFilterSelect(subcategory.name, categoryKey, subcategory.name)
                          onClose()
                        }}
                      >
                        <Ionicons
                          name={subcategory.icon}
                          size={16}
                          color={selectedFilter === subcategory.name ? subcategory.color : "#B8B8B8"}
                        />
                        <Text style={styles.subcategoryLabel}>{subcategory.label}</Text>
                        {selectedFilter === subcategory.name && <Ionicons name="checkmark" size={16} color="#8B5CF6" />}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#0F0F23",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  categorySection: {
    marginBottom: 8,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryItemActive: {
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    borderWidth: 1,
    borderColor: "#8B5CF6",
  },
  categoryLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 12,
    flex: 1,
  },
  subcategoriesContainer: {
    marginLeft: 16,
    marginBottom: 8,
  },
  subcategoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 8,
    marginBottom: 4,
  },
  subcategoryItemActive: {
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.5)",
  },
  subcategoryLabel: {
    color: "#B8B8B8",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
    flex: 1,
  },
})

export default FilterModal
