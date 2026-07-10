import React, { useState } from "react";
import { View, Image, Text, TouchableOpacity, StyleSheet } from "react-native";
import { normalizeImageUrl } from "../../../utils/image";

const UserAvatar = ({ userObj, size = 100, onPress, disabled = false }) => {
  const [imageError, setImageError] = useState(false);
  
  const getUserAvatar = (userObj) => {
    if (!userObj) return null;
    const url = userObj.profile_picture || userObj.avatar;
    if (!url) return null;
    return normalizeImageUrl(url);
  };

  const avatarUri = getUserAvatar(userObj);
  const initials = userObj?.display_name?.substring(0, 2).toUpperCase() || "U";
  const isOnline = userObj?.online_status;

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} disabled={disabled}>
      <View style={{ position: "relative" }}>
        {avatarUri && !imageError ? (
          <Image
            source={{ uri: avatarUri }}
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: "#333",
              borderWidth: 4,
              borderColor: "#6200EE",
            }}
            onError={() => setImageError(true)}
          />
        ) : (
          <View
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: "#6200EE",
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 4,
              borderColor: "#333",
            }}
          >
            <Text style={{ color: "#fff", fontSize: size * 0.3, fontWeight: "bold" }}>{initials}</Text>
          </View>
        )}
        <View
          style={{
            position: "absolute",
            bottom: 4,
            right: 4,
            width: size * 0.25,
            height: size * 0.25,
            borderRadius: size * 0.125,
            backgroundColor: isOnline ? "#4CAF50" : "#9E9E9E",
            borderWidth: 2,
            borderColor: "#333",
          }}
        />
      </View>
    </TouchableOpacity>
  );
};

export default UserAvatar;