import React, { useState } from "react"
import { View, Image, Text } from "react-native"
import { normalizeImageUrl } from "../../utils/image"

export const ChatAvatar = ({ userObj, size = 40, style = {}, backgroundColor = "#8B5CF6" }) => {
  const [imageError, setImageError] = useState(false)

  const getUserAvatar = (user) => {
    if (!user) return null
    
    // Intentar diferentes campos de imagen
    if (user.profile_picture && 
        user.profile_picture !== "" && 
        user.profile_picture !== "null" &&
        !user.profile_picture.includes("placeholder") &&
        !user.profile_picture.includes("example.com")) {
      
      const normalizedUrl = normalizeImageUrl(user.profile_picture)
      console.log(`🖼️ ChatAvatar: Normalizing profile_picture for user ${user.id || user.user_id}:`, {
        original: user.profile_picture,
        normalized: normalizedUrl
      })
      return normalizedUrl
    }
    
    if (user.avatar && 
        user.avatar !== "" && 
        user.avatar !== "null" &&
        !user.avatar.includes("placeholder") &&
        !user.avatar.includes("example.com")) {
      
      const normalizedUrl = normalizeImageUrl(user.avatar)
      console.log(`🖼️ ChatAvatar: Normalizing avatar for user ${user.id || user.user_id}:`, {
        original: user.avatar,
        normalized: normalizedUrl
      })
      return normalizedUrl
    }
    
    console.log(`⚠️ ChatAvatar: No valid image found for user ${user.id || user.user_id}:`, {
      profile_picture: user.profile_picture,
      avatar: user.avatar
    })
    return null
  }

  const getUserInitials = (user) => {
    if (!user) return "U"
    
    // Priorizar diferentes campos de nombre
    const name = user.display_name || user.name || user.username || user.email || "User"
    
    // Si el nombre es genérico, usar el ID
    if (name === "Usuario" || name === "Unknown" || name.startsWith("User ")) {
      const userId = user.id || user.user_id
      return userId ? userId.toString().slice(-2).toUpperCase() : "U"
    }
    
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
          },
          style,
        ]}
        onError={(error) => {
          console.log(`❌ ChatAvatar: Image load error for user ${userObj?.id || userObj?.user_id}:`, error.nativeEvent.error)
          console.log(`🔗 Failed URL: ${avatarUri}`)
          setImageError(true)
        }}
        onLoad={() => {
          console.log(`✅ ChatAvatar: Image loaded successfully for user ${userObj?.id || userObj?.user_id}`)
        }}
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
          backgroundColor: backgroundColor,
          justifyContent: "center",
          alignItems: "center",
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