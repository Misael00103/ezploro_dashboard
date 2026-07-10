
import React, { createContext, useContext, useState, useCallback, useEffect } from "react"
import {
  API_URL_GAMIFICATION_ACTION,
  API_URL_GAMIFICATION_POINTS,
  API_URL_GAMIFICATION_REDEEM,
  API_URL_GAMIFICATION_HISTORY,
} from "../config"
import { useAuth } from "./AuthContext"

const GamificationContext = createContext()

const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
  const cleanUrl = url.trim()
  console.log(`🔄 Gamification fetch: ${cleanUrl}`)

  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      const response = await fetch(cleanUrl, {
        ...options,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      console.log(`✅ Gamification response: ${cleanUrl} - ${response.status}`)
      return response
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error(`Timeout al conectar con ${cleanUrl}`)
      }
      console.warn(`❌ Gamification attempt ${i + 1} failed for ${cleanUrl}:`, error.message)
      if (i === retries - 1) throw error
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
  return null
}

export const GamificationProvider = ({ children }) => {
  const [points, setPoints] = useState(0)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { user, token } = useAuth()

  const handleApiCall = async (apiCallFn) => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiCallFn()
      return result
    } catch (err) {
      let errorMessage = "Ocurrió un error desconocido"
      if (err instanceof Response) {
        try {
          const errorData = await err.json()
          errorMessage = errorData.message || `Error HTTP! estado: ${err.status}`
        } catch (parseError) {
          errorMessage = `El servidor respondió con el estado ${err.status} pero no con JSON válido`
        }
      } else if (err instanceof Error) {
        errorMessage = err.message
      }
      setError(errorMessage)
      console.error("❌ Gamification API Error:", errorMessage, err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  })

  const recordAction = useCallback(
    async (actionType, eventId = null) => {
      console.log("🎮 Registrando acción de gamificación:", actionType)
      return handleApiCall(async () => {
        const response = await fetchWithRetry(API_URL_GAMIFICATION_ACTION, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            user_id: user.user_id,
            action_name: actionType,
            ...(eventId && { event_id: eventId }),
          }),
        })
        if (!response.ok) throw response
        const data = await response.json()
        setPoints((prev) => prev + (data.points || 0))
        console.log("✅ Acción registrada, puntos ganados:", data.points || 0)
        return data
      })
    },
    [user, token],
  )

  const getPoints = useCallback(async () => {
    if (!user?.user_id) return 0
    console.log("🏆 Obteniendo puntos del usuario...")
    return handleApiCall(async () => {
      const response = await fetchWithRetry(API_URL_GAMIFICATION_POINTS.replace(":user_id", user.user_id), {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw response
      const data = await response.json()
      const userPoints = data.points || 0
      setPoints(userPoints)
      console.log("✅ Puntos obtenidos:", userPoints)
      return userPoints
    })
  }, [user, token])

  const redeemPoints = useCallback(
    async (rewardName, pointsToRedeem) => {
      console.log("🎁 Canjeando puntos por recompensa:", rewardName)
      return handleApiCall(async () => {
        const response = await fetchWithRetry(API_URL_GAMIFICATION_REDEEM, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            user_id: user.user_id,
            reward_name: rewardName,
            points_redeemed: pointsToRedeem,
          }),
        })
        if (!response.ok) throw response
        const data = await response.json()
        setPoints(data.remaining_points || 0)
        console.log("✅ Puntos canjeados exitosamente, puntos restantes:", data.remaining_points || 0)
        return data
      })
    },
    [user, token],
  )

  const getHistory = useCallback(async () => {
    if (!user?.user_id) return []
    console.log("📜 Obteniendo historial de gamificación...")
    return handleApiCall(async () => {
      const response = await fetchWithRetry(API_URL_GAMIFICATION_HISTORY.replace(":user_id", user.user_id), {
        headers: getAuthHeaders(),
      })
      if (!response.ok) throw response
      const data = await response.json()
      const historyData = Array.isArray(data) ? data : []
      setHistory(historyData)
      console.log("✅ Historial obtenido:", historyData.length, "entradas")
      return historyData
    })
  }, [user, token])

  useEffect(() => {
    if (user && token) {
      console.log("👤 Usuario detectado, cargando datos de gamificación...")
      getPoints()
    }
  }, [user, token, getPoints])

  const value = { points, history, loading, error, recordAction, getPoints, redeemPoints, getHistory }

  return <GamificationContext.Provider value={value}>{children}</GamificationContext.Provider>
}

export const useGamification = () => {
  const context = useContext(GamificationContext)
  if (!context) throw new Error("useGamification must be used within a GamificationProvider")
  return context
}
