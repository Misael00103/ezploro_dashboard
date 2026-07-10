import React, { useState } from "react";
import { View, Image, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { normalizeImageUrl } from "../../../utils/image";

const UserBanner = ({ user, onPress, disabled = false }) => {
  const [imageError, setImageError] = useState(false);
  
  const getUserBanner = (userObj) => {
    if (!userObj) return null;
    const url = userObj.banner_image;
    if (!url) return null;
    return normalizeImageUrl(url);
  };

  const bannerUri = getUserBanner(user);

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} disabled={disabled || !onPress}>
      {bannerUri && !imageError ? (
        <Image source={{ uri: bannerUri }} style={styles.bannerImg} onError={() => setImageError(true)} />
      ) : (
        <LinearGradient colors={["#6200EE", "#8E24AA"]} style={styles.bannerImg}>
          <View style={styles.bannerPlaceholder}>
            <Ionicons name="image-outline" size={32} color="#fff" />
            <Text style={styles.bannerPlaceholderText}>No Cover Photo</Text>
          </View>
        </LinearGradient>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  bannerImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  bannerPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  bannerPlaceholderText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
});

export default UserBanner;