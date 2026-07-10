import React from "react"
import { View, Text, TouchableOpacity } from "react-native"
import { Ionicons } from "@expo/vector-icons"

export const ProfileHeaderSelf = ({
  user,
  darkMode,
  followersCount,
  followingCount,
  eventsCount,
  points,
  onPressEdit,
  onPressSettings,
  onPressStatus,
  onPressCreatePost,
  friendRequests = [],
  onAcceptFriend,
  onDeclineFriend,
  Styles,
  AvatarComponent,
}) => (
  <View style={[Styles.profileSection, darkMode && Styles.profileSectionDark]}>
    <View style={Styles.avatarContainer}>
      <AvatarComponent userObj={user} size={120} />
    </View>
    <View style={Styles.profileInfo}>
      <Text style={[Styles.nameText, darkMode && Styles.nameTextDark]}>
        {user?.display_name || `${user?.name || ""} ${user?.lastname || ""}`.trim() || user?.username || "Unknown"}
      </Text>
      <Text style={[Styles.bioText, darkMode && Styles.bioTextDark]}>
        {user?.bio !== undefined && user?.bio !== null && user?.bio !== "" ? user.bio : "No bio available"}
      </Text>
      <Text style={[Styles.usernameText, darkMode && Styles.usernameTextDark]}>@{user?.username}</Text>
      <View style={Styles.onlineStatusContainer}>
        <View style={[Styles.onlineStatusDot, { backgroundColor: user?.online_status ? "#4CAF50" : "#9E9E9E" }]} />
        <Text style={[Styles.onlineStatusText, darkMode && Styles.onlineStatusTextDark]}>
          {user?.online_status ? "Online" : "Offline"}
        </Text>
      </View>
      <View style={Styles.statsContainer}>
        <View style={Styles.statItem}>
          <Text style={[Styles.statNumber, darkMode && Styles.statNumberDark]}>{followersCount}</Text>
          <Text style={[Styles.statLabel, darkMode && Styles.statLabelDark]}>Followers</Text>
        </View>
        <View style={Styles.statItem}>
          <Text style={[Styles.statNumber, darkMode && Styles.statNumberDark]}>{followingCount}</Text>
          <Text style={[Styles.statLabel, darkMode && Styles.statLabelDark]}>Following</Text>
        </View>
        <View style={Styles.statItem}>
          <Text style={[Styles.statNumber, darkMode && Styles.statNumberDark]}>{eventsCount}</Text>
          <Text style={[Styles.statLabel, darkMode && Styles.statLabelDark]}>Events</Text>
        </View>
        <View style={Styles.statItem}>
          <Text style={[Styles.statNumber, darkMode && Styles.statNumberDark]}>{typeof points === 'number' ? points : 0}</Text>
          <Text style={[Styles.statLabel, darkMode && Styles.statLabelDark]}>Points</Text>
        </View>
      </View>
      <View style={Styles.actionButtonsContainer}>
        <TouchableOpacity style={Styles.primaryButton} onPress={onPressEdit}>
          <Ionicons name="create-outline" size={18} color="#fff" />
          <Text style={Styles.buttonText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={Styles.secondaryButton} onPress={onPressSettings}>
          <Ionicons name="settings-outline" size={18} color={"#8B5CF6"} />
          <Text style={Styles.secondaryButtonText}>Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={Styles.secondaryButton} onPress={onPressStatus}>
          <Ionicons name="chatbubble-outline" size={18} color={"#8B5CF6"} />
          <Text style={Styles.secondaryButtonText}>Status</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={Styles.createPostButton} onPress={onPressCreatePost}>
        <View style={[Styles.createPostGradient, { backgroundColor: darkMode ? '#333644' : '#8B5CF6' }]}>
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={Styles.buttonText}>Create Post</Text>
        </View>
      </TouchableOpacity>

      {friendRequests.length > 0 && (
        <View style={[Styles.friendRequestsContainer, darkMode && Styles.friendRequestsContainerDark]}>
          <Text style={[Styles.friendRequestsTitle, darkMode && Styles.friendRequestsTitleDark]}>
            Friend Requests ({friendRequests.length})
          </Text>
          {friendRequests.slice(0, 2).map((request) => (
            <View key={request.sender_id} style={Styles.friendRequestItem}>
              <Text style={[Styles.friendRequestName, darkMode && Styles.friendRequestNameDark]}>
                {request.sender?.display_name || "Unknown"}
              </Text>
              <View style={Styles.friendRequestActions}>
                <TouchableOpacity style={Styles.acceptButton} onPress={() => onAcceptFriend?.(request.sender_id)}>
                  <Text style={Styles.acceptButtonText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity style={Styles.declineButton} onPress={() => onDeclineFriend?.(request.sender_id)}>
                  <Text style={Styles.declineButtonText}>Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  </View>
)

// Import the actual modal components
import EditProfileModal from './EditProfileModal'
import CreatePostModal from './CreatePostModal'
import StatusModal from './StatusModal'

export { EditProfileModal, CreatePostModal, StatusModal }