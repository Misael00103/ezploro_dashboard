import React from "react"
import { Modal, View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"

const GuestRestrictionModal = ({
  visible,
  title,
  message,
  primaryLabel,
  secondaryLabel,
  onPrimaryPress,
  onSecondaryPress,
  onRequestClose,
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={["#8B5CF6", "#7C3AED"]}
            style={styles.iconWrapper}
          >
            <Ionicons name="lock-closed" size={32} color="#fff" />
          </LinearGradient>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            {secondaryLabel ? (
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={onSecondaryPress}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryButtonText}>{secondaryLabel}</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={onPrimaryPress}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" style={styles.primaryIcon} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 15, 35, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#0F0F23",
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.35)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 24,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 20,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.84)",
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 28,
  },
  actions: {
    flexDirection: "column",
    gap: 12,
  },
  button: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  primaryButton: {
    backgroundColor: "#8B5CF6",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  primaryIcon: {
    marginLeft: 8,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.5)",
    backgroundColor: "rgba(139, 92, 246, 0.12)",
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#C4B5FD",
  },
})

export default GuestRestrictionModal

