import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import userBlockService from '../services/userBlockService';

/**
 * Hook personalizado para manejar bloqueo/desbloqueo de usuarios
 * Puede ser usado desde cualquier pantalla
 */
export const useUserBlock = () => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);

  /**
   * Bloquear un usuario
   * @param {number} targetUserId - ID del usuario a bloquear
   * @param {string} reason - Razón del bloqueo (opcional)
   * @param {function} onSuccess - Callback ejecutado en caso de éxito
   * @param {function} onError - Callback ejecutado en caso de error
   */
  const blockUser = useCallback(async (targetUserId, reason = null, onSuccess = null, onError = null) => {
    if (!user?.user_id || !token) {
      Alert.alert("Error", "You must be logged in to block users");
      return false;
    }

    if (user.user_id === targetUserId) {
      Alert.alert("Error", "You cannot block yourself");
      return false;
    }

    setLoading(true);
    try {
      console.log(`🚫 Blocking user ${targetUserId} with reason: ${reason || 'No reason provided'}`);
      
      const result = await userBlockService.blockUser(token, user.user_id, targetUserId, reason);
      
      console.log("✅ User blocked successfully:", result);
      
      if (onSuccess) {
        onSuccess(result);
      } else {
        Alert.alert("Success", "User blocked successfully");
      }
      
      return true;
    } catch (error) {
      console.error("❌ Error blocking user:", error);
      
      const errorMessage = error.message || "Failed to block user";
      
      if (onError) {
        onError(error);
      } else {
        Alert.alert("Error", errorMessage);
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.user_id, token]);

  /**
   * Desbloquear un usuario
   * @param {number} targetUserId - ID del usuario a desbloquear
   * @param {function} onSuccess - Callback ejecutado en caso de éxito
   * @param {function} onError - Callback ejecutado en caso de error
   */
  const unblockUser = useCallback(async (targetUserId, onSuccess = null, onError = null) => {
    if (!user?.user_id || !token) {
      Alert.alert("Error", "You must be logged in to unblock users");
      return false;
    }

    setLoading(true);
    try {
      console.log(`🔓 Unblocking user ${targetUserId}`);
      
      const result = await userBlockService.unblockUser(token, user.user_id, targetUserId);
      
      console.log("✅ User unblocked successfully:", result);
      
      if (onSuccess) {
        onSuccess(result);
      } else {
        Alert.alert("Success", "User unblocked successfully");
      }
      
      return true;
    } catch (error) {
      console.error("❌ Error unblocking user:", error);
      
      const errorMessage = error.message || "Failed to unblock user";
      
      if (onError) {
        onError(error);
      } else {
        Alert.alert("Error", errorMessage);
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.user_id, token]);

  /**
   * Verificar si un usuario está bloqueado
   * @param {number} targetUserId - ID del usuario a verificar
   * @returns {Promise<boolean>} - true si está bloqueado, false si no
   */
  const checkIfBlocked = useCallback(async (targetUserId) => {
    if (!user?.user_id || !token) {
      return false;
    }

    try {
      const result = await userBlockService.checkMutualBlock(token, user.user_id, targetUserId);
      return result.isBlocked;
    } catch (error) {
      console.error("❌ Error checking block status:", error);
      return false;
    }
  }, [user?.user_id, token]);

  /**
   * Mostrar modal de confirmación para bloquear usuario
   * @param {object} targetUser - Objeto del usuario a bloquear
   * @param {function} onSuccess - Callback ejecutado en caso de éxito
   */
  const confirmBlockUser = useCallback((targetUser, onSuccess = null) => {
    const userName = targetUser.display_name || targetUser.name || targetUser.username || 'this user';
    
    Alert.alert(
      "Block User",
      `Are you sure you want to block ${userName}? You won't see their messages or content anymore.`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Block",
          style: "destructive",
          onPress: () => blockUser(targetUser.user_id || targetUser.id, "Blocked by user", onSuccess)
        }
      ]
    );
  }, [blockUser]);

  /**
   * Mostrar modal de confirmación para desbloquear usuario
   * @param {object} targetUser - Objeto del usuario a desbloquear
   * @param {function} onSuccess - Callback ejecutado en caso de éxito
   */
  const confirmUnblockUser = useCallback((targetUser, onSuccess = null) => {
    const userName = targetUser.display_name || targetUser.name || targetUser.username || 'this user';
    
    Alert.alert(
      "Unblock User",
      `Are you sure you want to unblock ${userName}?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Unblock",
          onPress: () => unblockUser(targetUser.user_id || targetUser.id, onSuccess)
        }
      ]
    );
  }, [unblockUser]);

  return {
    loading,
    blockUser,
    unblockUser,
    checkIfBlocked,
    confirmBlockUser,
    confirmUnblockUser,
  };
};

export default useUserBlock;