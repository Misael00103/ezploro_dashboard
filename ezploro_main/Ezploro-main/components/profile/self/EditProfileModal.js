import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const ACCENT_COLOR = '#8B5CF6';

const EditProfileModal = ({
  visible,
  onClose,
  onSave,
  loadingEdit,
  editName,
  setEditName,
  editUsername,
  setEditUsername,
  editBio,
  setEditBio,
  darkMode,
  Styles,
}) => {
  console.log('👁️ EditProfileModal renderizado:', { visible, darkMode })
  
  if (!visible) {
    return null
  }
  
  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      onRequestClose={onClose}
      transparent={false}
    >
      <View style={{ 
        flex: 1, 
        backgroundColor: darkMode ? '#181A20' : '#f8f9fa',
        padding: 20 
      }}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: 20,
          borderBottomWidth: 1,
          borderBottomColor: darkMode ? '#333' : '#eee'
        }}>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ color: darkMode ? '#fff' : '#000', fontSize: 18 }}>✕</Text>
          </TouchableOpacity>
          <Text style={{ 
            color: darkMode ? '#fff' : '#000', 
            fontSize: 18, 
            fontWeight: 'bold' 
          }}>
            Edit Profile
          </Text>
          <TouchableOpacity 
            onPress={onSave}
            disabled={loadingEdit}
            style={{
              backgroundColor: loadingEdit ? '#ccc' : '#8B5CF6',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8
            }}
          >
            {loadingEdit ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
        
        <ScrollView style={{ flex: 1, paddingTop: 20 }}>
          <Text style={{ 
            color: darkMode ? '#fff' : '#000', 
            fontSize: 16, 
            marginBottom: 8 
          }}>
            Display Name
          </Text>
          <TextInput
            value={editName}
            onChangeText={setEditName}
            placeholder="Enter your display name"
            placeholderTextColor={darkMode ? "#888" : "#999"}
            style={{
              borderWidth: 1,
              borderColor: darkMode ? '#333' : '#ddd',
              borderRadius: 8,
              padding: 12,
              fontSize: 16,
              color: darkMode ? '#fff' : '#000',
              backgroundColor: darkMode ? '#2a2a2a' : '#fff',
              marginBottom: 20
            }}
          />
          
          <Text style={{ 
            color: darkMode ? '#fff' : '#000', 
            fontSize: 16, 
            marginBottom: 8 
          }}>
            Username
          </Text>
          <TextInput
            value={editUsername}
            onChangeText={setEditUsername}
            placeholder="Enter your username"
            placeholderTextColor={darkMode ? "#888" : "#999"}
            style={{
              borderWidth: 1,
              borderColor: darkMode ? '#333' : '#ddd',
              borderRadius: 8,
              padding: 12,
              fontSize: 16,
              color: darkMode ? '#fff' : '#000',
              backgroundColor: darkMode ? '#2a2a2a' : '#fff',
              marginBottom: 20
            }}
            autoCapitalize="none"
          />
          
          <Text style={{ 
            color: darkMode ? '#fff' : '#000', 
            fontSize: 16, 
            marginBottom: 8 
          }}>
            Bio
          </Text>
          <TextInput
            value={editBio}
            onChangeText={setEditBio}
            placeholder="Tell us about yourself"
            placeholderTextColor={darkMode ? "#888" : "#999"}
            style={{
              borderWidth: 1,
              borderColor: darkMode ? '#333' : '#ddd',
              borderRadius: 8,
              padding: 12,
              fontSize: 16,
              color: darkMode ? '#fff' : '#000',
              backgroundColor: darkMode ? '#2a2a2a' : '#fff',
              height: 100,
              textAlignVertical: 'top'
            }}
            multiline
            numberOfLines={4}
          />
        </ScrollView>
      </View>
    </Modal>
  );
};

export default EditProfileModal;