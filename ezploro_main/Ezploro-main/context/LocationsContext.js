import React, { createContext, useContext, useState, useCallback } from "react"
import { API_URL_LOCATIONS } from "../config"
import { useAuth } from "./AuthContext"

const LocationsContext = createContext()

const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
  const cleanUrl = url.trim()
  console.log(`🔄 Locations fetch: ${cleanUrl}`)

  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      const response = await fetch(cleanUrl, {
        ...options,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      console.log(`✅ Locations response: ${cleanUrl} - ${response.status}`)
      return response
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error(`Timeout al conectar con ${cleanUrl}`)
      }
      console.warn(`❌ Locations attempt ${i + 1} failed for ${cleanUrl}:`, error.message)
      if (i === retries - 1) throw error
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
  return null
}

export const LocationsProvider = ({ children }) => {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { token } = useAuth()

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
      console.error("❌ Locations API Error:", errorMessage, err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  })

  const fetchLocations = useCallback(async () => {
    console.log("📍 Obteniendo ubicaciones...")
    return handleApiCall(async () => {
      const response = await fetchWithRetry(API_URL_LOCATIONS, { headers: getAuthHeaders() })
      if (!response.ok) throw response
      const data = await response.json()
      const locationsData = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []
      setLocations(locationsData)
      console.log("✅ Ubicaciones obtenidas:", locationsData.length)
      return locationsData
    })
  }, [token])

  const value = { locations, loading, error, fetchLocations }

  return <LocationsContext.Provider value={value}>{children}</LocationsContext.Provider>
}

export const useLocations = () => {
  const context = useContext(LocationsContext)
  if (!context) throw new Error("useLocations must be used within a LocationsProvider")
  return context
}
