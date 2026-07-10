
import React, { createContext, useContext, useState, useEffect, useMemo } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

// Definición de colores para temas claro y oscuro
const lightTheme = {
  primary: '#3498db',
  secondary: '#2ecc71',
  background: '#f5f5f5',
  card: '#ffffff',
  text: '#333333',
  border: '#dddddd',
  notification: '#e74c3c',
  error: '#e74c3c',
  errorLight: 'rgba(231, 76, 60, 0.1)',
  success: '#2ecc71',
  successLight: 'rgba(46, 204, 113, 0.1)',
  warning: '#f39c12',
  warningLight: 'rgba(243, 156, 18, 0.1)',
  info: '#3498db',
  infoLight: 'rgba(52, 152, 219, 0.1)',
}

const darkTheme = {
  primary: '#2980b9',
  secondary: '#27ae60',
  background: '#121212',
  card: '#1e1e1e',
  text: '#f5f5f5',
  border: '#333333',
  notification: '#c0392b',
  error: '#e74c3c',
  errorLight: 'rgba(231, 76, 60, 0.2)',
  success: '#2ecc71',
  successLight: 'rgba(46, 204, 113, 0.2)',
  warning: '#f39c12',
  warningLight: 'rgba(243, 156, 18, 0.2)',
  info: '#3498db',
  infoLight: 'rgba(52, 152, 219, 0.2)',
}

const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false)
  const [loading, setLoading] = useState(true)

  // Crear objeto de tema basado en el modo actual
  const theme = useMemo(() => {
    return {
      dark: darkMode,
      colors: darkMode ? darkTheme : lightTheme
    }
  }, [darkMode])

  // Cargar preferencia de tema al inicializar
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        console.log("🎨 Cargando preferencia de tema...")
        const savedTheme = await AsyncStorage.getItem("darkMode")
        if (savedTheme !== null) {
          const isDarkMode = JSON.parse(savedTheme)
          setDarkMode(isDarkMode)
          console.log("✅ Tema cargado:", isDarkMode ? "oscuro" : "claro")
        }
      } catch (error) {
        console.error("❌ Error cargando preferencia de tema:", error)
      } finally {
        setLoading(false)
      }
    }

    loadThemePreference()
  }, [])

  // Guardar preferencia de tema cuando cambie
  const toggleDarkMode = async (newValue) => {
    try {
      const valueToSet = newValue !== undefined ? newValue : !darkMode
      console.log("🎨 Cambiando tema a:", valueToSet ? "oscuro" : "claro")
      setDarkMode(valueToSet)
      await AsyncStorage.setItem("darkMode", JSON.stringify(valueToSet))
      console.log("✅ Preferencia de tema guardada")
    } catch (error) {
      console.error("❌ Error guardando preferencia de tema:", error)
    }
  }

  const value = {
    darkMode,
    setDarkMode: toggleDarkMode,
    loading,
    theme, // Proporcionar el objeto theme completo
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
