import { GOOGLE_CREDENTIALS } from '../config/googleCredentials'

class GoogleAuthService {
  constructor() {
    this.credentials = GOOGLE_CREDENTIALS
    this.accessToken = null
    this.tokenExpiry = null
  }

  // Generar JWT para autenticación con Google
  async generateJWT() {
    try {
      const header = {
        alg: 'RS256',
        typ: 'JWT'
      }

      const now = Math.floor(Date.now() / 1000)
      const payload = {
        iss: this.credentials.client_email,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600, // 1 hora
        iat: now
      }

      // En React Native, usamos una implementación simplificada
      // En producción, deberías usar una librería como 'jsonwebtoken'
      const encodedHeader = btoa(JSON.stringify(header))
      const encodedPayload = btoa(JSON.stringify(payload))
      
      // Por ahora, usamos las credenciales directamente
      return {
        success: true,
        credentials: this.credentials,
        message: 'Credenciales de servicio configuradas'
      }
    } catch (error) {
      console.error('Error generando JWT:', error)
      return {
        success: false,
        error: error.message,
        message: 'No se pudieron generar las credenciales'
      }
    }
  }

  // Verificar si las credenciales están disponibles
  isConfigured() {
    return this.credentials && 
           this.credentials.client_email && 
           this.credentials.private_key &&
           this.credentials.project_id
  }

  // Obtener información de configuración
  getConfigInfo() {
    return {
      projectId: this.credentials.project_id,
      clientEmail: this.credentials.client_email,
      isConfigured: this.isConfigured()
    }
  }
}

export default new GoogleAuthService() 