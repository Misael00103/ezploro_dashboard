import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Alert, Dimensions, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

const { width } = Dimensions.get('window')

export const LocationTab = ({ event, isOnlineEvent, hasVideoUrl }) => {
    const [mapError, setMapError] = useState(false);
    // Check if event has any location data
    const hasLocationData = (eventObj) => {
        if (!eventObj) return false;

        // Check for coordinates in various formats
        const hasCoordinates = (
            (eventObj.location?.coordinates && Array.isArray(eventObj.location.coordinates)) ||
            (eventObj.coordinates && Array.isArray(eventObj.coordinates)) ||
            (eventObj.latitude && eventObj.longitude) ||
            (eventObj.location?.latitude && eventObj.location?.longitude)
        );

        // Check for address information
        const hasAddress = eventObj.address || eventObj.city;

        return hasCoordinates || hasAddress;
    };
    const openInGoogleMaps = (eventObj) => {
        console.log("🗺️ Opening Google Maps for event:", {
            event_id: eventObj?.event_id || eventObj?.id,
            location: eventObj?.location,
            coordinates: eventObj?.coordinates,
            latitude: eventObj?.latitude,
            longitude: eventObj?.longitude,
            address: eventObj?.address,
            city: eventObj?.city
        });

        let lat, lng;

        // Try multiple coordinate formats
        if (eventObj?.location?.coordinates && Array.isArray(eventObj.location.coordinates)) {
            [lng, lat] = eventObj.location.coordinates;
            console.log("✅ Found coordinates in location.coordinates:", { lat, lng });
        } else if (eventObj?.coordinates && Array.isArray(eventObj.coordinates)) {
            [lng, lat] = eventObj.coordinates;
            console.log("✅ Found coordinates in coordinates array:", { lat, lng });
        } else if (eventObj?.latitude && eventObj?.longitude) {
            lat = eventObj.latitude;
            lng = eventObj.longitude;
            console.log("✅ Found coordinates in lat/lng fields:", { lat, lng });
        } else if (eventObj?.location?.latitude && eventObj?.location?.longitude) {
            lat = eventObj.location.latitude;
            lng = eventObj.location.longitude;
            console.log("✅ Found coordinates in location.lat/lng:", { lat, lng });
        }

        // If we have coordinates, open Google Maps
        if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
            const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
            console.log("🚀 Opening Google Maps URL:", url);
            Linking.openURL(url);
            return;
        }

        // Fallback: try to open with address
        const address = eventObj?.address;
        const city = eventObj?.city;
        const state = eventObj?.state;
        const country = eventObj?.country;

        if (address || city) {
            let searchQuery = "";
            if (address) searchQuery += address;
            if (city) searchQuery += (searchQuery ? ", " : "") + city;
            if (state) searchQuery += (searchQuery ? ", " : "") + state;
            if (country) searchQuery += (searchQuery ? ", " : "") + country;

            if (searchQuery.trim()) {
                const encodedQuery = encodeURIComponent(searchQuery);
                const url = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;
                console.log("🚀 Opening Google Maps with address:", url);
                Linking.openURL(url);
                return;
            }
        }

        // No location data available
        console.log("❌ No location data available for event");
        Alert.alert(
            "Ubicación no disponible",
            "Este evento no tiene información de ubicación suficiente para abrir en Google Maps."
        );
    }

    const openVideoLink = (url) => {
        if (!url) {
            Alert.alert("Link no disponible", "Este evento no tiene un enlace de video disponible.")
            return
        }

        try {
            let validUrl = url
            if (!url.startsWith("http://") && !url.startsWith("https://")) {
                validUrl = "https://" + url
            }
            Linking.openURL(validUrl)
        } catch (error) {
            Alert.alert("Error", "No se pudo abrir el enlace. Verifica que sea una URL válida.")
        }
    }

    return (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.tabTitle}>Event Location</Text>
            <View style={styles.locationContainer}>
                {isOnlineEvent(event) ? (
                    <View style={styles.onlineEventContainer}>
                        <View style={styles.onlineEventInfo}>
                            <Ionicons name="laptop" size={48} color="#8B5CF6" />
                            <Text style={styles.onlineEventTitle}>Online Event</Text>
                            <Text style={styles.onlineEventDescription}>
                                This event will take place online. Join us from anywhere in the world!
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.joinOnlineButton}
                            onPress={() => {
                                const videoUrl = event?.video_url || event?.videoUrl || event?.event_link
                                if (hasVideoUrl(event)) {
                                    openVideoLink(videoUrl)
                                } else {
                                    Alert.alert("Link no disponible", "Este evento online aún no tiene un enlace disponible.")
                                }
                            }}
                        >
                            <LinearGradient colors={["#8B5CF6", "#7C3AED"]} style={styles.joinOnlineButtonGradient}>
                                <Ionicons name="videocam" size={24} color="#fff" />
                                <Text style={styles.joinOnlineButtonText}>
                                    {hasVideoUrl(event) ? "Join Online Event" : "Link Coming Soon"}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        {hasVideoUrl(event) && (
                            <View style={styles.onlineLinkContainer}>
                                <Text style={styles.onlineLinkLabel}>Event Link:</Text>
                                <TouchableOpacity
                                    style={styles.onlineLinkButton}
                                    onPress={() => openVideoLink(event.video_url || event.videoUrl || event.event_link)}
                                >
                                    <Text style={styles.onlineLinkText} numberOfLines={2}>
                                        {event.video_url || event.videoUrl || event.event_link}
                                    </Text>
                                    <Ionicons name="open-outline" size={16} color="#8B5CF6" />
                                </TouchableOpacity>
                            </View>
                        )}

                        {!hasVideoUrl(event) && (
                            <View style={styles.onlineLinkContainer}>
                                <Text style={styles.onlineLinkLabel}>Status:</Text>
                                <View style={styles.noLinkContainer}>
                                    <Ionicons name="time-outline" size={16} color="#FFA500" />
                                    <Text style={styles.noLinkText}>Link will be available soon</Text>
                                </View>
                            </View>
                        )}
                    </View>
                ) : (
                    <>
                        <View style={styles.locationInfo}>
                            <Ionicons name="location" size={24} color="#8B5CF6" />
                            <View style={styles.locationText}>
                                <Text style={styles.locationCity}>{event?.city || "Location"}</Text>
                                <Text style={styles.locationAddress}>
                                    {event?.address
                                        ? `${event.address}${event.address2 ? `, ${event.address2}` : ""}`
                                        : "Address not specified"}
                                </Text>
                                {event?.state && event?.country && (
                                    <Text style={styles.locationAddress}>
                                        {event.state}, {event.country}
                                    </Text>
                                )}
                            </View>
                        </View>
                        {hasLocationData(event) ? (
                            <>
                                {/* Mapa integrado */}
                                {(() => {
                                    let lat, lng;
                                    
                                    // Obtener coordenadas del evento
                                    if (event?.location?.coordinates && Array.isArray(event.location.coordinates)) {
                                        [lng, lat] = event.location.coordinates;
                                    } else if (event?.coordinates && Array.isArray(event.coordinates)) {
                                        [lng, lat] = event.coordinates;
                                    } else if (event?.latitude && event?.longitude) {
                                        lat = event.latitude;
                                        lng = event.longitude;
                                    } else if (event?.location?.latitude && event?.location?.longitude) {
                                        lat = event.location.latitude;
                                        lng = event.location.longitude;
                                    }
                                    
                                    // Si tenemos coordenadas, mostrar el mapa
                                    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
                                        const latitude = parseFloat(lat);
                                        const longitude = parseFloat(lng);
                                        
                                        return (
                                            <View style={styles.mapContainer}>
                                                {!mapError ? (
                                                    <MapView
                                                        style={styles.map}
                                                        initialRegion={{
                                                            latitude,
                                                            longitude,
                                                            latitudeDelta: 0.01,
                                                            longitudeDelta: 0.01,
                                                        }}
                                                        showsUserLocation={true}
                                                        showsMyLocationButton={true}
                                                        onError={() => setMapError(true)}
                                                    >
                                                        <Marker
                                                            coordinate={{ latitude, longitude }}
                                                            title={event?.title || "Event Location"}
                                                            description={event?.address || event?.city || "Event venue"}
                                                        >
                                                            <View style={styles.customMarker}>
                                                                <Ionicons name="location" size={30} color="#8B5CF6" />
                                                            </View>
                                                        </Marker>
                                                    </MapView>
                                                ) : (
                                                    // Fallback: Imagen estática de Google Maps
                                                    <TouchableOpacity 
                                                        style={styles.staticMapContainer}
                                                        onPress={() => openInGoogleMaps(event)}
                                                    >
                                                        <Image
                                                            source={{
                                                                uri: `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=15&size=400x200&markers=color:purple%7C${latitude},${longitude}&key=AIzaSyAr4IpigO3ZN4_Qcv8ME59x5-KjjDVY0Wc`
                                                            }}
                                                            style={styles.staticMap}
                                                            onError={() => console.log('Static map failed to load')}
                                                        />
                                                        <View style={styles.staticMapOverlay}>
                                                            <Ionicons name="location" size={40} color="#8B5CF6" />
                                                            <Text style={styles.staticMapText}>Tap to open in Maps</Text>
                                                        </View>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        );
                                    }
                                    return null;
                                })()}
                                
                                <TouchableOpacity style={styles.mapButton} onPress={() => openInGoogleMaps(event)}>
                                    <LinearGradient colors={["#8B5CF6", "#7C3AED"]} style={styles.mapButtonGradient}>
                                        <Ionicons name="navigate" size={24} color="#fff" />
                                        <Text style={styles.mapButtonText}>Open in Google Maps</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <View style={styles.noLocationContainer}>
                                <Ionicons name="location-outline" size={48} color="#ccc" />
                                <Text style={styles.noLocationText}>No location available for this event</Text>
                                <Text style={styles.noLocationSubtext}>
                                    The organizer hasn't provided location details yet
                                </Text>
                            </View>
                        )}
                    </>
                )}
            </View>
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
    locationContainer: {
        gap: 20,
    },
    onlineEventContainer: {
        alignItems: "center",
        paddingVertical: 20,
    },
    onlineEventInfo: {
        alignItems: "center",
        marginBottom: 24,
    },
    onlineEventTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#8B5CF6",
        marginTop: 16,
        marginBottom: 8,
        textAlign: "center",
    },
    onlineEventDescription: {
        fontSize: 16,
        color: "#666",
        textAlign: "center",
        lineHeight: 24,
        maxWidth: 300,
    },
    joinOnlineButton: {
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 20,
        width: "100%",
    },
    joinOnlineButtonGradient: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        paddingHorizontal: 32,
    },
    joinOnlineButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "600",
        marginLeft: 12,
    },
    onlineLinkContainer: {
        backgroundColor: "#F8F9FA",
        borderRadius: 12,
        padding: 16,
        width: "100%",
    },
    onlineLinkLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#666",
        marginBottom: 8,
    },
    onlineLinkButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#fff",
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: "#e0e0e0",
    },
    onlineLinkText: {
        fontSize: 14,
        color: "#8B5CF6",
        flex: 1,
        marginRight: 8,
        textDecorationLine: "underline",
    },
    noLinkContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF3CD",
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: "#FFEAA7",
    },
    noLinkText: {
        fontSize: 14,
        color: "#856404",
        marginLeft: 8,
        fontStyle: "italic",
    },
    locationInfo: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: "#F8F9FA",
        borderRadius: 12,
        padding: 16,
        borderLeftWidth: 4,
        borderLeftColor: "#8B5CF6",
    },
    locationText: {
        marginLeft: 12,
        flex: 1,
    },
    locationCity: {
        fontSize: 18,
        fontWeight: "600",
        color: "#0F0F23",
        marginBottom: 4,
    },
    locationAddress: {
        fontSize: 14,
        color: "#666",
        lineHeight: 20,
    },
    mapButton: {
        borderRadius: 12,
        overflow: "hidden",
    },
    mapButtonGradient: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    mapButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
        marginLeft: 8,
    },
    noLocationContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    noLocationText: {
        color: "#666",
        fontSize: 18,
        fontWeight: "600",
        textAlign: "center",
        marginTop: 16,
    },
    noLocationSubtext: {
        color: "#999",
        fontSize: 14,
        textAlign: "center",
        marginTop: 8,
        fontStyle: "italic",
    },
    mapContainer: {
        height: 200,
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#e0e0e0",
    },
    map: {
        width: "100%",
        height: "100%",
    },
    customMarker: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 5,
        borderWidth: 2,
        borderColor: "#8B5CF6",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    staticMapContainer: {
        position: "relative",
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f0f0f0",
    },
    staticMap: {
        width: "100%",
        height: "100%",
        position: "absolute",
    },
    staticMapOverlay: {
        position: "absolute",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        borderRadius: 12,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    staticMapText: {
        color: "#8B5CF6",
        fontSize: 14,
        fontWeight: "600",
        marginTop: 8,
    },
})
