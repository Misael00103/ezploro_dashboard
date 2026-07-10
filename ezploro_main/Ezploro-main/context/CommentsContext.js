
import React, { createContext, useContext, useState, useCallback } from "react"
import { API_URL_COMMENTS_EVENT, API_URL_COMMENTS_UPDATE, API_URL_COMMENTS_DELETE } from "../config"
import { useAuth } from "./AuthContext"

const CommentsContext = createContext()

const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
  const cleanUrl = url.trim()
  console.log(`🔄 Comments fetch: ${cleanUrl}`)

  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      const response = await fetch(cleanUrl, {
        ...options,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      console.log(`✅ Comments response: ${cleanUrl} - ${response.status}`)
      return response
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error(`Timeout al conectar con ${cleanUrl}`)
      }
      console.warn(`❌ Comments attempt ${i + 1} failed for ${cleanUrl}:`, error.message)
      if (i === retries - 1) throw error
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
  return null
}

export const CommentsProvider = ({ children }) => {
  const [comments, setComments] = useState([])
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
      console.error("❌ Comments API Error:", errorMessage, err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  })

  const fetchEventComments = useCallback(
    async (eventId) => {
      console.log("📝 Obteniendo comentarios para evento:", eventId)
      return handleApiCall(async () => {
        const response = await fetchWithRetry(API_URL_COMMENTS_EVENT.replace(":event_id", eventId), {
          headers: getAuthHeaders(),
        })
        if (!response.ok) throw response
        const data = await response.json()
        setComments(Array.isArray(data) ? data : [])
        console.log("✅ Comentarios obtenidos:", data?.length || 0)
        return data
      })
    },
    [token],
  )

  const updateComment = useCallback(
    async (commentId, content) => {
      console.log("✏️ Actualizando comentario:", commentId)
      return handleApiCall(async () => {
        const response = await fetchWithRetry(API_URL_COMMENTS_UPDATE.replace(":id", commentId), {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({ content }),
        })
        if (!response.ok) throw response
        const updated = await response.json()
        setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)))
        console.log("✅ Comentario actualizado exitosamente")
        return updated
      })
    },
    [token],
  )

  const createComment = useCallback(
    async (eventId, content, images = []) => {
      console.log("📝 Creando comentario para evento:", eventId)
      return handleApiCall(async () => {
        const formData = new FormData()
        formData.append('text', content.trim())
        
        // Agregar imágenes si las hay
        images.forEach((image, index) => {
          formData.append('images', {
            uri: image.uri,
            type: image.type || 'image/jpeg',
            name: image.name || `comment_image_${index}_${Date.now()}.jpg`,
          })
        })
        
        const response = await fetchWithRetry(API_URL_COMMENTS_EVENT.replace(":event_id", eventId), {
          method: "POST",
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
            // No establecer Content-Type para FormData
          },
          body: formData,
        })
        
        if (!response.ok) throw response
        const newComment = await response.json()
        setComments((prev) => [...prev, newComment])
        console.log("✅ Comentario creado exitosamente")
        return newComment
      })
    },
    [token],
  )

  const deleteComment = useCallback(
    async (commentId) => {
      console.log("🗑️ Eliminando comentario:", commentId)
      return handleApiCall(async () => {
        const response = await fetchWithRetry(API_URL_COMMENTS_DELETE.replace(":id", commentId), {
          method: "DELETE",
          headers: getAuthHeaders(),
        })
        if (!response.ok) throw response
        setComments((prev) => prev.filter((c) => c.id !== commentId))
        console.log("✅ Comentario eliminado exitosamente")
        return response.json()
      })
    },
    [token],
  )

  const value = { comments, loading, error, fetchEventComments, createComment, updateComment, deleteComment }

  return <CommentsContext.Provider value={value}>{children}</CommentsContext.Provider>
}

export const useComments = () => {
  const context = useContext(CommentsContext)
  if (!context) throw new Error("useComments must be used within a CommentsProvider")
  return context
}
