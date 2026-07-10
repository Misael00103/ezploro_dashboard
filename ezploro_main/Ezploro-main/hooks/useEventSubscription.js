import { useState, useEffect, useCallback, useRef } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuth } from '../context/AuthContext'
import { BASE_URL } from '../config'

/**
 * Hook para manejar suscripciones de eventos con caché
 * Evita verificaciones repetitivas de suscripción
 */
export const useEventSubscription = (eventId) => {
  const { user, token } = useAuth()
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Caché de suscripciones para evitar llamadas repetitivas
  const subscriptionCache = useRef(new Map())
  const lastCheckTime = useRef(new Map())
  
  // Tiempo de caché en milisegundos (30 minutos para persistir más tiempo)
  const CACHE_DURATION = 30 * 60 * 1000
  
  // Claves para AsyncStorage
  const CACHE_KEY_PREFIX = 'event_subscription_'
  const TIME_KEY_PREFIX = 'event_subscription_time_'

  const getCacheKey = useCallback((eventId, userId) => {
    return `${eventId}-${userId}`
  }, [])

  // Funciones para caché persistente
  const saveCacheToStorage = useCallback(async (cacheKey, subscribed, timestamp) => {
    try {
      await AsyncStorage.setItem(`${CACHE_KEY_PREFIX}${cacheKey}`, JSON.stringify(subscribed))
      await AsyncStorage.setItem(`${TIME_KEY_PREFIX}${cacheKey}`, timestamp.toString())
    } catch (error) {
      console.warn('Error saving subscription cache:', error)
    }
  }, [])

  const loadCacheFromStorage = useCallback(async (cacheKey) => {
    try {
      const [cachedValue, cachedTime] = await Promise.all([
        AsyncStorage.getItem(`${CACHE_KEY_PREFIX}${cacheKey}`),
        AsyncStorage.getItem(`${TIME_KEY_PREFIX}${cacheKey}`)
      ])
      
      if (cachedValue !== null && cachedTime !== null) {
        const timestamp = parseInt(cachedTime)
        const now = Date.now()
        
        if ((now - timestamp) < CACHE_DURATION) {
          const subscribed = JSON.parse(cachedValue)
          // Cargar en memoria también
          subscriptionCache.current.set(cacheKey, subscribed)
          lastCheckTime.current.set(cacheKey, timestamp)
          return subscribed
        } else {
          // Caché expirado, limpiar
          await clearCacheFromStorage(cacheKey)
        }
      }
      return null
    } catch (error) {
      console.warn('Error loading subscription cache:', error)
      return null
    }
  }, [])

  const clearCacheFromStorage = useCallback(async (cacheKey) => {
    try {
      await AsyncStorage.multiRemove([
        `${CACHE_KEY_PREFIX}${cacheKey}`,
        `${TIME_KEY_PREFIX}${cacheKey}`
      ])
    } catch (error) {
      console.warn('Error clearing subscription cache:', error)
    }
  }, [])

  const isValidCache = useCallback(async (eventId, userId) => {
    const cacheKey = getCacheKey(eventId, userId)
    
    // Verificar caché en memoria primero
    const lastCheck = lastCheckTime.current.get(cacheKey)
    if (lastCheck) {
      const now = Date.now()
      if ((now - lastCheck) < CACHE_DURATION) {
        return true
      }
    }
    
    // Si no hay caché en memoria, verificar AsyncStorage
    const cachedValue = await loadCacheFromStorage(cacheKey)
    return cachedValue !== null
  }, [getCacheKey, CACHE_DURATION, loadCacheFromStorage])

  const checkSubscription = useCallback(async (eventId, userId, forceRefresh = false) => {
    if (!eventId || !userId || !token) {
      return false
    }

    const cacheKey = getCacheKey(eventId, userId)
    
    // Verificar caché si no es refresh forzado
    if (!forceRefresh && await isValidCache(eventId, userId)) {
      // Intentar obtener de memoria primero
      let cachedResult = subscriptionCache.current.get(cacheKey)
      
      // Si no está en memoria, cargar de AsyncStorage
      if (cachedResult === undefined) {
        cachedResult = await loadCacheFromStorage(cacheKey)
      }
      
      if (cachedResult !== undefined && cachedResult !== null) {
        console.log(`📋 Using cached subscription status for event ${eventId}: ${cachedResult}`)
        setIsSubscribed(cachedResult)
        return cachedResult
      }
    }

    try {
      setIsLoading(true)
      setError(null)
      
      console.log(`🔍 Checking subscription for event ${eventId}, user ${userId}`)
      
      // Intentar unirse al chat para verificar si está suscrito
      const url = `${BASE_URL}/event-messages/events/${eventId}/join-chat`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        // Si puede unirse al chat, está suscrito
        const subscribed = true
        
        // Guardar en caché (memoria y persistente)
        const timestamp = Date.now()
        subscriptionCache.current.set(cacheKey, subscribed)
        lastCheckTime.current.set(cacheKey, timestamp)
        await saveCacheToStorage(cacheKey, subscribed, timestamp)
        
        console.log(`✅ Subscription status for event ${eventId}: ${subscribed}`)
        setIsSubscribed(subscribed)
        return subscribed
      } else if (response.status === 403 || response.status === 401) {
        // No tiene permisos, no está suscrito
        const timestamp = Date.now()
        subscriptionCache.current.set(cacheKey, false)
        lastCheckTime.current.set(cacheKey, timestamp)
        await saveCacheToStorage(cacheKey, false, timestamp)
        setIsSubscribed(false)
        return false
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (err) {
      console.error(`❌ Error checking subscription for event ${eventId}:`, err)
      setError(err.message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [token, getCacheKey, isValidCache])

  const subscribeToEvent = useCallback(async (eventId, userId) => {
    if (!eventId || !userId || !token) {
      return false
    }

    try {
      setIsLoading(true)
      setError(null)
      
      console.log(`📝 Subscribing to event ${eventId}`)
      
      // Usar join-chat como método de suscripción
      const url = `${BASE_URL}/event-messages/events/${eventId}/join-chat`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        // Si se une exitosamente al chat, está suscrito
        const subscribed = true
        
        // Actualizar caché (memoria y persistente)
        const cacheKey = getCacheKey(eventId, userId)
        const timestamp = Date.now()
        subscriptionCache.current.set(cacheKey, subscribed)
        lastCheckTime.current.set(cacheKey, timestamp)
        await saveCacheToStorage(cacheKey, subscribed, timestamp)
        
        setIsSubscribed(subscribed)
        console.log(`✅ Successfully joined event chat ${eventId}: ${subscribed}`)
        return subscribed
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (err) {
      console.error(`❌ Error toggling subscription for event ${eventId}:`, err)
      setError(err.message)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [token, getCacheKey])

  const clearCache = useCallback(async (eventId, userId) => {
    const cacheKey = getCacheKey(eventId, userId)
    subscriptionCache.current.delete(cacheKey)
    lastCheckTime.current.delete(cacheKey)
    await clearCacheFromStorage(cacheKey)
    console.log(`🗑️ Cleared subscription cache for event ${eventId}`)
  }, [getCacheKey, clearCacheFromStorage])

  // Verificar suscripción al montar el componente
  useEffect(() => {
    if (eventId && user?.user_id) {
      checkSubscription(eventId, user.user_id).then(subscribed => {
        setIsSubscribed(subscribed)
      })
    }
  }, [eventId, user?.user_id, checkSubscription])

  return {
    isSubscribed,
    isLoading,
    error,
    checkSubscription,
    subscribeToEvent,
    clearCache,
    // Función para forzar refresh
    refreshSubscription: () => checkSubscription(eventId, user?.user_id, true)
  }
}

export default useEventSubscription