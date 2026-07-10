import React, { useState } from 'react'
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  Image,
  Text 
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'

const MessageInput = ({ 
  message, 
  onMessageChange, 
  onSend, 
  onImageSelect,
  selectedImage,
  onRemoveImage,
  placeholder = "Type a message...",
  darkMode = false,
  disabled = false 
}) => {
  const [isRecording, setIsRecording] = useState(false)

  const handleImagePicker = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to send images.')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        onImageSelect(result.assets[0])
      }
    } catch (error) {
      console.error('Error picking image:', error)
      Alert.alert('Error', 'Failed to pick image')
    }
  }

  const handleSend = () => {
    if ((message.trim() || selectedImage) && !disabled) {
      onSend()
    }
  }

  const canSend = (message.trim() || selectedImage) && !disabled

  return (
    <View style={[styles.container, darkMode && styles.containerDark]}>
      {selectedImage && (
        <View style={styles.imagePreview}>
          <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
          <TouchableOpacity 
            style={styles.removeImageButton} 
            onPress={onRemoveImage}
          >
            <Ionicons name="close-circle" size={24} color="#FF4757" />
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.inputContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, darkMode && styles.actionButtonDark]}
          onPress={handleImagePicker}
          disabled={disabled}
        >
          <Ionicons 
            name="camera" 
            size={20} 
            color={darkMode ? "#9CA3AF" : "#6B7280"} 
          />
        </TouchableOpacity>
        
        <TextInput
          style={[
            styles.textInput,
            darkMode && styles.textInputDark,
            disabled && styles.textInputDisabled
          ]}
          value={message}
          onChangeText={onMessageChange}
          placeholder={placeholder}
          placeholderTextColor={darkMode ? "#6B7280" : "#9CA3AF"}
          multiline
          maxLength={1000}
          editable={!disabled}
        />
        
        <TouchableOpacity 
          style={[
            styles.sendButton,
            canSend && styles.sendButtonActive,
            darkMode && canSend && styles.sendButtonActiveDark
          ]}
          onPress={handleSend}
          disabled={!canSend}
        >
          <Ionicons 
            name="send" 
            size={20} 
            color={canSend ? "#FFFFFF" : (darkMode ? "#6B7280" : "#9CA3AF")} 
          />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  containerDark: {
    backgroundColor: '#1F2937',
    borderTopColor: '#374151',
  },
  imagePreview: {
    position: 'relative',
    marginBottom: 12,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  actionButtonDark: {
    backgroundColor: '#374151',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: '#FFFFFF',
  },
  textInputDark: {
    borderColor: '#374151',
    backgroundColor: '#1F2937',
    color: '#FFFFFF',
  },
  textInputDisabled: {
    opacity: 0.6,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonActive: {
    backgroundColor: '#8B5CF6',
  },
  sendButtonActiveDark: {
    backgroundColor: '#7C3AED',
  },
})

export default MessageInput