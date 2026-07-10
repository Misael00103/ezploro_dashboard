import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ProfileStats } from "../shared";

const ACCENT_COLOR = '#8B5CF6';

const ProfileHeaderOther = ({
  user,
  darkMode,
  followersCount,
  followingCount,
  eventsCount,
  isFollowing,
  isFollowLoading,
  hasSentFriendRequest,
  hasReceivedFriendRequest,
  isFriend,
  isBlocked,
  onFollowToggle,
  onFriendRequestToggle,
  onFriendRequestAccept,
  onFriendRequestReject,
  onMessageUser,
  onBlockUser,
  onUnblockUser,
  Styles,
  AvatarComponent,
}) => {
  return (
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
        
        <ProfileStats followers={followersCount} following={followingCount} events={eventsCount} darkMode={darkMode} />
        
        <View style={Styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[Styles.primaryButton, isFollowLoading && Styles.disabledButton]}
            onPress={onFollowToggle}
            disabled={isFollowLoading}
          >
            {isFollowLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons
                  name={isFollowing ? "person-remove-outline" : "person-add-outline"}
                  size={18}
                  color="#fff"
                />
                <Text style={Styles.buttonText}>{isFollowing ? "Unfollow" : "Follow"}</Text>
              </>
            )}
          </TouchableOpacity>
          
          {hasReceivedFriendRequest ? (
            <>
              <TouchableOpacity style={Styles.secondaryButton} onPress={onFriendRequestAccept}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#6200EE" />
                <Text style={Styles.secondaryButtonText}>Accept Friend</Text>
              </TouchableOpacity>
              <TouchableOpacity style={Styles.secondaryButton} onPress={onFriendRequestReject}>
                <Ionicons name="close-circle-outline" size={18} color="#6200EE" />
                <Text style={Styles.secondaryButtonText}>Reject</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={Styles.secondaryButton} onPress={onFriendRequestToggle}>
              <Ionicons
                name={hasSentFriendRequest ? "close-circle-outline" : "person-add-outline"}
                size={18}
                color="#6200EE"
              />
              <Text style={Styles.secondaryButtonText}>
                {hasSentFriendRequest ? "Cancel Request" : isFriend ? "Remove Friend" : "Add Friend"}
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={Styles.secondaryButton} onPress={onMessageUser}>
            <Ionicons name="chatbubble-outline" size={18} color="#6200EE" />
            <Text style={Styles.secondaryButtonText}>Message</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[Styles.secondaryButton, isBlocked && Styles.blockedButton]}
            onPress={isBlocked ? onUnblockUser : onBlockUser}
          >
            <Ionicons
              name={isBlocked ? "lock-open-outline" : "lock-closed-outline"}
              size={18}
              color={isBlocked ? "#4CAF50" : "#FF6B6B"}
            />
            <Text style={[Styles.secondaryButtonText, isBlocked && Styles.unblockButtonText]}>
              {isBlocked ? "Unblock" : "Block"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default ProfileHeaderOther;