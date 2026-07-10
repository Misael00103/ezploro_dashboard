import React, { useState } from "react"
import { View, Image, Text } from "react-native"
import { normalizeImageUrl } from "../utils/image"

export const UserAvatar = ({ userObj, size = 40, style = {} }) => {
  const [imageError, setImageError] = useState(false)

  const getUserAvatar = (user) => {
    if (!user) return null
    if (user.profile_picture && user.profile_picture !== "" && !user.profile_picture.includes("placeholder")) {
      return normalizeImageUrl(user.profile_picture)
    }
    if (user.avatar && user.avatar !== "" && !user.avatar.includes("placeholder")) {
      return normalizeImageUrl(user.avatar)
    }
    return null
  }

  const getUserInitials = (user) => {
    if (!user) return "U"
    const name = user.display_name || user.username || user.email || "User"
    const words = name.split(" ")
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const avatarUri = getUserAvatar(userObj)
  const initials = getUserInitials(userObj)

  if (avatarUri && !imageError) {
    return (
      <Image
        source={{ uri: avatarUri }}
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: "#f0f0f0",
            borderWidth: 2,
            borderColor: "#fff",
          },
          style,
        ]}
        onError={() => setImageError(true)}
      />
    )
  }

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: "#8B5CF6",
          justifyContent: "center",
          alignItems: "center",
          borderWidth: 2,
          borderColor: "#fff",
        },
        style,
      ]}
    >
      <Text
        style={{
          color: "#fff",
          fontSize: size * 0.35,
          fontWeight: "bold",
        }}
      >
        {initials}
      </Text>
    </View>
  )
}
