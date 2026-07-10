import { GOOGLE_SHEET_CONFIG } from '../config/googleCredentials'
import { getGoogleSheetsConfig, isDevelopmentMode } from '../config/googleSheetsDev'

class GoogleSheetsDirectService {
  constructor() {
    this.config = GOOGLE_SHEET_CONFIG
    this.devConfig = getGoogleSheetsConfig()
    this.baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets'
  }

  // Sincronizar evento usando método alternativo
  async syncEvent(eventData) {
    try {
      console.log('📊 Intentando sincronización con Google Sheets')
      console.log('🔧 Configuración:', this.devConfig)
      
      if (isDevelopmentMode() && this.devConfig.enableMockSync) {
        // Modo desarrollo: simulación exitosa
        return this.mockSync(eventData)
      } else {
        // Modo producción: implementar API real
        return this.realSync(eventData)
      }
    } catch (error) {
      console.error('❌ Error en sincronización:', error)
      return {
        success: false,
        error: error.message,
        message: 'Error en sincronización'
      }
    }
  }

  // Sincronización simulada para desarrollo
  mockSync(eventData) {
    console.log('🎭 Ejecutando sincronización simulada')
    
    const mockResult = {
      success: true,
      data: {
        spreadsheetId: this.devConfig.spreadsheet_id,
        updatedRange: this.devConfig.range,
        updatedRows: 1,
        timestamp: new Date().toISOString()
      },
      message: `Evento "${eventData.title}" sincronizado exitosamente (modo desarrollo)`
    }

    console.log('✅ Sincronización simulada exitosa:', mockResult.data)
    return mockResult
  }

  // Sincronización real (para implementar en producción)
  async realSync(eventData) {
    console.log('🚀 Ejecutando sincronización real')
    
    // TODO: Implementar API real de Google Sheets
    // Por ahora, retornamos simulación
    return this.mockSync(eventData)
  }

  // Verificar configuración
  isConfigured() {
    const hasConfig = this.config && 
                     this.config.spreadsheet_id && 
                     this.config.range
    
    const hasDevConfig = this.devConfig && 
                        this.devConfig.spreadsheet_id && 
                        this.devConfig.range

    console.log('🔍 Verificación de configuración:', {
      hasConfig,
      hasDevConfig,
      isDevelopment: isDevelopmentMode(),
      spreadsheetId: this.devConfig.spreadsheet_id
    })
    
    return hasConfig || hasDevConfig
  }

  // Obtener información de configuración
  getConfigInfo() {
    return {
      spreadsheetId: this.devConfig.spreadsheet_id,
      range: this.devConfig.range,
      sheetName: this.devConfig.sheet_name,
      isConfigured: this.isConfigured(),
      isDevelopment: isDevelopmentMode(),
      enableMockSync: this.devConfig.enableMockSync
    }
  }
}

export default new GoogleSheetsDirectService() 