import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const windowHeight = Dimensions.get("window").height;
const ACCENT_COLOR = '#8B5CF6';

const MessageModal = ({
  visible,
  onClose,
  onSend,
  darkMode,
  newMessage,
  setNewMessage,
  isMessageSending,
  recipientUser,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        onClose();
        setNewMessage("");
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            Keyboard.dismiss();
            onClose();
            setNewMessage("");
          }}
        >
          <View style={styles.messageModalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={[styles.messageModalContainer, darkMode && styles.messageModalContainerDark]}>
                <View style={styles.messageModalHeader}>
                  <View style={styles.messageModalUserInfo}>
                    <Image
                      source={{
                        uri: recipientUser?.profile_picture || recipientUser?.avatar || "https://via.placeholder.com/50"
                      }}
                      style={styles.messageModalAvatar}
                    />
                    <View>
                      <Text style={[styles.messageModalUserName, darkMode && styles.messageModalUserNameDark]}>
                        {recipientUser?.display_name || recipientUser?.username || "User"}
                      </Text>
                      <Text style={styles.messageModalSubtitle}>Send a message</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      onClose();
                      setNewMessage("");
                    }}
                    style={styles.messageModalCloseButton}
                  >
                    <Ionicons name="close" size={24} color={darkMode ? "#fff" : "#333"} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.messageModalContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <TextInput
                    style={[styles.messageInput, darkMode && styles.messageInputDark]}
                    value={newMessage}
                    onChangeText={setNewMessage}
                    placeholder="Type your message here..."
                    placeholderTextColor={darkMode ? "#888" : "#999"}
                    multiline
                    maxLength={500}
                    textAlignVertical="top"
                    autoFocus={false}
                  />

                  <Text style={[styles.characterCount, darkMode && styles.characterCountDark]}>
                    {newMessage.length}/500
                  </Text>
                </ScrollView>

                <View style={styles.messageModalActions}>
                  <TouchableOpacity
                    style={[styles.messageCancelButton, darkMode && styles.messageCancelButtonDark]}
                    onPress={() => {
                      onClose();
                      setNewMessage("");
                    }}
                  >
                    <Text style={[styles.messageCancelText, darkMode && styles.messageCancelTextDark]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.messageSendButton,
                      (!newMessage.trim() || isMessageSending) && styles.messageSendButtonDisabled
                    ]}
                    onPress={onSend}
                    disabled={!newMessage.trim() || isMessageSending}
                  >
                    {isMessageSending ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="send" size={18} color="#fff" />
                        <Text style={styles.messageSendText}>Send</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  messageModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  messageModalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: windowHeight * 0.8,
    minHeight: windowHeight * 0.5,
  },
  messageModalContainerDark: {
    backgroundColor: "#1F222A",
  },
  messageModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  messageModalUserInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  messageModalAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: "#f0f0f0",
  },
  messageModalUserName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  messageModalUserNameDark: {
    color: "#fff",
  },
  messageModalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  messageModalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
  },
  messageModalContent: {
    flex: 1,
    padding: 20,
  },
  messageInput: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    color: "#000",
  },
  messageInputDark: {
    backgroundColor: "#2A2D3A",
    borderColor: "#3A3F47",
    color: "#fff",
  },
  characterCount: {
    textAlign: "right",
    fontSize: 12,
    color: "#999",
    marginTop: 8,
  },
  characterCountDark: {
    color: "#666",
  },
  messageModalActions: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  messageCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
    alignItems: "center",
    justifyContent: "center",
  },
  messageCancelButtonDark: {
    backgroundColor: "#2A2D3A",
  },
  messageCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  messageCancelTextDark: {
    color: "#ccc",
  },
  messageSendButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: ACCENT_COLOR,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  messageSendButtonDisabled: {
    backgroundColor: "#ccc",
  },
  messageSendText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});

export default MessageModal;