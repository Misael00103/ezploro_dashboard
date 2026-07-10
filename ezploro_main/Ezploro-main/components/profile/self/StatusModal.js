import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const ACCENT_COLOR = '#8B5CF6';

const STATUS_PRESETS = [
  "🎉 Feeling excited!",
  "💼 Working hard",
  "🌴 On vacation",
  "🎮 Gaming time",
  "📚 Studying",
  "🏃‍♂️ Working out",
  "🎵 Listening to music",
  "☕ Coffee break",
];

const StatusModal = ({
  visible,
  onClose,
  onUpdate,
  statusText,
  setStatusText,
  darkMode,
  Styles,
}) => {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={Styles.modalOverlay}>
          <View style={[Styles.modalContainer, darkMode && Styles.modalContainerDark]}>
            <View style={Styles.modalHeader}>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={darkMode ? "#fff" : "#000"} />
              </TouchableOpacity>
              <Text style={[Styles.modalTitle, darkMode && Styles.modalTitleDark]}>Update Status</Text>
              <TouchableOpacity onPress={onUpdate}>
                <Text style={Styles.saveButton}>Update</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={Styles.modalContent}>
              <View style={Styles.inputGroup}>
                <Text style={[Styles.inputLabel, darkMode && Styles.inputLabelDark]}>Status Message</Text>
                <TextInput
                  value={statusText}
                  onChangeText={setStatusText}
                  placeholder="What's on your mind?"
                  placeholderTextColor={darkMode ? "#888" : "#999"}
                  style={[Styles.textInput, darkMode && Styles.textInputDark]}
                  maxLength={100}
                />
              </View>
              
              <View style={Styles.statusPresets}>
                <Text style={[Styles.inputLabel, darkMode && Styles.inputLabelDark]}>Quick Status</Text>
                {STATUS_PRESETS.map((preset, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[Styles.presetButton, darkMode && Styles.presetButtonDark]}
                    onPress={() => setStatusText(preset)}
                  >
                    <Text style={[Styles.presetText, darkMode && Styles.presetTextDark]}>{preset}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default StatusModal;