import React, { useState } from "react"
import { View, Text, StyleSheet } from "react-native"
import LocationSelector from "../LocationSelector"

const LocationSelectorTest = () => {
  const [selectedLocation, setSelectedLocation] = useState({
    name: "Santo Domingo, Dominican Republic",
    coordinates: { latitude: 18.492972574394607, longitude: -69.90878456827315 }
  })

  const handleLocationChange = (location) => {
    console.log("🧪 Test: Location changed to:", location)
    setSelectedLocation(location)
  }

  const handleUseCurrentLocation = () => {
    console.log("🧪 Test: Use current location requested")
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Location Selector Test</Text>
      
      <LocationSelector
        cityName={selectedLocation.name}
        onLocationChange={handleLocationChange}
        onUseCurrentLocation={handleUseCurrentLocation}
        isManualLocation={true}
        processedEvents={[]}
      />
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Selected Location:</Text>
        <Text style={styles.infoText}>Name: {selectedLocation.name}</Text>
        <Text style={styles.infoText}>
          Coordinates: {selectedLocation.coordinates?.latitude?.toFixed(4)}, {selectedLocation.coordinates?.longitude?.toFixed(4)}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F23",
    padding: 20,
    paddingTop: 60,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  infoContainer: {
    marginTop: 30,
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  infoTitle: {
    color: "#8B5CF6",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  infoText: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 5,
  },
})

export default LocationSelectorTest