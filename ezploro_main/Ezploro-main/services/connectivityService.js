// services/connectivityService.js - Servicio para verificar conectividad
import AsyncStorage from "@react-native-async-storage/async-storage"
import { BASE_URL, SOCKET_URL } from "../config"

class ConnectivityService {
  constructor() {
    this.isOnline = true
    this.lastCheck = 0
    this.checkInterval = 30000 // 30 segundos
  }

  // Verificar conectividad general
  async checkConnectivity() {
    const now = Date.now()
    if (now - this.lastCheck < this.checkInterval) {
      return this.isOnline
    }

    try {
      console.log("🔍 Verificando conectividad...")
      
      // Verificar API básica
      const response = await fetch(`${BASE_URL}/health`, {
        method: "GET",
        timeout: 10000
      })

      this.isOnline = response.ok
      this.lastCheck = now
      
      console.log(`🌐 Conectividad: ${this.isOnline ? "✅ Online" : "❌ Offline"}`)
      return this.isOnline

    } catch (error) {
      console.warn("⚠️ Error verificando conectividad:", error.message)
      this.isOnline = false
      this.lastCheck = now
      return false
    }
  }

  // Verificar conectividad del socket
  async checkSocketConnectivity() {
    try {
      console.log("🔍 Verificando conectividad del socket...")
      console.log("🔗 Socket URL:", SOCKET_URL)
      
      // Verificar que la URL sea válida
      if (!SOCKET_URL || SOCKET_URL.includes('undefined') || SOCKET_URL.includes('/-')) {
        console.error("❌ Socket URL inválida:", SOCKET_URL)
        return false
      }

      // Intentar una conexión HTTP básica al servidor del socket
      const socketBaseUrl = SOCKET_URL.replace(':3001', '')
      const testUrl = `${socketBaseUrl}/health`
      
      console.log("🔗 Probando URL base del socket:", testUrl)
      
      const response = await fetch(testUrl, {
        method: "GET",
        timeout: 10000
      })

      const socketOnline = response.ok
      console.log(`🔌 Socket conectividad: ${socketOnline ? "✅ Disponible" : "❌ No disponible"}`)
      
      return socketOnline

    } catch (error) {
      console.warn("⚠️ Error verificando socket:", error.message)
      return false
    }
  }

  // Verificar token de autenticación
  async checkAuthToken() {
    try {
      const token = await AsyncStorage.getItem("token")
      if (!token) {
        console.warn("⚠️ No hay token de autenticación")
        return false
      }

      // Verificar que el token no esté expirado
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const now = Math.floor(Date.now() / 1000)
        
        if (payload.exp && payload.exp < now) {
          console.warn("⚠️ Token expirado")
          return false
        }

        console.log("✅ Token válido")
        return true

      } catch (parseError) {
        console.warn("⚠️ Error parseando token:", parseError.message)
        return false
      }

    } catch (error) {
      console.warn("⚠️ Error verificando token:", error.message)
      return false
    }
  }

  // Diagnóstico completo
  async runDiagnostics() {
    console.log("🔍 Ejecutando diagnóstico completo...")
    
    const results = {
      timestamp: new Date().toISOString(),
      api: await this.checkConnectivity(),
      socket: await this.checkSocketConnectivity(),
      auth: await this.checkAuthToken(),
      config: {
        BASE_URL,
        SOCKET_URL,
        socketUrlValid: !SOCKET_URL.includes('undefined') && !SOCKET_URL.includes('/-')
      }
    }

    console.log("📊 Resultados del diagnóstico:", results)
    return results
  }

  // Obtener recomendaciones basadas en el diagnóstico
  getRecommendations(diagnostics) {
    const recommendations = []

    if (!diagnostics.api) {
      recommendations.push("❌ API no disponible - Verificar conexión a internet")
    }

    if (!diagnostics.socket) {
      recommendations.push("❌ Socket no disponible - Funcionará en modo offline")
    }

    if (!diagnostics.auth) {
      recommendations.push("❌ Token inválido - Necesario volver a iniciar sesión")
    }

    if (!diagnostics.config.socketUrlValid) {
      recommendations.push("❌ URL de socket malformada - Verificar configuración")
    }

    if (recommendations.length === 0) {
      recommendations.push("✅ Todo funcionando correctamente")
    }

    return recommendations
  }
}

export default new ConnectivityService()