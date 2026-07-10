import React, { createContext, useContext, useState, useCallback } from "react"
import { utilityService } from "../services"
import { useAuth } from "./AuthContext"

const ToolsContext = createContext()

export const ToolsProvider = ({ children }) => {
  const [tools, setTools] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [systemInfo, setSystemInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchTools = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      console.log("🛠️ Obteniendo herramientas y estadísticas del sistema...")
      
      const data = await utilityService.getTools()
      
      const toolsData = data.data || data
      setTools(Array.isArray(toolsData) ? toolsData : [])
      
      if (data.data?.statistics) {
        setStatistics(data.data.statistics)
        console.log("📊 Estadísticas obtenidas:", data.data.statistics)
      }
      
      if (data.data?.systemInfo) {
        setSystemInfo(data.data.systemInfo)
        console.log("💻 Información del sistema obtenida:", data.data.systemInfo)
      }
      
      console.log("✅ Herramientas obtenidas exitosamente")
      return data
    } catch (err) {
      const errorMessage = err.message || "Error al obtener herramientas"
      setError(errorMessage)
      console.error("❌ Tools API Error:", errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const value = {
    tools,
    statistics,
    systemInfo,
    loading,
    error,
    fetchTools,
  }

  return <ToolsContext.Provider value={value}>{children}</ToolsContext.Provider>
}

export const useTools = () => {
  const context = useContext(ToolsContext)
  if (!context) throw new Error("useTools must be used within a ToolsProvider")
  return context
}
