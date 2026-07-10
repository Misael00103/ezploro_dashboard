import AsyncStorage from "@react-native-async-storage/async-storage";
import jwt_decode from "jwt-decode";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
    API_URL_AUTH_GOOGLE,
    API_URL_AUTH_LOGOUT,
    API_URL_BOOKMARKS,
    API_URL_FOLLOWERS_COUNT,
    API_URL_FOLLOWING_COUNT,
    API_URL_PASSWORD_RESET_COMPLETE,
    API_URL_PASSWORD_RESET_CONFIRM,
    API_URL_PASSWORD_RESET_REQUEST,
    API_URL_USERS_BY_ID,
    API_URL_USERS_SUBSCRIBED_EVENTS,
    API_URL_USERS_UPDATE,
    BASE_URL
} from "../config";
import api from "../services/api";
import { authService } from "../services/authService";
import tokenService from "../services/tokenService";

const AuthContext = createContext();

const decodeTokenManually = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("❌ Error decodificando token manualmente:", error.message);
    return null;
  }
};

const isTokenExpired = (token) => {
  try {
    const decoded = jwt_decode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true; // If we can't decode, assume expired
  }
};

const checkTokenAndLogout = async (token, logoutFunction) => {
  if (!token) return false;

  if (isTokenExpired(token)) {
    console.warn("⚠️ Token expirado detectado, haciendo logout automático...");
    await logoutFunction(false); // No enviar request al servidor si el token está expirado
    return true;
  }
  return false;
};

