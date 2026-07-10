import { useState, useCallback } from 'react'

export const useToast = () => {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'info', duration = 3000, onPress = null) => {
    const id = Date.now() + Math.random()
    const newToast = {
      id,
      message,
      type,
      duration,
      onPress,
      visible: true,
    }

    setToasts(prev => [...prev, newToast])

    // Auto-remove después del duration
    setTimeout(() => {
      hideToast(id)
    }, duration + 500) // Un poco más de tiempo para la animación

    return id
  }, [])

  const hideToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const hideAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  // Funciones de conveniencia
  const showSuccess = useCallback((message, duration, onPress) => {
    return showToast(message, 'success', duration, onPress)
  }, [showToast])

  const showError = useCallback((message, duration, onPress) => {
    return showToast(message, 'error', duration, onPress)
  }, [showToast])

  const showWarning = useCallback((message, duration, onPress) => {
    return showToast(message, 'warning', duration, onPress)
  }, [showToast])

  const showNewEvent = useCallback((message, duration, onPress) => {
    return showToast(message, 'new-event', duration, onPress)
  }, [showToast])

  const showLike = useCallback((message, duration, onPress) => {
    return showToast(message, 'like', duration, onPress)
  }, [showToast])

  const showMessage = useCallback((message, duration, onPress) => {
    return showToast(message, 'message', duration, onPress)
  }, [showToast])

  const showNotification = useCallback((message, duration, onPress) => {
    return showToast(message, 'notification', duration, onPress)
  }, [showToast])

  return {
    toasts,
    showToast,
    hideToast,
    hideAllToasts,
    showSuccess,
    showError,
    showWarning,
    showNewEvent,
    showLike,
    showMessage,
    showNotification,
  }
}

export default useToast