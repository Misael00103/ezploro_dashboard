import { useCallback, useMemo } from "react"
import { useAuth } from "../context/AuthContext"
import { useGuestRestrictionModal } from "../context/GuestRestrictionContext"

const isGuestUserFn = (user, isGuest) => {
  if (isGuest) return true
  if (!user) return false
  if (user.role === "guest" || user.is_guest) return true

  const userId = user.user_id ?? user.id
  return typeof userId === "string" && userId.startsWith("guest_")
}

export const useGuestRestrictions = () => {
  const { user, isGuest } = useAuth()
  const { showGuestRestriction, showGuestLimitation } = useGuestRestrictionModal()

  const isGuestUser = useMemo(() => isGuestUserFn(user, isGuest), [user, isGuest])

  const checkGuestRestriction = useCallback(
    (action, navigation) => {
      const guest = isGuestUserFn(user, isGuest)
      console.log("[GuestRestrictions] Checking restriction", {
        action,
        isGuest: guest,
        role: user?.role,
        userId: user?.user_id,
      })

      if (guest) {
        console.log(`[GuestRestrictions] Acción bloqueada para guest: ${action}`)
        showGuestRestriction({ action, navigation })
        return true
      }

      console.log("[GuestRestrictions] Acción permitida para usuario autenticado")
      return false
    },
    [isGuest, showGuestRestriction, user]
  )

  const showGuestLimitationAlert = useCallback(
    (feature, navigation) => {
      console.log(`[GuestRestrictions] Mostrando limitación guest: ${feature}`)
      showGuestLimitation({ feature, navigation })
    },
    [showGuestLimitation]
  )

  const restrictedActions = useMemo(
    () => ({
      // Eventos
      subscribeToEvent: (navigation) => {
        try {
          return checkGuestRestriction("suscribirte a eventos", navigation)
        } catch (error) {
          console.warn("[GuestRestrictions] Error en subscribeToEvent:", error)
          return isGuestUserFn(user, isGuest)
        }
      },
      createEvent: (navigation) => {
        try {
          return checkGuestRestriction("crear eventos", navigation)
        } catch (error) {
          console.warn("[GuestRestrictions] Error en createEvent:", error)
          return isGuestUserFn(user, isGuest)
        }
      },
      likeEvent: (navigation) => {
        try {
          return checkGuestRestriction("dar like a eventos", navigation)
        } catch (error) {
          console.warn("[GuestRestrictions] Error en likeEvent:", error)
          return isGuestUserFn(user, isGuest)
        }
      },
      commentOnEvent: (navigation) => {
        try {
          return checkGuestRestriction("comentar en eventos", navigation)
        } catch (error) {
          console.warn("[GuestRestrictions] Error en commentOnEvent:", error)
          return isGuestUserFn(user, isGuest)
        }
      },

      // Social
      followUser: (navigation) => {
        try {
          return checkGuestRestriction("seguir usuarios", navigation)
        } catch (error) {
          console.warn("[GuestRestrictions] Error en followUser:", error)
          return isGuestUserFn(user, isGuest)
        }
      },
      sendMessage: (navigation) => {
        try {
          return checkGuestRestriction("enviar mensajes", navigation)
        } catch (error) {
          console.warn("[GuestRestrictions] Error en sendMessage:", error)
          return isGuestUserFn(user, isGuest)
        }
      },
      addFriend: (navigation) => {
        try {
          return checkGuestRestriction("agregar amigos", navigation)
        } catch (error) {
          console.warn("[GuestRestrictions] Error en addFriend:", error)
          return isGuestUserFn(user, isGuest)
        }
      },

      // Grupos y chats
      joinGroup: (navigation) => {
        try {
          return checkGuestRestriction("unirte a grupos", navigation)
        } catch (error) {
          console.warn("[GuestRestrictions] Error en joinGroup:", error)
          return isGuestUserFn(user, isGuest)
        }
      },
      createGroup: (navigation) => {
        try {
          return checkGuestRestriction("crear grupos", navigation)
        } catch (error) {
          console.warn("[GuestRestrictions] Error en createGroup:", error)
          return isGuestUserFn(user, isGuest)
        }
      },
      sendGroupMessage: (navigation) => {
        try {
          return checkGuestRestriction("enviar mensajes en grupos", navigation)
        } catch (error) {
          console.warn("[GuestRestrictions] Error en sendGroupMessage:", error)
          return isGuestUserFn(user, isGuest)
        }
      },

      // Perfil
      updateProfile: (navigation) => {
        try {
          return checkGuestRestriction("actualizar tu perfil", navigation)
        } catch (error) {
          console.warn("[GuestRestrictions] Error en updateProfile:", error)
          return isGuestUserFn(user, isGuest)
        }
      },
      uploadImage: (navigation) => {
        try {
          return checkGuestRestriction("subir imágenes", navigation)
        } catch (error) {
          console.warn("[GuestRestrictions] Error en uploadImage:", error)
          return isGuestUserFn(user, isGuest)
        }
      },

      // Bookmarks
      bookmarkEvent: (navigation) => {
        try {
          return checkGuestRestriction("guardar eventos en favoritos", navigation)
        } catch (error) {
          console.warn("[GuestRestrictions] Error en bookmarkEvent:", error)
          return isGuestUserFn(user, isGuest)
        }
      },

      // Notificaciones
      enableNotifications: (navigation) => {
        try {
          return checkGuestRestriction("habilitar notificaciones", navigation)
        } catch (error) {
          console.warn("[GuestRestrictions] Error en enableNotifications:", error)
          return isGuestUserFn(user, isGuest)
        }
      },
    }),
    [checkGuestRestriction, isGuest, user]
  )

  return {
    isGuestUser,
    checkGuestRestriction,
    showGuestLimitationAlert,
    restrictedActions,
  }
}

export default useGuestRestrictions

