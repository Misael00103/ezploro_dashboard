import {
  API_URL_USER_BLOCK,
  API_URL_USER_UNLOCK,
  API_URL_USER_BLOCKED_LIST,
  API_URL_USER_BLOCK_CHECK,
} from '../config';

class UserBlockService {
  /**
   * Bloquear un usuario
   * @param {string} token - Token de autenticación
   * @param {number} blockerUserId - ID del usuario que bloquea
   * @param {number} blockedUserId - ID del usuario a bloquear
   * @param {string} reason - Razón del bloqueo (opcional)
   * @returns {Promise<Object>} Respuesta del servidor
   */
  async blockUser(token, blockerUserId, blockedUserId, reason = null) {
    try {
      console.log(`🚫 Bloqueando usuario ${blockedUserId}`);
      
      const response = await fetch(API_URL_USER_BLOCK, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blocked_user_id: blockedUserId,
          reason: reason,
        }),
      });

      console.log(`🌐 Block request to: ${API_URL_USER_BLOCK}`);
      console.log(`📄 Request payload:`, { blocked_user_id: blockedUserId, reason });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
      }

      console.log(`✅ Usuario ${blockedUserId} bloqueado exitosamente`);
      return data;
    } catch (error) {
      console.error('❌ Error bloqueando usuario:', error);
      throw error;
    }
  }

  /**
   * Desbloquear un usuario
   * @param {string} token - Token de autenticación
   * @param {number} blockerUserId - ID del usuario que bloqueó
   * @param {number} blockedUserId - ID del usuario a desbloquear
   * @returns {Promise<Object>} Respuesta del servidor
   */
  async unblockUser(token, blockerUserId, blockedUserId) {
    try {
      console.log(`🔓 Desbloqueando usuario ${blockedUserId}`);
      
      const response = await fetch(API_URL_USER_UNLOCK, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blocked_user_id: blockedUserId,
        }),
      });

      console.log(`🌐 Unblock request to: ${API_URL_USER_UNLOCK}`);
      console.log(`📄 Request payload:`, { blocked_user_id: blockedUserId });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
      }

      console.log(`✅ Usuario ${blockedUserId} desbloqueado exitosamente`);
      return data;
    } catch (error) {
      console.error('❌ Error desbloqueando usuario:', error);
      throw error;
    }
  }

  /**
   * Obtener lista de usuarios bloqueados
   * @param {string} token - Token de autenticación
   * @param {number} userId - ID del usuario
   * @param {number} limit - Límite de resultados (opcional)
   * @param {number} offset - Offset para paginación (opcional)
   * @returns {Promise<Object>} Lista de usuarios bloqueados
   */
  async getBlockedUsers(token, userId, limit = 50, offset = 0) {
    try {
      console.log(`📋 Obteniendo usuarios bloqueados para usuario ${userId}`);
      
      const url = API_URL_USER_BLOCKED_LIST.replace(':user_id', userId);
      const queryParams = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      const response = await fetch(`${url}?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
      }

      console.log(`✅ Obtenidos ${data.blocked_users?.length || 0} usuarios bloqueados`);
      return data;
    } catch (error) {
      console.error('❌ Error obteniendo usuarios bloqueados:', error);
      throw error;
    }
  }

  /**
   * Verificar si un usuario está bloqueado
   * @param {string} token - Token de autenticación
   * @param {number} blockerUserId - ID del usuario que podría haber bloqueado
   * @param {number} blockedUserId - ID del usuario que podría estar bloqueado
   * @returns {Promise<Object>} Estado de bloqueo
   */
  async checkIfBlocked(token, blockerUserId, blockedUserId) {
    try {
      console.log(`🔍 Verificando si usuario ${blockedUserId} está bloqueado por ${blockerUserId}`);
      
      const queryParams = new URLSearchParams({
        blocker_user_id: blockerUserId.toString(),
        blocked_user_id: blockedUserId.toString(),
      });

      const response = await fetch(`${API_URL_USER_BLOCK_CHECK}?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('❌ Error parsing JSON response:', parseError);
        // Return default values if server returns HTML or invalid JSON
        return { is_blocked: false, block_info: null };
      }

      if (!response.ok) {
        console.warn(`⚠️ Block check failed with status ${response.status}`);
        return { is_blocked: false, block_info: null };
      }

      console.log(`✅ Estado de bloqueo verificado: ${data.is_blocked ? 'Bloqueado' : 'No bloqueado'}`);
      return data;
    } catch (error) {
      console.error('❌ Error verificando estado de bloqueo:', error);
      throw error;
    }
  }

  /**
   * Verificar bloqueo bidireccional (si A bloqueó a B o B bloqueó a A)
   * @param {string} token - Token de autenticación
   * @param {number} userId1 - ID del primer usuario
   * @param {number} userId2 - ID del segundo usuario
   * @returns {Promise<Object>} Estado de bloqueo bidireccional
   */
  async checkMutualBlock(token, userId1, userId2) {
    try {
      console.log(`🔍 Verificando bloqueo mutuo entre ${userId1} y ${userId2}`);
      
      const [block1, block2] = await Promise.all([
        this.checkIfBlocked(token, userId1, userId2),
        this.checkIfBlocked(token, userId2, userId1),
      ]);

      const result = {
        isBlocked: block1.is_blocked || block2.is_blocked,
        user1BlockedUser2: block1.is_blocked,
        user2BlockedUser1: block2.is_blocked,
        blockInfo: block1.is_blocked ? block1.block_info : (block2.is_blocked ? block2.block_info : null),
      };

      console.log(`✅ Bloqueo mutuo verificado:`, result);
      return result;
    } catch (error) {
      console.error('❌ Error verificando bloqueo mutuo:', error);
      throw error;
    }
  }
}

export default new UserBlockService();
