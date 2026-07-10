// Utilidad para debug y logging controlado
class DebugLogger {
  constructor() {
    this.logs = new Map()
    this.throttleTime = 2000 // 2 segundos
  }

  // Log con throttling para evitar spam
  throttledLog(key, message, data = {}) {
    const now = Date.now()
    const lastLog = this.logs.get(key)
    
    if (!lastLog || (now - lastLog.timestamp) > this.throttleTime) {
      console.log(message, data)
      this.logs.set(key, { timestamp: now, data })
      return true
    }
    return false
  }

  // Log solo si los datos cambiaron
  logOnChange(key, message, data = {}) {
    const lastLog = this.logs.get(key)
    const dataString = JSON.stringify(data)
    
    if (!lastLog || lastLog.dataString !== dataString) {
      console.log(message, data)
      this.logs.set(key, { 
        timestamp: Date.now(), 
        data, 
        dataString 
      })
      return true
    }
    return false
  }

  // Log con contador para detectar loops
  logWithCounter(key, message, data = {}) {
    const now = Date.now()
    const lastLog = this.logs.get(key) || { count: 0, timestamp: now }
    
    // Reset counter si pasó más de 10 segundos
    if (now - lastLog.timestamp > 10000) {
      lastLog.count = 0
      lastLog.timestamp = now
    }
    
    lastLog.count++
    
    // Solo log cada 5 llamadas o si es la primera
    if (lastLog.count === 1 || lastLog.count % 5 === 0) {
      console.log(`${message} (llamada #${lastLog.count})`, data)
    }
    
    // Advertencia si hay demasiadas llamadas
    if (lastLog.count > 20) {
      console.warn(`🚨 POSIBLE LOOP INFINITO detectado en ${key}: ${lastLog.count} llamadas`)
    }
    
    this.logs.set(key, lastLog)
    return lastLog.count
  }

  // Limpiar logs antiguos
  cleanup() {
    const now = Date.now()
    const maxAge = 60000 // 1 minuto
    
    for (const [key, log] of this.logs.entries()) {
      if (now - log.timestamp > maxAge) {
        this.logs.delete(key)
      }
    }
  }
}

// Instancia singleton
const debugLogger = new DebugLogger()

// Limpiar logs cada minuto
setInterval(() => {
  debugLogger.cleanup()
}, 60000)

export default debugLogger