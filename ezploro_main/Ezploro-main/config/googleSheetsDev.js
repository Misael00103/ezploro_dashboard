// Configuración simplificada para desarrollo
export const GOOGLE_SHEETS_DEV_CONFIG = {
  // ID real de tu Google Sheets
  spreadsheet_id: "2f557cc377652249a61b872271bcbd8f193c6854",
  
  // Nombre de la hoja y rango
  sheet_name: "Eventos",
  range: "Eventos!A:D",
  
  // Configuración de desarrollo
  isDevelopment: true,
  enableMockSync: true,
  
  // Datos de ejemplo para testing
  sampleEvent: {
    title: "Evento de Prueba",
    date: new Date().toISOString(),
    location: "Ubicación de prueba",
    description: "Descripción de prueba"
  }
}

// Función para verificar si estamos en desarrollo
export const isDevelopmentMode = () => {
  return __DEV__ || GOOGLE_SHEETS_DEV_CONFIG.isDevelopment
}

// Función para obtener configuración según el entorno
export const getGoogleSheetsConfig = () => {
  if (isDevelopmentMode()) {
    return GOOGLE_SHEETS_DEV_CONFIG
  }
  
  // En producción, usar configuración real
  return {
    spreadsheet_id: "2f557cc377652249a61b872271bcbd8f193c6854",
    sheet_name: "Eventos",
    range: "Eventos!A:D",
    isDevelopment: false,
    enableMockSync: false
  }
} 