import React from "react"
import { View, Text, StyleSheet } from "react-native"

const EventsCounter = ({ count, filterLabel }) => {
  return (
    <View style={styles.eventsCountContainer}>
      <Text style={styles.eventsCountText}>
        {count} eventos encontrados
        {filterLabel && ` • Filtro: ${filterLabel}`}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  eventsCountContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
    marginTop: 8,
  },
  eventsCountText: {
    color: "#B8B8D9",
    fontSize: 14,
    fontWeight: "500",
  },
})

export default EventsCounter
