// components/ChatStatusIndicator.js - Indicador de estado del chat
import { Ionicons } from "@expo/vector-icons"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"

const ChatStatusIndicator = ({ 
  isOnline = false, 
  isFallbackMode = false, 
  onRetry = null,
  style = {} 
}) => {
  if (isOnline && !isFallbackMode) {
    return null // No mostrar nada si todo está bien
  }

  const getStatusConfig = () => {
    if (isFallbackMode) {
      return {
        icon: "cloud-offline",
        text: "Modo sin conexión",
        subtext: "Los mensajes se guardan localmente",
        color: "#FF9500",
        backgroundColor: "rgba(255, 149, 0, 0.1)"
      }
    } else if (!isOnline) {
      return {
        icon: "wifi-off",
        text: "Sin conexión",
        subtext: "Verificando conexión...",
        color: "#FF3B30",
        backgroundColor: "rgba(255, 59, 48, 0.1)"
      }
    }
  }

  const config = getStatusConfig()
  if (!config) return null

  return (
    <View style={[styles.container, { backgroundColor: config.backgroundColor }, style]}>
      <View style={styles.content}>
        <Ionicons name={config.icon} size={16} color={config.color} />
        <View style={styles.textContainer}>
          <Text style={[styles.text, { color: config.color }]}>{config.text}</Text>
          <Text style={styles.subtext}>{config.subtext}</Text>
        </View>
      </View>
      
      {onRetry && (
        <TouchableOpacity onPress={onRetry} style={styles.retryButton}>
          <Ionicons name="refresh" size={16} color={config.color} />
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)"
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  textContainer: {
    marginLeft: 8,
    flex: 1
  },
  text: {
    fontSize: 14,
    fontWeight: "600"
  },
  subtext: {
    fontSize: 12,
    color: "#666",
    marginTop: 2
  },
  retryButton: {
    padding: 4,
    marginLeft: 8
  }
})

export default ChatStatusIndicator