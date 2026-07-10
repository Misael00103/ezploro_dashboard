import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import ProfileStats from "../shared/ProfileStats";

const ACCENT_COLOR = '#8B5CF6';

const ProfileHeaderSelf = ({
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
  friendRequests,
  onAcceptFriend,
  onDeclineFriend,
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
          {user?.display_name || user?.name || "Unknown"}
        </Text>
        <Text style={[Styles.bioText, darkMode && Styles.bioTextDark]}>
          {user?.bio || "No bio available"}
        </Text>
        <Text style={[Styles.usernameText, darkMode && Styles.usernameTextDark]}>@{user?.username}</Text>
        
        <View style={Styles.onlineStatusContainer}>
          <View style={[Styles.onlineStatusDot, { backgroundColor: user?.online_status ? "#4CAF50" : "#9E9E9E" }]} />
          <Text style={[Styles.onlineStatusText, darkMode && Styles.onlineStatusTextDark]}>
            {user?.online_status ? "Online" : "Offline"}
          </Text>
        </View>
        
        <ProfileStats
          followersCount={followersCount}
          followingCount={followingCount}
          eventsCount={eventsCount}
          points={points}
          darkMode={darkMode}
        />
        
        <View style={Styles.actionButtonsContainer}>
          <TouchableOpacity style={Styles.primaryButton} onPress={onPressEdit}>
            <Ionicons name="create-outline" size={18} color="#fff" />
            <Text style={Styles.buttonText}>Edit Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={Styles.secondaryButton} onPress={onPressSettings}>
            <Ionicons name="settings-outline" size={18} color={ACCENT_COLOR} />
            <Text style={Styles.secondaryButtonText}>Settings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={Styles.secondaryButton} onPress={onPressStatus}>
            <Ionicons name="megaphone-outline" size={18} color={ACCENT_COLOR} />
            <Text style={Styles.secondaryButtonText}>Status</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={Styles.createPostButton} onPress={onPressCreatePost}>
          <LinearGradient
            colors={["#6200EE", "#8E24AA"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={Styles.createPostGradient}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={Styles.buttonText}>Create Post</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        {friendRequests && friendRequests.length > 0 && (
          <View style={[Styles.friendRequestsContainer, darkMode && Styles.friendRequestsContainerDark]}>
            <Text style={[Styles.friendRequestsTitle, darkMode && Styles.friendRequestsTitleDark]}>
              Friend Requests ({friendRequests.length})
            </Text>
            <FlatList
              data={friendRequests.slice(0, 3)}
              keyExtractor={(item) => item.id?.toString() || item.sender_id?.toString()}
              renderItem={({ item }) => (
                <View style={Styles.friendRequestItem}>
                  <Text style={[Styles.friendRequestName, darkMode && Styles.friendRequestNameDark]}>
                    {item.sender?.display_name || item.sender?.username || "User"}
                  </Text>
                  <View style={Styles.friendRequestActions}>
                    <TouchableOpacity
                      style={Styles.acceptButton}
                      onPress={() => onAcceptFriend(item.sender_id)}
                    >
                      <Text style={Styles.acceptButtonText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={Styles.declineButton}
                      onPress={() => onDeclineFriend(item.sender_id)}
                    >
                      <Text style={Styles.declineButtonText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          </View>
        )}
      </View>
    </View>
  );
};

export default ProfileHeaderSelf;