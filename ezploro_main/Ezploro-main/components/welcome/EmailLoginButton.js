import { StyleSheet, Text, TouchableOpacity } from 'react-native';

const EmailLoginButton = ({ onPress, disabled = false, loading = false }) => {
  return (
    <TouchableOpacity 
      style={[styles.emailButton, disabled && styles.buttonDisabled]} 
      onPress={onPress} 
      disabled={disabled}
    >
      <Text style={styles.emailButtonText}>
        {loading ? "Loading..." : "Continue With Email"}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  emailButton: {
    backgroundColor: "#8B5CF6",
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: "center",
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emailButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default EmailLoginButton;