const fetchWithRetry = async (url, options = {}, retries = 3, delay = 1000, isRetry = false) => {
  const cleanUrl = url.trim();
  console.log(`🔄 Iniciando fetch a \`${cleanUrl}\``);

  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn(`⏰ Solicitud abortada por timeout para ${cleanUrl}`);
      }, 15000);

      const response = await fetch(cleanUrl, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log(`✅ Respuesta recibida de \`${cleanUrl}:\` ${response.status}`);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const contentType = response.headers.get("content-type") || "";
          const text = await response.text();
          if (contentType.includes("application/json") && text) {
            const errorData = JSON.parse(text);
            errorMessage = errorData.message || errorData.error || `Error HTTP ${response.status}`;
          } else {
            console.warn(`⚠️ Respuesta no es JSON para ${cleanUrl}:`, text.slice(0, 100));
            errorMessage =
              response.status === 404
                ? "El endpoint no está disponible en el servidor. Verifica que el servidor esté configurado correctamente."
                : `Error HTTP ${response.status}: Respuesta no válida`;
          }
        } catch (jsonError) {
          console.warn(`⚠️ No se pudo parsear la respuesta de error para ${cleanUrl}:`, jsonError.message);
          errorMessage =
            response.status === 404
              ? "El endpoint no está disponible en el servidor. Verifica que el servidor esté configurado correctamente."
              : `Error HTTP ${response.status}: Respuesta no válida`;
        }

        const error = new Error(errorMessage, { cause: `HTTP_${response.status}` });
        error.status = response.status;
        error.response = response;
        throw error;
      }

      return response;
    } catch (error) {
      if (error.name === "AbortError") {
        console.warn(`⏰ Timeout al conectar con ${cleanUrl}`);
        throw new Error(`La solicitud tardó demasiado tiempo en responder. Verifica tu conexión a internet.`, {
          cause: "AbortError",
        });
      } else if (error.message.includes("Network request failed")) {
        console.warn(`🌐 Error de red para ${cleanUrl}:`, error.message);
        throw new Error(
          `No se pudo conectar al servidor. Verifica tu conexión a internet y que el servidor esté funcionando.`,
          { cause: "NetworkError" }
        );
      }

      // No reintentar errores de validación (400, 401, 403, 404)
      if (error.status && [400, 401, 403, 404].includes(error.status)) {
        throw error;
      }

      console.warn(`❌ Intento ${i + 1} fallido para ${cleanUrl}:`, error.message);
      if (i === retries - 1) {
        if (error.message.includes("HTTP 500")) {
          throw new Error("Error del servidor", { cause: "HTTP_500" });
        }
        throw new Error(`No se pudo completar la solicitud después de ${retries} intentos: ${error.message}`, {
          cause: error,
        });
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  return null;
};

const sanitizeUser = (userObj) => ({
  user_id: userObj?.user_id ?? "",
  email: userObj?.email ?? "",
  display_name: userObj?.display_name ?? "",
  username: userObj?.username ?? "",
  bio: userObj?.bio ?? "",
  profile_picture: userObj?.profile_picture ?? "",
  banner_image: userObj?.banner_image ?? "",
  name: userObj?.name ?? "",
  lastname: userObj?.lastname ?? "",
  role: userObj?.role ?? "user",
  dark_mode: userObj?.dark_mode ?? false,
  notifications_enabled: userObj?.notifications_enabled ?? true,
  created_at: userObj?.created_at ?? "",
  liked_events: Array.isArray(userObj?.liked_events) ? userObj.liked_events : [],
  subscribed_events: Array.isArray(userObj?.subscribed_events) ? userObj.subscribed_events : [],
  bookmarks: Array.isArray(userObj?.bookmarks) ? userObj.bookmarks : [],
  followers: userObj?.followers ?? 0,
  following: userObj?.following ?? 0,
  online_status: userObj?.online_status ?? false,
  ...userObj,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasPremium, setHasPremium] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [userCredentials, setUserCredentials] = useState(null); // Para refresh automático
  const isCheckingLogin = useRef(false);

  // Función de logout simple que siempre funciona
  const logoutNow = useCallback(async () => {
    try {
      console.log("🚪 Logout inmediato iniciado...");

      // Limpiar datos locales inmediatamente
      await Promise.all([
        AsyncStorage.removeItem("user"),
        AsyncStorage.removeItem("token"),
        AsyncStorage.removeItem("isGuest"),
        AsyncStorage.removeItem("premium"),
      ]);

      // Detener monitoreo de token
      tokenService.stopTokenMonitoring();

      setUser(null);
      setToken(null);
      setUserId(null);
      setHasPremium(false);
      setIsGuest(false);
      setIsNewUser(false);
      setUserCredentials(null);
      setLoading(false);

      console.log("✅ Logout inmediato completado");
      return { success: true };
    } catch (error) {
      console.error("❌ Error en logout inmediato:", error.message);
      return { success: false, error: error.message };
    }
  }, []);

  // Función para manejar token inválido
  const handleTokenInvalid = useCallback(async () => {
    console.log("🚨 Token inválido detectado, haciendo logout automático...");
    await logoutNow();
  }, [logoutNow]);

  // Registrar callback para token inválido
  useEffect(() => {
    api.setTokenInvalidCallback(handleTokenInvalid);
    console.log("🔑 Callback de token inválido registrado");

    return () => {
      api.setTokenInvalidCallback(null);
    };
  }, [handleTokenInvalid]);

  const fetchUserProfile = useCallback(
    async (userIdToFetch, updateState = true) => {
      try {
        console.log("👤 Obteniendo perfil de usuario:", userIdToFetch);
        
        // Verificar si es usuario guest
        const storedIsGuest = await AsyncStorage.getItem("isGuest");
        if (storedIsGuest === "true" || isGuest) {
          console.log("👤 Usuario guest detectado, usando perfil local");
          const storedUser = await AsyncStorage.getItem("user");
          if (storedUser) {
            const guestUser = JSON.parse(storedUser);
            if (updateState) {
              setUser(guestUser);
            }
            return guestUser;
          }
          return null;
        }
        
        const storedToken = token || (await AsyncStorage.getItem("token"));
        if (!storedToken || !userIdToFetch) {
          console.warn("⚠️ No se encontró token o ID de usuario para obtener el perfil.");
          return null;
        }

        const userUrl = API_URL_USERS_BY_ID.replace(":userId", userIdToFetch);
        const userResponse = await fetchWithRetry(userUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (!userResponse) {
          throw new Error("No se pudo conectar al servidor para obtener el perfil. Verifica tu conexión a internet.");
        }

        if (!userResponse.ok) {
          if (userResponse.status === 401) {
            throw new Error("Sesión expirada o no válida. Por favor, inicia sesión nuevamente.");
          } else if (userResponse.status === 404) {
            throw new Error("El perfil de usuario no existe o ha sido eliminado.");
          } else if (userResponse.status >= 500) {
            throw new Error("Error del servidor al obtener el perfil. Por favor, intenta más tarde.");
          }

          let errorMessage = "Error desconocido al obtener el perfil";
          try {
            const errorData = await userResponse.json();
            errorMessage = errorData.message || `Error HTTP ${userResponse.status}`;
          } catch (jsonError) {
            errorMessage = `Error HTTP ${userResponse.status}`;
          }
          throw new Error(`Error al obtener datos básicos del perfil: ${errorMessage}`);
        }

        let userData;
        try {
          const responseData = await userResponse.json();
          userData = responseData.data || {};
        } catch (jsonError) {
          throw new Error("Error al procesar la respuesta del servidor: formato inválido");
        }

        let sanitizedProfile = sanitizeUser(userData);

        try {
          const [followersData, followingData, subscribedEventsData, bookmarksData] = await Promise.allSettled([
            fetchWithRetry(API_URL_FOLLOWERS_COUNT.replace(":userId", userIdToFetch), {
              method: "GET",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${storedToken}` },
            }).then((res) => (res?.ok ? res.json() : null)),
            fetchWithRetry(API_URL_FOLLOWING_COUNT.replace(":userId", userIdToFetch), {
              method: "GET",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${storedToken}` },
            }).then((res) => (res?.ok ? res.json() : null)),
            fetchWithRetry(API_URL_USERS_SUBSCRIBED_EVENTS.replace(":userId", userIdToFetch), {
              method: "GET",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${storedToken}` },
            }).then((res) => (res?.ok ? res.json() : null)),
            fetchWithRetry(API_URL_BOOKMARKS.replace(":userId", userIdToFetch), {
              method: "GET",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${storedToken}` },
            }).then((res) => (res?.ok ? res.json() : null)),
          ]);

          if (followersData.status === "fulfilled" && followersData.value) {
            sanitizedProfile.followers = followersData.value.followers_count || 0;
          }
          if (followingData.status === "fulfilled" && followingData.value) {
            sanitizedProfile.following = followingData.value.following_count || 0;
          }
          if (subscribedEventsData.status === "fulfilled" && subscribedEventsData.value) {
            sanitizedProfile.subscribed_events = Array.isArray(subscribedEventsData.value.events)
              ? subscribedEventsData.value.events.map((e) => e.event_id)
              : [];
          }
          if (bookmarksData.status === "fulfilled" && bookmarksData.value) {
            sanitizedProfile.bookmarks = Array.isArray(bookmarksData.value.bookmarks)
              ? bookmarksData.value.bookmarks.map((b) => b.event_id)
              : [];
          }
        } catch (additionalDataError) {
          console.warn("⚠️ Error al obtener datos adicionales del perfil:", additionalDataError.message);
        }

        await AsyncStorage.setItem("user", JSON.stringify(sanitizedProfile));
        if (updateState) {
          setUser(sanitizedProfile);
        }
        console.log("✅ Perfil de usuario obtenido exitosamente");
        return sanitizedProfile;
      } catch (error) {
        console.error("❌ Error al obtener perfil de usuario:", error.message);
        if (updateState) {
          setUser(null);
        }
        return null;
      }
    },
    [token]
  );

  const logout = useCallback(
    async (sendRequest = true) => {
      const startTime = Date.now();
      try {
        console.log("🚪 Iniciando logout...");
        setLoading(true);

        // Intentar hacer logout en el servidor, pero no fallar si hay error
        if (sendRequest && token) {
          try {
            await fetchWithRetry(API_URL_AUTH_LOGOUT, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            });
            console.log("✅ Logout del servidor exitoso");
          } catch (serverError) {
            // Si el token es inválido (403, 401) o hay otros errores del servidor,
            // continuamos con el logout local sin fallar
            console.warn("⚠️ Error en logout del servidor (continuando con logout local):", serverError.message);
          }
        }

        // Logout de Google Sign-In si está disponible
        try {
          const { default: googleSignInService } = await import('../services/googleSignInService');
          const isSignedIn = await googleSignInService.isSignedIn();
          if (isSignedIn) {
            await googleSignInService.signOut();
            console.log("✅ Google Sign-Out exitoso");
          }
        } catch (googleError) {
          console.warn("⚠️ Error en Google Sign-Out (continuando):", googleError.message);
        }

        // Limpiar datos locales siempre, independientemente del resultado del servidor
        await Promise.all([
          AsyncStorage.removeItem("user"),
          AsyncStorage.removeItem("token"),
          AsyncStorage.removeItem("isGuest"),
          AsyncStorage.removeItem("premium"),
        ]);

        // Detener monitoreo de token
        tokenService.stopTokenMonitoring();

        setUser(null);
        setToken(null);
        setUserId(null);
        setHasPremium(false);
        setIsGuest(false);
        setIsNewUser(false);
        setUserCredentials(null);
        console.log("✅ Logout completado exitosamente");
        return { success: true };
      } catch (error) {
        console.error("❌ Error durante el proceso de logout:", error.message);

        // Incluso si hay error, intentar limpiar datos locales
        try {
          await Promise.all([
            AsyncStorage.removeItem("user"),
            AsyncStorage.removeItem("token"),
            AsyncStorage.removeItem("isGuest"),
            AsyncStorage.removeItem("premium"),
          ]);
          setUser(null);
          setToken(null);
          setUserId(null);
          setHasPremium(false);
          setIsGuest(false);
          setIsNewUser(false);
          console.log("✅ Datos locales limpiados después de error");
        } catch (cleanupError) {
          console.error("❌ Error limpiando datos locales:", cleanupError.message);
        }

        return { success: false, error: error.message };
      } finally {
        const elapsedTime = Date.now() - startTime;
        setTimeout(() => setLoading(false), Math.max(0, 500 - elapsedTime));
      }
    },
    [token]
  );

  const login = useCallback(
    async (email, password) => {
      const startTime = Date.now();
      try {
        console.log("🔐 Iniciando login para:", email);
        setLoading(true);

        // ✅ Usar authService
        const result = await authService.login(email, password);

        const { token: newToken, user: userData } = result.data;

        setToken(newToken);
        setUser(userData);
        setUserId(userData.user_id);
        setIsGuest(false);
        setIsNewUser(false); // Usuario existente
        await AsyncStorage.removeItem("isGuest");

        // Guardar credenciales para refresh automático (opcional)
        setUserCredentials({ email, password });

        // Iniciar monitoreo automático del token
        tokenService.startTokenMonitoring(
          newToken,
          (refreshedToken) => {
            console.log("🔄 Token renovado automáticamente");
            setToken(refreshedToken);
          },
          { email, password }
        );

        console.log("✅ Login exitoso para usuario:", userData.user_id);
        console.log("🔍 DEBUG: Returning login result with user:", {
          hasUser: !!userData,
          userId: userData?.user_id,
          userKeys: userData ? Object.keys(userData) : 'no user'
        });
        return { success: true, user: userData, token: newToken };
      } catch (error) {
        console.error("❌ Error de login:", error.message);
        console.error("❌ Error stack:", error.stack);
        await AsyncStorage.removeItem("token");
        setToken(null);
        return { success: false, error: error.message };
      } finally {
        const elapsedTime = Date.now() - startTime;
        setTimeout(() => setLoading(false), Math.max(0, 1000 - elapsedTime));
      }
    },
    [fetchUserProfile]
  );

  const loginAsInvited = useCallback(async () => {
    const startTime = Date.now();
    try {
      console.log("👤 Iniciando login como invitado...");
      setLoading(true);

      // ✅ Usar authService para guest login (si existe)
      let result;
      if (authService.guestLogin) {
        result = await authService.guestLogin();
      } else {
        // Fallback: crear usuario invitado local
        result = {
          data: {
            token: 'guest-token',
            user: {
              user_id: 'guest',
              email: 'guest@example.com',
              display_name: 'Invitado',
              username: 'guest',
              role: 'guest'
            }
          }
        };
      }

      const { token: newToken, user: guestUser } = result.data;

      const sanitizedUser = sanitizeUser({
        ...guestUser,
        bio: "Este es un perfil de invitado.",
      });

      setToken(newToken);
      setUser(sanitizedUser);
      setHasPremium(false);
      setUserId(sanitizedUser.user_id);
      setIsGuest(true);

      console.log("✅ Login como invitado exitoso");
      return { success: true, user: sanitizedUser, token: newToken };
    } catch (error) {
      console.error("❌ Error en login como invitado:", error.message);
      return { success: false, error: error.message };
    } finally {
      const elapsedTime = Date.now() - startTime;
      setTimeout(() => setLoading(false), Math.max(0, 1000 - elapsedTime));
    }
  }, []);

  const register = useCallback(
    async (userData, profileImage = null) => {
      const startTime = Date.now();
      try {
        console.log("📝 Iniciando registro para:", userData.email);
        setLoading(true);

        // ✅ Usar authService con soporte para imágenes
        const result = await authService.register(userData);

        const { token: newToken, user: registeredUser } = result.data;

        setToken(newToken);
        setUser(registeredUser);
        setUserId(registeredUser.user_id);
        setIsGuest(false);
        setIsNewUser(true); // Marcar como usuario nuevo
        await AsyncStorage.removeItem("isGuest");

        console.log("✅ Registro exitoso para usuario:", registeredUser.user_id);
        return { success: true, user: registeredUser, token: newToken };
      } catch (error) {
        console.error("❌ Error de registro:", error.message);
        return { success: false, error: error.message };
      } finally {
        const elapsedTime = Date.now() - startTime;
        setTimeout(() => setLoading(false), Math.max(0, 1000 - elapsedTime));
      }
    },
    [fetchUserProfile]
  );

  const updateUser = useCallback(
    async (userData) => {
      try {
        console.log("🔄 Actualizando usuario:", userId);
        console.log("📝 Datos a actualizar:", userData);
        setLoading(true);
        const storedToken = token || (await AsyncStorage.getItem("token"));
        if (!storedToken || !userId) {
          throw new Error("No se encontró token o ID de usuario para actualizar.");
        }

        const updateUrl = API_URL_USERS_UPDATE.replace(":userId", userId);
        console.log("🎯 URL de actualización:", updateUrl);

        const response = await fetchWithRetry(updateUrl, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${storedToken}`,
          },
          body: JSON.stringify(userData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Error al actualizar usuario");
        }

        // Actualizar el usuario local inmediatamente con los datos enviados
        const currentUser = user || JSON.parse(await AsyncStorage.getItem("user") || '{}');
        const updatedUserData = { ...currentUser, ...userData };

        // Guardar y actualizar estado inmediatamente
        await AsyncStorage.setItem("user", JSON.stringify(updatedUserData));
        setUser(updatedUserData);

        // Obtener perfil completo en segundo plano (sin bloquear la UI)
        fetchUserProfile(userId, false).then(fullProfile => {
          if (fullProfile) {
            // Solo actualizar si no hay conflictos con los datos que acabamos de cambiar
            const mergedProfile = { ...fullProfile, ...userData };
            setUser(mergedProfile);
            AsyncStorage.setItem("user", JSON.stringify(mergedProfile));
          }
        }).catch(error => {
          console.warn("⚠️ Error al obtener perfil completo:", error.message);
        });

        console.log("✅ Usuario actualizado exitosamente");
        return { success: true, user: updatedUserData };
      } catch (error) {
        console.error("❌ Error al actualizar usuario:", error.message);
        return { success: false, error: error.message };
      } finally {
        setLoading(false);
      }
    },
    [token, userId, fetchUserProfile]
  );

  const googleLogin = useCallback(
    async (idToken) => {
      const startTime = Date.now();
      try {
        console.log("🔐 Iniciando login con Google...");
        setLoading(true);

        // Usar el endpoint /google que espera id_token
        const response = await fetchWithRetry(API_URL_AUTH_GOOGLE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_token: idToken,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || errorData.error || "Error de login con Google");
        }

        const data = await response.json();
        console.log("📦 Respuesta de Google login:", data);

        // Tu backend googleAuth devuelve: { message, user, token }
        const { token: newToken, user: basicUser } = data;

        await AsyncStorage.setItem("token", newToken);
        setToken(newToken);

        let decoded;
        try {
          decoded = jwt_decode(newToken);
        } catch (decodeError) {
          console.warn("⚠️ Error decodificando token JWT en login con Google, intentando decodificación manual...");
          decoded = decodeTokenManually(newToken);
          if (!decoded || !decoded.user_id) {
            throw new Error("El token recibido es inválido. Por favor, intenta iniciar sesión nuevamente.");
          }
        }

        // Si el backend ya devuelve el perfil completo, usarlo directamente
        let fullUserProfile = basicUser;

        // Si no, obtener el perfil completo
        if (!fullUserProfile || !fullUserProfile.user_id) {
          fullUserProfile = await fetchUserProfile(decoded.user_id);
          if (!fullUserProfile) {
            throw new Error("No se pudo obtener el perfil completo después del login con Google.");
          }
        } else {
          // Sanitizar el perfil recibido del backend
          fullUserProfile = sanitizeUser(fullUserProfile);
          await AsyncStorage.setItem("user", JSON.stringify(fullUserProfile));
        }

        setUser(fullUserProfile);
        setUserId(fullUserProfile.user_id || decoded.user_id);
        setIsGuest(false);

        console.log("✅ Login con Google exitoso para usuario:", fullUserProfile.user_id);
        return {
          success: true,
          user: fullUserProfile,
          token: newToken,
          isNewUser: data.isNewUser || false
        };
      } catch (error) {
        console.error("❌ Error de login con Google:", error.message);
        return { success: false, error: error.message };
      } finally {
        const elapsedTime = Date.now() - startTime;
        setTimeout(() => setLoading(false), Math.max(0, 1000 - elapsedTime));
      }
    },
    [fetchUserProfile]
  );

  const refreshUser = useCallback(async () => {
    if (userId) {
      console.log("🔄 Refrescando datos del usuario...");
      return await fetchUserProfile(userId);
    }
    return null;
  }, [userId, fetchUserProfile]);

  const refreshToken = useCallback(async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      if (!storedToken) return { success: false, error: 'No token found' };

      const response = await fetch(API_URL_AUTH_REFRESH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`
        },
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      const newToken = data.token;

      await AsyncStorage.setItem('token', newToken);
      setToken(newToken);

      return { success: true, token: newToken };
    } catch (error) {
      console.error('Error refreshing token:', error);
      await AsyncStorage.removeItem('token');
      setToken(null);
      setUser(null);
      return { success: false, error: error.message };
    }
  }, []);

  const forgotPassword = useCallback(async (email) => {
    try {
      console.log("📧 Solicitando reseteo de contraseña para:", email);

      const response = await fetchWithRetry(API_URL_PASSWORD_RESET_REQUEST, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      // Verificar si la respuesta es HTML (indica error del servidor)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        console.error("⚠️ Servidor devolvió HTML en lugar de JSON - endpoint no disponible");
        return {
          success: false,
          error: "El endpoint no está disponible en el servidor. Verifica que el servidor esté configurado correctamente."
        };
      }

      if (!response.ok) {
        if (response.status === 500) {
          return {
            success: false,
            error: "Error del servidor. La configuración de email no está funcionando."
          };
        }

        let errorMessage = "Error al solicitar reseteo";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          console.error("Error parsing response:", parseError);
          errorMessage = "Error de comunicación con el servidor";
        }

        return { success: false, error: errorMessage };
      }

      let data;
      try {
        data = await response.json();
        console.log("✅ Código de reseteo enviado exitosamente");
        return { success: true, data: data.data || data };
      } catch (parseError) {
        console.error("Error parsing success response:", parseError);
        return {
          success: false,
          error: "Respuesta del servidor no válida"
        };
      }
    } catch (error) {
      console.error("❌ Error al solicitar reseteo:", error.message);
      return {
        success: false,
        error: "Error del servidor. Intenta más tarde."
      };
    }
  }, []);

  const confirmResetPin = useCallback(async (email, pin) => {
    try {
      console.log("🔐 Verificando PIN para:", email, "PIN:", pin);
      const response = await fetchWithRetry(API_URL_PASSWORD_RESET_CONFIRM, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pin }),
      });

      const data = await response.json();
      console.log("✅ PIN confirmado exitosamente");
      return { success: true, data: data.data || data };
    } catch (error) {
      console.error("❌ Error al confirmar PIN:", error.message);
      return {
        success: false,
        error: error.message || "Error al verificar el código. Intenta de nuevo."
      };
    }
  }, []);

  const resetPassword = useCallback(async (email, newPassword, confirmPassword) => {
    try {
      console.log("🔄 Restableciendo contraseña para:", email);
      const response = await fetchWithRetry(API_URL_PASSWORD_RESET_COMPLETE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword, confirmPassword }),
      });

      const data = await response.json();
      console.log("✅ Contraseña restablecida exitosamente");
      return { success: true, data: data.data || data };
    } catch (error) {
      console.error("❌ Error al restablecer contraseña:", error.message);
      return {
        success: false,
        error: error.message || "Error al restablecer la contraseña. Intenta de nuevo."
      };
    }
  }, []);

  useEffect(() => {
    const checkLoginStatus = async () => {
      if (isCheckingLogin.current) return; // Solo evitar verificaciones duplicadas
      isCheckingLogin.current = true;
      const startTime = Date.now();

      try {
        console.log("🔍 Verificando estado de login...");
        const [userDataRaw, storedToken, guestStatus, premiumStatus] = await Promise.all([
          AsyncStorage.getItem("user"),
          AsyncStorage.getItem("token"),
          AsyncStorage.getItem("isGuest"),
          AsyncStorage.getItem("premium"),
        ]);

        if (userDataRaw && storedToken) {
          // Verificar si es un token guest
          if (storedToken.startsWith('guest_token_')) {
            console.log("👤 Token guest detectado, configurando sesión guest");
            setToken(storedToken);
            setIsGuest(true);
            setHasPremium(false);
            
            try {
              const parsedUser = JSON.parse(userDataRaw);
              const sanitizedUser = sanitizeUser(parsedUser);
              setUser(sanitizedUser);
              setUserId(sanitizedUser.user_id);
              console.log("✅ Sesión guest restaurada exitosamente");
            } catch (parseError) {
              console.warn("⚠️ Error parseando datos de usuario guest:", parseError);
              await logout(false);
            }
            return;
          }

          // Para tokens normales (JWT)
          let decoded;
          try {
            decoded = jwt_decode(storedToken);
          } catch (decodeError) {
            console.warn("⚠️ Error decodificando token, intentando decodificación manual...");
            decoded = decodeTokenManually(storedToken);
          }

          if (decoded && decoded.user_id) {
            if (decoded.exp && decoded.exp < Date.now() / 1000) {
              console.warn("⚠️ Token expirado, cerrando sesión...");
              await logout(false);
              return;
            }

            setToken(storedToken);
            setUserId(decoded.user_id);
            if (guestStatus === "true") {
              await AsyncStorage.removeItem("isGuest");
            }
            setIsGuest(false);
            setHasPremium(premiumStatus === "true");

            try {
              const parsedUser = JSON.parse(userDataRaw);
              const sanitizedUser = sanitizeUser(parsedUser);
              setUser(sanitizedUser);
              fetchUserProfile(decoded.user_id, false);
            } catch (parseError) {
              console.warn("⚠️ Error parseando datos de usuario, obteniendo perfil fresco...");
              await fetchUserProfile(decoded.user_id);
            }

            console.log("✅ Estado de login verificado exitosamente");
          } else {
            console.warn("⚠️ Token inválido, cerrando sesión...");
            await logout(false);
          }
        } else {
          console.log("ℹ️ No hay sesión activa");
          // Asegurar que el loading se complete cuando no hay sesión
          setLoading(false);
        }
      } catch (error) {
        console.error("❌ Error al verificar estado de login:", error.message);
        // Asegurar que el loading se complete incluso con errores
        setLoading(false);
      } finally {
        const elapsedTime = Date.now() - startTime;
        setTimeout(() => {
          setLoading(false);
          isCheckingLogin.current = false;
        }, Math.max(0, 1000 - elapsedTime));
      }
    };

    checkLoginStatus();
  }, []);



  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      console.log("🔄 Cambiando contraseña para usuario:", user?.user_id);

      const requestBody = {
        currentPassword,
        newPassword,
        confirmNewPassword: newPassword,
      };

      console.log("📤 Enviando datos:", {
        ...requestBody,
        currentPassword: "***",
        newPassword: "***",
        confirmNewPassword: "***"
      });

      const response = await fetch(`${BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("❌ Error en change password:", data);
        return {
          success: false,
          error: data.message || "Failed to change password"
        };
      }

      console.log("✅ Contraseña cambiada exitosamente");
      return {
        success: true,
        message: data.message || "Password changed successfully"
      };

    } catch (error) {
      console.error("❌ Error en change password:", error);
      return {
        success: false,
        error: error.message || "Network error occurred"
      };
    }
  }, [user?.user_id, token]);

  const value = {
    user,
    token,
    loading,
    hasPremium,
    userId,
    isGuest,
    isNewUser,
    setIsNewUser,
    login,
    loginAsInvited,
    logout,
    logoutNow, // Función de logout que siempre funciona
    register,
    fetchUserProfile,
    updateUser,
    googleLogin,
    refreshUser,
    forgotPassword,
    confirmResetPin,
    resetPassword,
    changePassword,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};
