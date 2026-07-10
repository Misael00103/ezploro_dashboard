"use client";

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { API_URL_GROUP_CHAT_CREATE } from '../config';
import imageService from '../services/imageService';

// Define color palette consistent with CreateEventScreen.js
const PRIMARY_COLOR = '#4A90E2';
const BACKGROUND_DARK = '#1a1a1a';
const CARD_BACKGROUND_DARK = '#1F222A';
const TEXT_PRIMARY_DARK = '#fff';
const TEXT_SECONDARY_DARK = '#B8B8D9';
const DIVIDER_COLOR_DARK = '#3A3F47';
const INPUT_BACKGROUND_DARK = 'rgba(255, 255, 255, 0.1)';

export default function CreateGroupScreen({ navigation }) {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupImage, setGroupImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !user.user_id) {
      setError('Please log in to create a group.');
      Alert.alert('Error', 'Please log in to create a group.');
    }
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Gallery access permissions are required to upload a group image.');
        console.log('Permission status:', status);
      }
    })();
  }, [user]);

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 1,
      });

      console.log('ImagePicker result:', result);

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        const fileSize = (await fetch(uri).then(res => res.blob())).size / (1024 * 1024);
        if (fileSize > 10) {
          Alert.alert('Error', 'Image size exceeds 10 MB limit.');
          return;
        }
        console.log('Selected image URI:', uri);
        setGroupImage(uri);
      } else {
        console.log('Image selection canceled by user.');
      }
    } catch (e) {
      console.error('Image picker error:', e);
      setError('Failed to pick image. Check console for details.');
    }
  };

  const handleCreateGroup = async () => {
    if (!user || !user.user_id) {
      setError('Please log in to create a group.');
      Alert.alert('Error', 'Please log in to create a group.');
      return;
    }
    if (groupName.trim() === '') {
      setError('Group name cannot be empty.');
      Alert.alert('Error', 'Group name cannot be empty.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      let imageUrl = null;
      
      // Subir imagen si existe
      if (groupImage && (groupImage.startsWith('file://') || groupImage.startsWith('content://'))) {
        console.log('📤 Subiendo imagen del grupo...');
        const imageResult = await imageService.uploadImage({
          uri: groupImage,
          type: 'group',
          category: 'group_avatar',
          userId: user.user_id,
        });
        
        if (imageResult.success) {
          imageUrl = imageResult.imageUrl;
          console.log('✅ Imagen del grupo subida:', imageUrl);
        } else {
          console.error('❌ Error subiendo imagen del grupo:', imageResult.error);
          Alert.alert('Advertencia', 'No se pudo subir la imagen del grupo, pero el grupo se creará sin imagen.');
        }
      }

      const formData = new FormData();
      formData.append('name', groupName);
      formData.append('description', groupDescription);
      formData.append('creatorId', user.user_id.toString());
      
      if (imageUrl) {
        formData.append('imageUrl', imageUrl);
      }

      console.log('FormData to be sent:', {
        name: groupName,
        description: groupDescription,
        creatorId: user.user_id,
        image: groupImage ? { uri: groupImage, name: formData._parts.find(p => p[0] === 'image')?.[1].name } : null,
      });

      const response = await fetch(API_URL_GROUP_CHAT_CREATE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.status === 201) {
        Alert.alert('Success', 'Group created successfully!');
        navigation.goBack();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error creating group:', error.message);
      const errorMessage = error.message || 'An error occurred while creating the group.';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.blackContainer}>
      {/* Purple bubbles decoration */}
      <View style={styles.topBubble} />
      <View style={styles.bottomBubble} />
      <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={darkMode ? 'light-content' : 'dark-content'}
        backgroundColor={darkMode ? BACKGROUND_DARK : '#F5F7FA'}
      />
      <View style={[styles.header, darkMode && styles.headerDark]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={darkMode ? TEXT_PRIMARY_DARK : '#1F2937'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, darkMode && styles.headerTitleDark]}>Create New Group</Text>
        <View style={styles.placeholderRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={[styles.formContainer, darkMode && styles.formContainerDark]}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Text style={[styles.label, darkMode && styles.labelDark]}>Group Name</Text>
          <TextInput
            style={[styles.input, darkMode && styles.inputDark]}
            placeholder="Enter group name"
            placeholderTextColor={darkMode ? TEXT_SECONDARY_DARK : '#6B7280'}
            value={groupName}
            onChangeText={setGroupName}
            autoCapitalize="words"
          />

          <Text style={[styles.label, darkMode && styles.labelDark]}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea, darkMode && styles.inputDark]}
            placeholder="Enter group description"
            placeholderTextColor={darkMode ? TEXT_SECONDARY_DARK : '#6B7280'}
            value={groupDescription}
            onChangeText={setGroupDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={[styles.label, darkMode && styles.labelDark]}>Group Image (Optional)</Text>
          <TouchableOpacity style={styles.uploadImageButton} onPress={pickImage}>
            {groupImage ? (
              <Image source={{ uri: groupImage }} style={styles.previewImage} />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={50} color={PRIMARY_COLOR} />
                <Text style={styles.uploadImageText}>Upload an image</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: PRIMARY_COLOR }]}
            onPress={handleCreateGroup}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={TEXT_PRIMARY_DARK} />
            ) : (
              <Text style={styles.createButtonText}>Create Group</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  blackContainer: {
    flex: 1,
    backgroundColor: "#0F0F23",
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: 'transparent',
  },
  headerDark: {
    backgroundColor: 'transparent',
  },
  backButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    flex: 1,
  },
  headerTitleDark: {
    color: TEXT_PRIMARY_DARK,
  },
  placeholderRight: {
    width: 48,
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 20,
  },
  formContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  formContainerDark: {
    backgroundColor: CARD_BACKGROUND_DARK,
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1F2937',
  },
  labelDark: {
    color: TEXT_PRIMARY_DARK,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputDark: {
    backgroundColor: INPUT_BACKGROUND_DARK,
    color: TEXT_PRIMARY_DARK,
    borderColor: DIVIDER_COLOR_DARK,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  uploadImageButton: {
    borderWidth: 2,
    borderColor: PRIMARY_COLOR,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    backgroundColor: '#F9FAFB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  uploadImageText: {
    marginTop: 10,
    color: PRIMARY_COLOR,
    fontSize: 16,
    fontWeight: '500',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
  createButton: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
    padding: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
  },
  topBubble: {
    position: "absolute",
    top: 50,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(139, 92, 246, 0.4)",
    zIndex: 0,
  },
  bottomBubble: {
    position: "absolute",
    bottom: 100,
    left: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(139, 92, 246, 0.3)",
    zIndex: 0,
  },
});
