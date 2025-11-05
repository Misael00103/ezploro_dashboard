import { fetchWithAuth } from './userService';
import { getAuthToken } from './authService';
import { BASE_URL } from './config';

// Base URL para reglas de puntos
const API_URL_RULES = `${BASE_URL}/rules`;

/**
 * Obtener todas las reglas
 */
export const getAllRules = async () => {
  try {
    const data = await fetchWithAuth(API_URL_RULES, {
      method: 'GET',
    });
    
    // El backend devuelve un array directamente según el código proporcionado
    if (Array.isArray(data)) {
      return data;
    }
    // Si viene envuelto en un objeto
    if (data.data && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error('Error en getAllRules:', error);
    throw error;
  }
};

/**
 * Obtener una regla por ID
 */
export const getRuleById = async (ruleId) => {
  try {
    const data = await fetchWithAuth(`${API_URL_RULES}/${ruleId}`, {
      method: 'GET',
    });
    
    return data;
  } catch (error) {
    console.error('Error en getRuleById:', error);
    throw error;
  }
};

/**
 * Crear una nueva regla
 */
export const createRule = async (ruleData) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    // Validar datos antes de enviar
    if (!ruleData.rule_name || !ruleData.point_type || ruleData.points === undefined) {
      throw new Error('rule_name, point_type y points son requeridos');
    }

    if (!['Profile', 'Events', 'Engagement'].includes(ruleData.point_type)) {
      throw new Error('point_type debe ser Profile, Events o Engagement');
    }

    const points = parseInt(ruleData.points);
    if (isNaN(points) || points < 1 || points > 5) {
      throw new Error('points debe estar entre 1 y 5');
    }

    // Construir payload exactamente como lo espera el backend
    const payload = {
      rule_name: ruleData.rule_name.trim(),
      point_type: ruleData.point_type,
      points: points,
      is_active: ruleData.is_active !== undefined ? ruleData.is_active : true
    };

    // Solo agregar description si tiene contenido, de lo contrario omitir el campo
    // El backend manejará null automáticamente si no se envía
    if (ruleData.description && ruleData.description.trim()) {
      payload.description = ruleData.description.trim();
    }

    console.log('🔵 Creating rule - URL:', API_URL_RULES);
    console.log('🔵 Creating rule - Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(API_URL_RULES, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    console.log('🔵 Response status:', response.status);
    console.log('🔵 Response ok:', response.ok);

    // Leer el body de la respuesta
    let responseData;
    try {
      const text = await response.text();
      console.log('🔵 Response text:', text);
      responseData = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.error('🔴 Error parsing response:', parseError);
      responseData = {};
    }

    if (!response.ok) {
      console.error('🔴 Error response data:', responseData);
      // El backend devuelve { error: 'mensaje' } o { message: 'mensaje' }
      const errorMessage = responseData.error || responseData.message || `Error HTTP! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    console.log('🟢 Success response data:', responseData);
    
    // El backend devuelve { message: 'Regla creada', rule: {...} }
    if (responseData.rule) {
      return responseData.rule;
    }
    return responseData;
  } catch (error) {
    console.error('🔴 Error en createRule:', error);
    throw error;
  }
};

/**
 * Actualizar una regla
 */
export const updateRule = async (ruleId, ruleData) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const payload = {};
    
    // Solo incluir campos que se están actualizando
    if (ruleData.rule_name !== undefined) {
      payload.rule_name = ruleData.rule_name.trim();
    }
    if (ruleData.point_type !== undefined) {
      if (!['Profile', 'Events', 'Engagement'].includes(ruleData.point_type)) {
        throw new Error('point_type debe ser Profile, Events o Engagement');
      }
      payload.point_type = ruleData.point_type;
    }
    if (ruleData.points !== undefined) {
      const points = parseInt(ruleData.points);
      if (isNaN(points) || points < 1 || points > 5) {
        throw new Error('points debe estar entre 1 y 5');
      }
      payload.points = points;
    }
    if (ruleData.description !== undefined) {
      payload.description = ruleData.description.trim();
    }
    if (ruleData.is_active !== undefined) {
      payload.is_active = ruleData.is_active;
    }

    const response = await fetch(`${API_URL_RULES}/${ruleId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `Error HTTP! status: ${response.status}`);
    }

    const data = await response.json();
    
    // El backend devuelve { message: 'Regla actualizada', rule: {...} }
    if (data.rule) {
      return data.rule;
    }
    return data;
  } catch (error) {
    console.error('Error en updateRule:', error);
    throw error;
  }
};

/**
 * Eliminar una regla
 */
export const deleteRule = async (ruleId) => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const response = await fetch(`${API_URL_RULES}/${ruleId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `Error HTTP! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en deleteRule:', error);
    throw error;
  }
};

