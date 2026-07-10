import { GOOGLE_SHEETS_BASE_URL, GOOGLE_SHEETS_SPREADSHEET_ID, GOOGLE_SHEETS_RANGE } from '../config'
import { GOOGLE_SHEET_CONFIG } from '../config/googleCredentials'
import googleAuthService from './googleAuthService'

class GoogleSheetsService {
  constructor() {
    this.baseUrl = GOOGLE_SHEETS_BASE_URL
    this.spreadsheetId = GOOGLE_SHEETS_SPREADSHEET_ID
    this.range = GOOGLE_SHEETS_RANGE
    
    // Usar la configuración real de la hoja
    this.realSheetConfig = GOOGLE_SHEET_CONFIG
  }

  // Sincronizar un evento con Google Sheets usando OAuth2
  async syncEvent(eventData) {
    try {
      // Verificar configuración
      if (!this.isConfigured()) {
        throw new Error('Configuración de Google Sheets incompleta. Verifica las credenciales.')
      }

      // Obtener credenciales de autenticación
      const authResult = await googleAuthService.generateJWT()
      if (!authResult.success) {
        throw new Error(`Error de autenticación: ${authResult.error}`)
      }

      const values = [
        [
          eventData.title || 'Sin título',
          eventData.date || new Date().toISOString(),
          this.formatLocation(eventData.location),
          eventData.description || 'Sin descripción'
        ]
      ]

      console.log('📊 Intentando sincronizar con Google Sheets:', {
        spreadsheetId: this.spreadsheetId,
        range: this.range,
        values: values,
        authMethod: 'OAuth2 Service Account'
      })

      // Usar autenticación OAuth2 con credenciales de servicio
      const response = await fetch(
        `${this.baseUrl}/${this.spreadsheetId}/values/${this.range}:append?valueInputOption=RAW`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await this.getAccessToken()}`,
          },
          body: JSON.stringify({ values })
        }
      )

      if (!response.ok) {
        const errorData = await response.text()
        console.error('❌ Error de Google Sheets:', response.status, errorData)
        throw new Error(`Error de Google Sheets: ${response.status} - ${errorData}`)
      }

      const result = await response.json()
      console.log('✅ Sincronización exitosa:', result)
      
      return {
        success: true,
        data: result,
        message: 'Evento sincronizado exitosamente con Google Sheets'
      }
    } catch (error) {
      console.error('❌ Error en GoogleSheetsService.syncEvent:', error)
      return {
        success: false,
        error: error.message,
        message: `No se pudo sincronizar con Google Sheets: ${error.message}`
      }
    }
  }

  // Obtener eventos desde Google Sheets
  async getEvents() {
    try {
      if (!this.isConfigured()) {
        throw new Error('Configuración de Google Sheets incompleta')
      }

      const response = await fetch(
        `${this.baseUrl}/${this.spreadsheetId}/values/${this.range}`,
        {
          headers: {
            'Authorization': `Bearer ${await this.getAccessToken()}`,
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Error obteniendo datos: ${response.status}`)
      }

      const result = await response.json()
      return {
        success: true,
        data: result.values || [],
        message: 'Eventos obtenidos exitosamente'
      }
    } catch (error) {
      console.error('Error en GoogleSheetsService.getEvents:', error)
      return {
        success: false,
        error: error.message,
        message: 'No se pudieron obtener los eventos'
      }
    }
  }

  // Obtener token de acceso (simulado para desarrollo)
  async getAccessToken() {
    // En desarrollo, simulamos un token
    // En producción, deberías implementar OAuth2 completo
    return 'development-token'
  }

  // Formatear ubicación para Google Sheets
  formatLocation(location) {
    if (!location) return 'No especificada'
    
    if (typeof location === 'string') return location
    
    if (location.coordinates && Array.isArray(location.coordinates)) {
      const [lng, lat] = location.coordinates
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    }
    
    if (location.address) return location.address
    
    return 'Ubicación disponible'
  }

  // Verificar si el servicio está configurado correctamente
  isConfigured() {
    const hasBasicConfig = this.baseUrl && this.spreadsheetId
    const hasAuthService = googleAuthService.isConfigured()
    
    console.log('🔍 Verificación de configuración:', {
      hasBasicConfig,
      hasAuthService,
      baseUrl: !!this.baseUrl,
      spreadsheetId: this.spreadsheetId,
      realSpreadsheetId: this.realSheetConfig.spreadsheet_id
    })
    
    return hasBasicConfig && hasAuthService
  }

  // Obtener información de configuración
  getConfigInfo() {
    return {
      spreadsheetId: this.spreadsheetId,
      range: this.range,
      isConfigured: this.isConfigured(),
      authService: googleAuthService.getConfigInfo()
    }
  }

  // Obtener configuración real de la hoja
  getRealSheetConfig() {
    return this.realSheetConfig
  }
}

export default new GoogleSheetsService() 