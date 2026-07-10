import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

const FacebookLoginButton = ({ onPress, disabled = false, loading = false }) => {
  return (
    <TouchableOpacity
      style={[styles.socialButton, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons name="logo-facebook" size={20} color="#1877F2" style={styles.socialIcon} />
      <Text style={styles.socialButtonText}>
        {loading ? "Connecting..." : "Continue With Facebook"}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  socialButton: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingVertical: 16,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  socialIcon: {
    marginRight: 12,
  },
  socialButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default FacebookLoginButton;