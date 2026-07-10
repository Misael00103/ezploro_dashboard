import React from "react"
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"

const FiltersBar = ({
    selectedFilter,
    expandedCategory,
    hasDateFilter,
    onFilterSelect,
    onCategoryExpand,
    onDateFilterPress,
    filterCategories,
}) => {
    return (
        <View style={styles.filtersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContent}>
                {/* Botón "Todos" siempre visible */}
                <TouchableOpacity
                    style={[styles.filterPill, selectedFilter === "all_events" && !expandedCategory && styles.filterPillActive]}
                    onPress={() => {
                        onFilterSelect("all_events")
                        onCategoryExpand(null)
                    }}
                >
                    <Ionicons
                        name="grid-outline"
                        size={16}
                        color={selectedFilter === "all_events" && !expandedCategory ? "#fff" : "#1F222A"}
                        style={styles.filterIcon}
                    />
                    <Text
                        style={[styles.filterText, selectedFilter === "all_events" && !expandedCategory && styles.filterTextActive]}
                    >
                        Todos
                    </Text>
                </TouchableOpacity>

                {/* Botón de Calendario para filtro por fecha */}
                <TouchableOpacity
                    style={[styles.calendarButton, hasDateFilter && styles.calendarButtonActive]}
                    onPress={onDateFilterPress}
                >
                    <View style={styles.calendarIconContainer}>
                        <Ionicons name="calendar-outline" size={16} color={hasDateFilter ? "#8B5CF6" : "#666"} />
                        {hasDateFilter && (
                            <View style={styles.calendarBadge}>
                                <Text style={styles.calendarBadgeText}>1</Text>
                            </View>
                        )}
                    </View>
                </TouchableOpacity>

                {/* Si no hay categoría expandida, mostrar todas las categorías */}
                {!expandedCategory &&
                    Object.entries(filterCategories).map(([categoryKey, category]) => (
                        <TouchableOpacity
                            key={categoryKey}
                            style={[styles.filterPill, selectedFilter === categoryKey && styles.filterPillActive]}
                            onPress={() => {
                                if (selectedFilter === categoryKey) {
                                    onCategoryExpand(categoryKey)
                                } else {
                                    onFilterSelect(categoryKey)
                                    onCategoryExpand(null)
                                }
                            }}
                        >
                            <Ionicons
                                name={category.icon}
                                size={16}
                                color={selectedFilter === categoryKey ? category.color : "#666"}
                                style={styles.filterIcon}
                            />
                            <Text style={[styles.filterText, selectedFilter === categoryKey && styles.filterTextActive]}>
                                {category.label}
                            </Text>
                        </TouchableOpacity>
                    ))}

                {/* Si hay una categoría expandida, mostrar sus subcategorías */}
                {expandedCategory && (
                    <>
                        {/* Botón X para cerrar subcategorías */}
                        <TouchableOpacity
                            style={[styles.filterPill, styles.closeFilterPill]}
                            onPress={() => onCategoryExpand(null)}
                        >
                            <Ionicons name="close-outline" size={18} color="#666" />
                        </TouchableOpacity>

                        {/* Opción "Todos" de la categoría */}
                        <TouchableOpacity
                            style={[styles.filterPill, selectedFilter === expandedCategory && styles.filterPillActive]}
                            onPress={() => onFilterSelect(expandedCategory)}
                        >
                            <Ionicons
                                name={filterCategories[expandedCategory].icon}
                                size={16}
                                color={selectedFilter === expandedCategory ? filterCategories[expandedCategory].color : "#666"}
                                style={styles.filterIcon}
                            />
                            <Text style={[styles.filterText, selectedFilter === expandedCategory && styles.filterTextActive]}>
                                Todos {filterCategories[expandedCategory].label}
                            </Text>
                        </TouchableOpacity>

                        {/* Subcategorías */}
                        {filterCategories[expandedCategory].subcategories.map((subcategory) => (
                            <TouchableOpacity
                                key={subcategory.name}
                                style={[styles.filterPill, selectedFilter === subcategory.name && styles.filterPillActive]}
                                onPress={() => onFilterSelect(subcategory.name)}
                            >
                                <Ionicons
                                    name={subcategory.icon}
                                    size={16}
                                    color={selectedFilter === subcategory.name ? subcategory.color : "#666"}
                                    style={styles.filterIcon}
                                />
                                <Text style={[styles.filterText, selectedFilter === subcategory.name && styles.filterTextActive]}>
                                    {subcategory.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </>
                )}
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    filtersContainer: {
        marginBottom: 20,
    },
    filtersContent: {
        paddingHorizontal: 20,
    },
    filterPill: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        marginRight: 12,
    },
    filterPillActive: {
        backgroundColor: "#8B5CF6",
    },
    closeFilterPill: {
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.2)",
        minWidth: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    calendarButton: {
        backgroundColor: "#fff",
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 12,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    calendarButtonActive: {
        backgroundColor: "#f0f0ff",
        borderWidth: 1,
        borderColor: "#8B5CF6",
    },
    calendarIconContainer: {
        position: "relative",
    },
    calendarBadge: {
        position: "absolute",
        top: -8,
        right: -8,
        backgroundColor: "#FF4757",
        borderRadius: 8,
        width: 16,
        height: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    calendarBadgeText: {
        color: "#fff",
        fontSize: 10,
        fontWeight: "bold",
    },
    filterIcon: {
        marginRight: 6,
    },
    filterText: {
        color: "rgba(255, 255, 255, 0.7)",
        fontSize: 14,
        fontWeight: "500",
    },
    filterTextActive: {
        color: "#fff",
        fontWeight: "600",
    },
})

export default FiltersBar
