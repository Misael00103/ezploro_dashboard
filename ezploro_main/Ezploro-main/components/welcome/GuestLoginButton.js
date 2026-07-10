import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const GuestLoginButton = ({ onPress, disabled = false, loading = false }) => {
  return (
    <TouchableOpacity 
      style={[styles.guestButton, disabled && styles.buttonDisabled]} 
      onPress={onPress} 
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={styles.buttonContent}>
        {loading ? (
          <ActivityIndicator size="small" color="rgba(255, 255, 255, 0.8)" style={styles.icon} />
        ) : (
          <Ionicons name="person-outline" size={18} color="rgba(255, 255, 255, 0.6)" style={styles.icon} />
        )}
        <Text style={styles.guestButtonText}>
          {loading ? "Connecting..." : "Continue as Guest"}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  guestButton: {
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    marginRight: 8,
  },
  guestButtonText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    fontWeight: "500",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default GuestLoginButton;