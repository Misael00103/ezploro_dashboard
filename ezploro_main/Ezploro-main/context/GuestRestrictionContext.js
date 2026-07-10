import React, { createContext, useCallback, useContext, useMemo, useState } from "react"
import GuestRestrictionModal from "../components/modals/GuestRestrictionModal"

const GuestRestrictionModalContext = createContext(null)

const SAFE_DELAY = 220

export const GuestRestrictionProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    visible: false,
    title: "",
    message: "",
    primaryLabel: "Crear cuenta",
    secondaryLabel: null,
    onPrimaryPress: null,
    onSecondaryPress: null,
  })

  const hideModal = useCallback(() => {
    setModalState((prev) => ({
      ...prev,
      visible: false,
    }))
  }, [])

  const runAndHide = useCallback(
    (callback) => {
      hideModal()
      if (typeof callback === "function") {
        setTimeout(() => {
          try {
            callback()
          } catch (error) {
            console.warn("GuestRestrictionModal action error:", error)
          }
        }, SAFE_DELAY)
      }
    },
    [hideModal]
  )

  const showModal = useCallback((config) => {
    setModalState({
      visible: true,
      title: config.title,
      message: config.message,
      primaryLabel: config.primaryLabel ?? "Crear cuenta",
      secondaryLabel: config.secondaryLabel ?? null,
      onPrimaryPress: config.onPrimaryPress ?? null,
      onSecondaryPress: config.onSecondaryPress ?? null,
    })
  }, [])

  const showGuestRestriction = useCallback(
    ({ action, navigation, onPrimaryPress, onCancel } = {}) => {
      const normalizedAction = action || "realizar esta acción"

      const handlePrimary = () => {
        if (typeof onPrimaryPress === "function") {
          onPrimaryPress()
          return
        }
        if (navigation?.navigate) {
          navigation.navigate("SignUp")
        }
      }

      showModal({
        title: "Cuenta requerida",
        message: `Para ${normalizedAction} necesitas crear una cuenta. Los usuarios invitados solo pueden explorar eventos.`,
        primaryLabel: "Crear cuenta",
        secondaryLabel: "Cancelar",
        onPrimaryPress: handlePrimary,
        onSecondaryPress: onCancel || null,
      })
    },
    [showModal]
  )

  const showGuestLimitation = useCallback(
    ({ feature, navigation, onPrimaryPress } = {}) => {
      const normalizedFeature = feature || "acceder a esta función"

      const handlePrimary = () => {
        if (typeof onPrimaryPress === "function") {
          onPrimaryPress()
          return
        }
        if (navigation?.navigate) {
          navigation.navigate("SignUp")
        }
      }

      showModal({
        title: "Funcionalidad limitada",
        message: `Los usuarios invitados no pueden ${normalizedFeature}. Crea una cuenta gratuita para desbloquear todas las funciones.`,
        primaryLabel: "Crear cuenta",
        secondaryLabel: "Seguir explorando",
        onPrimaryPress: handlePrimary,
        onSecondaryPress: null,
      })
    },
    [showModal]
  )

  const contextValue = useMemo(
    () => ({
      showGuestRestriction,
      showGuestLimitation,
      hideGuestRestriction: hideModal,
    }),
    [hideModal, showGuestLimitation, showGuestRestriction]
  )

  const handlePrimaryPress = useCallback(() => {
    runAndHide(modalState.onPrimaryPress)
  }, [modalState.onPrimaryPress, runAndHide])

  const handleSecondaryPress = useCallback(() => {
    if (modalState.secondaryLabel) {
      runAndHide(modalState.onSecondaryPress)
    } else {
      hideModal()
    }
  }, [hideModal, modalState.onSecondaryPress, modalState.secondaryLabel, runAndHide])

  return (
    <GuestRestrictionModalContext.Provider value={contextValue}>
      {children}
      <GuestRestrictionModal
        visible={modalState.visible}
        title={modalState.title}
        message={modalState.message}
        primaryLabel={modalState.primaryLabel}
        secondaryLabel={modalState.secondaryLabel}
        onPrimaryPress={handlePrimaryPress}
        onSecondaryPress={modalState.secondaryLabel ? handleSecondaryPress : hideModal}
        onRequestClose={hideModal}
      />
    </GuestRestrictionModalContext.Provider>
  )
}

export const useGuestRestrictionModal = () => {
  const context = useContext(GuestRestrictionModalContext)
  if (!context) {
    throw new Error("useGuestRestrictionModal debe usarse dentro de un GuestRestrictionProvider")
  }
  return context
}

