const PLACEHOLDER = "https://via.placeholder.com/400x200/8B5CF6/FFFFFF?text=Image"

// Normaliza URLs de imágenes para usar con Cloudinary
export function normalizeImageUrl(input, defaultImage = PLACEHOLDER) {
  try {
    if (!input || typeof input !== "string") return defaultImage
    let url = input.trim()

    // Permitir URIs locales del dispositivo (ImagePicker)
    if (/^(file:\/\/|content:\/\/)/i.test(url)) {
      return url
    }

    // Manejar URLs blob (usadas en web) - devolver placeholder
    if (/^blob:/i.test(url)) {
      console.log('⚠️ Blob URL detected, using placeholder for image')
      return defaultImage
    }

    // Si ya es una URL completa válida (HTTP/HTTPS), verificar si es local y corregirla
    if (/^https?:\/\//i.test(url)) {
      // Detectar URLs locales que necesitan ser corregidas
      if (url.includes('localhost:3000') || 
          url.includes('10.0.0.2:3000') || 
          url.includes('10.0.0.44:3000') ||
          url.includes('192.168.') ||
          url.match(/http:\/\/\d+\.\d+\.\d+\.\d+:3000/)) {
        
        console.log(`🔧 Fixing local URL: ${url}`)
        
        // Extraer la parte de uploads de la URL local
        const uploadsMatch = url.match(/uploads\/(.+)$/)
        if (uploadsMatch) {
          const { BASE_URL_IMAGE } = require('../config')
          // Asegurar que BASE_URL_IMAGE tenga el protocolo correcto
          let baseUrl = BASE_URL_IMAGE
          if (!baseUrl.startsWith('http')) {
            baseUrl = `https://${baseUrl}`
          }
          const fixedUrl = `${baseUrl}/uploads/${uploadsMatch[1]}`
          console.log(`✅ Fixed URL: ${fixedUrl}`)
          return fixedUrl
        }
      }
      
      // Si es una URL válida y no es local, devolverla tal como está
      return url
    }

    // Si es una ruta de uploads del backend, construir URL completa
    if (url.startsWith('uploads/')) {
      const { BASE_URL_IMAGE } = require('../config')
      // Asegurar que BASE_URL_IMAGE tenga el protocolo correcto
      let baseUrl = BASE_URL_IMAGE
      if (!baseUrl.startsWith('http')) {
        baseUrl = `https://${baseUrl}`
      }
      return `${baseUrl}/${url}`
    }

    // Si es una ruta relativa de Cloudinary, construir URL completa
    if (url.startsWith('/') && url.includes('cloudinary')) {
      return `https:${url}`
    }

    // Para otras rutas relativas, asumir que son de Cloudinary
    if (url.startsWith('/')) {
      return `https://res.cloudinary.com/dxa1augjh/image/upload${url}`
    }

    // Si no es una URL válida, devolver placeholder
    return defaultImage
  } catch (e) {
    console.error('❌ Error normalizing image URL:', e)
    return defaultImage
  }
}

// Optimiza imágenes de Cloudinary con transformaciones
export function optimizeImage(imageUrl, options = {}) {
  const {
    width = 400,
    height = 200,
    quality = 'auto',
    format = 'auto'
  } = options
  
  const normalizedUrl = normalizeImageUrl(imageUrl)
  
  // Solo optimizar si es una imagen de Cloudinary
  if (normalizedUrl.includes('cloudinary.com')) {
    const transformations = `w_${width},h_${height},c_fill,q_${quality},f_${format}`
    return normalizedUrl.replace('/upload/', `/upload/${transformations}/`)
  }
  
  return normalizedUrl
}

// Genera URL de avatar por defecto
export function getDefaultAvatar(name = 'User') {
  const initial = name.charAt(0).toUpperCase()
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=8B5CF6&color=fff&size=200&font-size=0.6`
}

export function getSafeImageUrl(input, fallback = PLACEHOLDER) {
  const url = normalizeImageUrl(input, fallback)
  return url || fallback
}

