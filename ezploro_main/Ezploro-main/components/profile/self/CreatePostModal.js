import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const ACCENT_COLOR = '#8B5CF6';

const CreatePostModal = ({
  visible,
  onClose,
  onSubmit,
  onSelectImage,
  darkMode,
  Styles,
  newImageUri,
  setNewImageUri,
  newImageTitle,
  setNewImageTitle,
  newImageDescription,
  setNewImageDescription,
  loadingImage,
}) => {
  // Log del estado siempre
  console.log('👁️ CreatePostModal renderizado:', {
    visible,
    hasImage: !!newImageUri,
    title: newImageTitle,
    titleLength: newImageTitle?.length || 0,
    loadingImage,
    buttonDisabled: loadingImage || !newImageTitle?.trim()
  })
  
  // Versión simplificada para debugging
  if (!visible) {
    console.log('🚫 Modal no visible, no renderizando contenido')
    return null
  }
  
  console.log('✅ Modal visible, renderizando contenido completo')
  
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
          <TouchableOpacity onPress={() => {
            console.log('❌ Cerrando modal por botón X')
            onClose()
          }}>
            <Text style={{ color: darkMode ? '#fff' : '#000', fontSize: 18 }}>✕</Text>
          </TouchableOpacity>
          <Text style={{ 
            color: darkMode ? '#fff' : '#000', 
            fontSize: 18, 
            fontWeight: 'bold' 
          }}>
            Create Post
          </Text>
          <TouchableOpacity
            onPress={() => {
              console.log('🔘 Botón Post presionado (versión simple)')
              if (!newImageUri || !newImageTitle.trim()) {
                console.log('❌ Imagen o título vacío')
                return
              }
              console.log('✅ Ejecutando onSubmit...')
              onSubmit()
            }}
            style={{
              backgroundColor: (newImageUri && newImageTitle.trim()) ? '#8B5CF6' : '#ccc',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Post</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={{ flex: 1, paddingTop: 20 }}>
          {newImageUri && (
            <Image
              source={{ uri: newImageUri }}
              style={{
                width: '100%',
                height: 200,
                borderRadius: 8,
                marginBottom: 20
              }}
              resizeMode="cover"
            />
          )}
          
          {!newImageUri && (
            <TouchableOpacity
              onPress={onSelectImage}
              style={{
                backgroundColor: ACCENT_COLOR,
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 8,
                marginBottom: 20,
                alignItems: 'center'
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Seleccionar Imagen</Text>
            </TouchableOpacity>
          )}
          
          <Text style={{
            color: darkMode ? '#fff' : '#000',
            fontSize: 16,
            marginBottom: 8
          }}>
            Title *
          </Text>
          <TextInput
            value={newImageTitle}
            onChangeText={setNewImageTitle}
            placeholder="Enter post title"
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
            Description
          </Text>
          <TextInput
            value={newImageDescription}
            onChangeText={setNewImageDescription}
            placeholder="Add a description (optional)"
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

export default CreatePostModal;