"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  Text,
  Platform,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL_USERS_UPLOAD_IMAGE, API_URL_USERS_UPDATE } from "../config";
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { jwtDecode } from "jwt-decode";

import { SCREEN_WIDTH } from '../constants/layout';

const DATA = [
  { id: "profile", title: "Foto de Perfil", type: "profile" },
  { id: "banner", title: "Foto de Portada", type: "banner" },
  { id: "bio", title: "Biografía", type: "bio" },
];

export default function OnboardingScreen({ navigation }) {
  const { darkMode } = useTheme();
  const { user, logout, fetchUserProfile, setIsNewUser } = useAuth();
  const [profileImage, setProfileImage] = useState(null);
  const [bannerImage, setBannerImage] = useState(null);
  const [bio, setBio] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const flatListIndex = useSharedValue(0);
  const x = useSharedValue(0);

  const isNextEnabled = currentIndex === 0 ? !!profileImage : true;

  const pickImage = async (setImage, type) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        setError("Se necesita permiso para acceder a la galería.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: type === "profile" ? [1, 1] : [3, 1],
        quality: 0.5,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
        setError("");
        if (type === "profile" && currentIndex < DATA.length - 1) {
          flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        }
      }
    } catch (err) {
      setError("Error seleccionando imagen: " + err.message);
      console.error("ImagePicker error:", err);
    }
  };

  const isTokenValid = async (token) => {
    try {
      const decoded = jwtDecode(token);
      if (decoded.exp && decoded.exp < Date.now() / 1000) {
        console.warn("Token ha expirado:", decoded);
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error al validar token:", error.message);
      return false;
    }
  };

  const uploadImageAsync = async (uri, type, token) => {
    const formData = new FormData();
    const fileType = uri.split(".").pop();
    formData.append("image", {
      uri,
      name: `photo.${fileType}`,
      type: `image/${fileType}`,
    });
    formData.append("type", type);

    try {
      console.log(`Attempting to upload ${type} image to URL: ${API_URL_USERS_UPLOAD_IMAGE}`);
      const response = await fetch(API_URL_USERS_UPLOAD_IMAGE, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const responseText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (jsonError) {
          console.error("Non-JSON response:", responseText);
          throw new Error(`Error al subir la imagen de ${type}: Respuesta no válida (Status ${response.status})`);
        }
        console.error(`Upload failed for ${type}: Status ${response.status}, Response: ${responseText}`);
        if (errorData.error === "jwt expired") {
          throw new Error("Sesión expirada. Por favor, inicia sesión de nuevo.");
        }
        throw new Error(`Error al subir la imagen de ${type}: ${errorData.message || responseText}`);
      }

      const responseData = await response.json();
      console.log(`Image uploaded successfully: ${responseData.url}`);
      return responseData;
    } catch (err) {
      console.error("Error during image upload fetch:", err);
      throw err;
    }
  };

  const handleNext = async () => {
    const currentIdx = flatListIndex.value;
    setError("");

    if (currentIdx === 0 && !profileImage) {
      setError("Por favor, selecciona una foto de perfil primero.");
      return;
    }
    if (currentIdx === DATA.length - 1 && bio.length > 0 && bio.length < 40) {
      setError("La biografía debe tener al menos 40 caracteres.");
      return;
    }

    if (currentIdx < DATA.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIdx + 1 });
    } else {
      if (!user || !user.user_id) {
        setError("Usuario no autenticado. Por favor, inicia sesión de nuevo.");
        await logout();
        // No hacer navegación manual - el AppNavigator manejará esto automáticamente
        return;
      }

      setLoading(true);
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          throw new Error("Token de autenticación no encontrado. Por favor, inicia sesión de nuevo.");
        }

        // Validate token before making requests
        const isValid = await isTokenValid(token);
        if (!isValid) {
          setError("Sesión expirada. Por favor, inicia sesión de nuevo.");
          await logout();
          // No hacer navegación manual - el AppNavigator manejará esto automáticamente
          return;
        }

        if (profileImage) {
          await uploadImageAsync(profileImage, "profile", token);
        }
        if (bannerImage) {
          await uploadImageAsync(bannerImage, "banner", token);
        }

        const bioPayload = { bio: bio || "" };
        const updateUrl = API_URL_USERS_UPDATE.replace(":userId", user.user_id);
        console.log(`Attempting to update user profile at URL: ${updateUrl}`);
        const updateResponse = await fetch(updateUrl, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(bioPayload),
        });

        const responseText = await updateResponse.text();
        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch (jsonError) {
          console.error("Non-JSON response:", responseText);
          if (updateResponse.status === 404) {
            throw new Error("Usuario no encontrado. Por favor, verifica tu cuenta o inicia sesión de nuevo.");
          }
          throw new Error(`Error al actualizar el perfil: Respuesta no válida del servidor (Status ${updateResponse.status})`);
        }

        if (!updateResponse.ok) {
          const errorMessage = responseData.message || `Error al actualizar el perfil (Status ${updateResponse.status})`;
          console.error("Backend update error:", errorMessage, responseData);
          if (responseData.error === "jwt expired") {
            setError("Sesión expirada. Por favor, inicia sesión de nuevo.");
            await logout();
            // No hacer navegación manual - el AppNavigator manejará esto automáticamente
            return;
          }
          if (updateResponse.status === 404) {
            throw new Error("Usuario no encontrado. Por favor, verifica tu cuenta o inicia sesión de nuevo.");
          }
          throw new Error(errorMessage);
        }

        console.log("Profile update successful. Fetching updated user profile.");
        await fetchUserProfile(user.user_id);
        setIsNewUser(false); // Marcar que ya no es usuario nuevo
        console.log("✅ Onboarding completado exitosamente, AppNavigator manejará la navegación");
        // No hacer navegación manual - el AppNavigator detectará que el usuario ya tiene bio y navegará automáticamente
      } catch (error) {
        console.error("Error en el proceso de onboarding:", error);
        setError(error.message || "Ocurrió un error al completar tu perfil. Por favor, inténtalo de nuevo.");
      } finally {
        setLoading(false);
      }
    }
  };

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      x.value = event.contentOffset.x;
    },
  });

  const renderItem = ({ item, index }) => {
    const isEnabled = index === currentIndex;
    const disabledStyle = !isEnabled ? styles.disabledStep : null;

    if (item.type === "profile") {
      return (
        <View style={[styles.itemContainer, disabledStyle]}>
          <Text style={styles.stepTitle}>Perfil</Text>
          <View style={styles.bannerBox}>
            <Image
              source={{ uri: bannerImage || "https://via.placeholder.com/400x200" }}
              style={styles.bannerImg}
            />
          </View>
          <View style={styles.avatarOverlapBox}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => isEnabled && pickImage(setProfileImage, "profile")}
              disabled={!isEnabled}
              style={isEnabled ? null : styles.disabledInput}
            >
              <Image
                source={{ uri: profileImage || "https://via.placeholder.com/150" }}
                style={styles.avatarImg}
              />
            </TouchableOpacity>
          </View>
          <Text style={[styles.stepHint, !isEnabled && styles.disabledText]}>
            {profileImage ? "Cambiar foto de perfil" : "Selecciona una foto de perfil"}
          </Text>
        </View>
      );
    }

    if (item.type === "banner") {
      return (
        <View style={[styles.itemContainer, disabledStyle]}>
          <Text style={styles.stepTitle}>Portada</Text>
          <View style={styles.bannerBox}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => isEnabled && pickImage(setBannerImage, "banner")}
              disabled={!isEnabled}
              style={isEnabled ? null : styles.disabledInput}
            >
              <Image
                source={{ uri: bannerImage || "https://via.placeholder.com/400x200" }}
                style={styles.bannerImg}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.avatarOverlapBox}>
            <Image
              source={{ uri: profileImage || "https://via.placeholder.com/150" }}
              style={styles.avatarImg}
            />
          </View>
          <Text style={[styles.stepHint, !isEnabled && styles.disabledText]}>
            {bannerImage ? "Cambiar portada" : "Selecciona una foto de portada (opcional)"}
          </Text>
        </View>
      );
    }

    if (item.type === "bio") {
      return (
        <View style={[styles.itemContainer, disabledStyle]}>
          <Text style={styles.stepTitle}>Biografía</Text>
          <View style={styles.bannerBox}>
            <Image
              source={{ uri: bannerImage || "https://via.placeholder.com/400x200" }}
              style={styles.bannerImg}
            />
          </View>
          <View style={styles.avatarOverlapBox}>
            <Image
              source={{ uri: profileImage || "https://via.placeholder.com/150" }}
              style={styles.avatarImg}
            />
          </View>
          <View style={styles.bioBox}>
            <TextInput
              style={[styles.bioInput, !isEnabled && styles.disabledInput]}
              placeholder="Escribe tu biografía (mínimo 40 caracteres)"
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
              editable={isEnabled}
              minLength={40}
              maxLength={300}
              placeholderTextColor="#aaa"
            />
            <Text style={styles.bioCount}>{bio.length}/300</Text>
            {!isEnabled && (
              <Text style={styles.disabledText}>
                Solo puedes editar tu biografía en este paso
              </Text>
            )}
            {isEnabled && bio.length > 0 && bio.length < 40 && (
              <Text style={styles.errorText}>
                La biografía debe tener al menos 40 caracteres.
              </Text>
            )}
          </View>
        </View>
      );
    }

    return null;
  };

  const buttonAnimationStyle = useAnimatedStyle(() => {
    const isLastScreen = flatListIndex.value === DATA.length - 1;
    return {
      width: isLastScreen ? withTiming(140) : withTiming(60),
      height: 60,
    };
  });

  const arrowAnimationStyle = useAnimatedStyle(() => {
    const isLastScreen = flatListIndex.value === DATA.length - 1;
    return {
      opacity: isLastScreen ? withTiming(0) : withTiming(1),
      transform: [{ translateX: isLastScreen ? withTiming(100) : withTiming(0) }],
    };
  });

  const textAnimationStyle = useAnimatedStyle(() => {
    const isLastScreen = flatListIndex.value === DATA.length - 1;
    return {
      opacity: isLastScreen ? withTiming(1) : withTiming(0),
      transform: [{ translateX: isLastScreen ? withTiming(0) : withTiming(-100) }],
    };
  });

  const dotAnimationStyle = (index) =>
    useAnimatedStyle(() => {
      const opacityAnimation = interpolate(
        x.value,
        [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
        [0.5, 1, 0.5],
        Extrapolate.CLAMP
      );
      const widthAnimation = interpolate(
        x.value,
        [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH],
        [10, 20, 10],
        Extrapolate.CLAMP
      );
      return {
        width: widthAnimation,
        opacity: opacityAnimation,
      };
    });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.container, darkMode && { backgroundColor: "#181A20" }]}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4F8EF7" />
            <Text style={[styles.loadingText, darkMode && { color: "#fff" }]}>
              Actualizando perfil...
            </Text>
          </View>
        )}
        <Animated.FlatList
          ref={flatListRef}
          data={DATA}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          onViewableItemsChanged={({ viewableItems }) => {
            const idx = viewableItems[0]?.index ?? 0;
            flatListIndex.value = idx;
            setCurrentIndex(idx);
          }}
          style={styles.flatList}
        />
        <View style={styles.footerContainer}>
          <View style={styles.pagination}>
            {DATA.map((_, index) => (
              <Animated.View
                key={index}
                style={[styles.dots, dotAnimationStyle(index)]}
              />
            ))}
          </View>
          <Animated.View
            style={[styles.button, buttonAnimationStyle, !isNextEnabled && styles.disabledButton]}
            onTouchEnd={isNextEnabled ? handleNext : null}
          >
            <Animated.Text style={[styles.buttonText, textAnimationStyle]}>Guardar</Animated.Text>
            <Animated.View style={[styles.arrow, arrowAnimationStyle]}>
              <Feather name="arrow-right" size={30} color="#fff" />
            </Animated.View>
          </Animated.View>
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FAFF",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  flatList: {
    flex: 1,
  },
  itemContainer: {
    width: SCREEN_WIDTH,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 20,
    flex: 1,
    paddingTop: 60,
    paddingBottom: 30,
  },
  bannerBox: {
    width: "100%",
    height: 180,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#e9eef6",
    marginBottom: 0,
    marginTop: 0,
  },
  bannerImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  avatarImg: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: "#fff",
    backgroundColor: "#eee",
    elevation: 4,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#4F8EF7",
    marginBottom: 18,
    textAlign: "center",
  },
  stepHint: {
    textAlign: "center",
    marginTop: 16,
    color: "#888",
    fontSize: 15,
  },
  disabledStep: {
    opacity: 0.5,
  },
  disabledInput: {
    opacity: 0.5,
  },
  disabledText: {
    color: "#aaa",
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
  },
  bioBox: {
    backgroundColor: "#F1F4FA",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 24,
    width: "90%",
    minHeight: 120,
    justifyContent: "center",
  },
  bioInput: {
    color: "#222",
    fontSize: 15,
    textAlign: "center",
    minHeight: 80,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  bioCount: {
    textAlign: "right",
    color: "#888",
    fontSize: 12,
    marginTop: 4,
  },
  footerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "#fff",
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
  },
  dots: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4F8EF7",
    marginHorizontal: 4,
  },
  loadingText: {
    color: "#222",
    marginTop: 8,
  },
  avatarOverlapBox: {
    alignItems: "center",
    marginTop: -55,
    marginBottom: 0,
    zIndex: 2,
  },
  button: {
    backgroundColor: "#4F8EF7",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    flexDirection: "row",
    paddingHorizontal: 15,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    position: "absolute",
  },
  arrow: {
    position: "absolute",
  },
  disabledButton: {
    opacity: 0.5,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
    marginBottom: 10,
    textAlign: "center",
    backgroundColor: "#FEF2F2",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
    marginHorizontal: 20,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
});