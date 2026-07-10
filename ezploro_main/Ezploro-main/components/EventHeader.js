import React from "react"
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useEventImageUrl } from "../hooks/useImageUrl"
import { UserAvatar } from "./UserAvatar"

const windowWidth = Dimensions.get("window").width
const windowHeight = Dimensions.get("window").height

export const EventHeader = ({
  event,
  likes,
  isLiked,
  subscribersCount,
  subscribers,
  onBack,
  onLike,
  onShare,
  formatDate,
  formatTime,
  isOnlineEvent,
  onCreatorPress,
  onMemberPress,
}) => {
  const imageUrl = useEventImageUrl(event?.cover_image);
  return (
    <ImageBackground
      source={{ uri: imageUrl }}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <LinearGradient colors={["rgba(15,15,35,0.3)", "rgba(15,15,35,0.9)"]} style={styles.overlay}>
        <SafeAreaView style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={onLike}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={24} 
                color={isLiked ? "#FF4757" : "#fff"} 
              />
              <Text style={[styles.likeCount, isLiked && { color: "#FF4757" }]}>
                {likes || 0}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={onShare}>
              <Ionicons name="share-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        <View style={styles.eventContent}>
          <Text style={styles.eventTitle}>{event?.title || "Event Title"}</Text>
          <Text style={styles.eventDescription} numberOfLines={3}>
            {event?.description || "Event description will appear here..."}
          </Text>

          <View style={styles.attendeesSection}>
            <View style={styles.attendeesContainer}>
              <View style={styles.attendeesLeft}>
                <Text style={styles.attendeesLabel}>Attendees ({subscribersCount})</Text>
                <View style={styles.attendeesList}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {subscribers.slice(0, 5).map((item, index) => (
                      <TouchableOpacity
                        key={`attendee_${item.user?.user_id || index}_${index}`}
                        onPress={() => onMemberPress && onMemberPress(item.user?.user_id, item.user?.username)}
                        activeOpacity={0.7}
                      >
                        <UserAvatar
                          userObj={item.user}
                          size={45}
                          style={[styles.attendeeAvatar, { marginLeft: index > 0 ? -8 : 0 }]}
                        />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  {subscribersCount > 5 && (
                    <View style={[styles.moreAttendees, { marginLeft: -8 }]}>
                      <Text style={styles.moreAttendeesText}>+{subscribersCount - 5}</Text>
                    </View>
                  )}
                  {subscribers.length === 0 && <Text style={styles.noAttendeesText}>No attendees yet</Text>}
                </View>
              </View>
              
              {event?.organizer && (
                <View style={styles.organizerContainer}>
                  <Text style={styles.organizerLabel}>Organizer</Text>
                  <TouchableOpacity 
                    style={styles.organizerInfo}
                    onPress={() => onCreatorPress && onCreatorPress(event.organizer.user_id, event.organizer.username)}
                    activeOpacity={0.7}
                  >
                    <UserAvatar
                      userObj={event.organizer}
                      size={50}
                      style={styles.organizerAvatar}
                    />
                    <View style={styles.organizerText}>
                      <Text style={styles.organizerName} numberOfLines={1}>
                        {event.organizer.display_name || event.organizer.username || "Organizer"}
                      </Text>
                      <Text style={styles.organizerUsername} numberOfLines={1}>
                        @{event.organizer.username || "organizer"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          <View style={styles.eventInfo}>
            <View style={styles.infoItem}>
              <Ionicons name={isOnlineEvent(event) ? "laptop-outline" : "location-outline"} size={16} color="#fff" />
              <Text style={styles.infoText}>{isOnlineEvent(event) ? "Online Event" : event?.city || "Location"}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={16} color="#fff" />
              <Text style={styles.infoText}>{formatDate(event?.date_time)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={16} color="#fff" />
              <Text style={styles.infoText}>{formatTime(event?.date_time)}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  backgroundImage: {
    width: windowWidth,
    height: windowHeight * 0.65,
  },
  overlay: {
    flex: 1,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(15,15,35,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 60,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(15,15,35,0.6)",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  likeCount: {
    color: "#fff",
    fontSize: 14,
    marginLeft: 4,
    fontWeight: "600",
  },
  eventContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  eventTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
    lineHeight: 38,
  },
  eventDescription: {
    fontSize: 16,
    color: "#fff",
    opacity: 0.9,
    lineHeight: 24,
    marginBottom: 24,
  },
  attendeesSection: {
    marginBottom: 24,
  },
  attendeesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  attendeesLeft: {
    flex: 1,
    marginRight: 16,
  },
  attendeesLabel: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    opacity: 0.9,
  },
  attendeesList: {
    flexDirection: "row",
    alignItems: "center",
  },
  attendeeAvatar: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  moreAttendees: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "rgba(15,15,35,0.8)",
    borderWidth: 2,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  moreAttendeesText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
  noAttendeesText: {
    color: "#fff",
    fontSize: 12,
    opacity: 0.7,
  },
  organizerContainer: {
    alignItems: "flex-end",
  },
  organizerLabel: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    opacity: 0.9,
  },
  organizerInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  organizerAvatar: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  organizerText: {
    marginLeft: 10,
    maxWidth: 100,
  },
  organizerName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  organizerUsername: {
    color: "#fff",
    fontSize: 12,
    opacity: 0.8,
    marginTop: 2,
  },
  eventInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoText: {
    color: "#fff",
    fontSize: 14,
    marginLeft: 6,
    fontWeight: "500",
  },
})
