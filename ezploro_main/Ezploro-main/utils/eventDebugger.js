// utils/eventDebugger.js - Herramientas de debugging para eventos

import { FILTER_CATEGORIES } from "../constants/filterCategories"
import { matchesFilter } from "./eventFilters"

/**
 * Debuggea un evento específico para ver por qué no aparece en los filtros
 * @param {Object} event - Evento a debuggear
 * @param {string} selectedFilter - Filtro aplicado
 */
export const debugEvent = (event, selectedFilter) => {
  console.log("🔍 ===== EVENT DEBUG =====")
  console.log("📋 Event Data:", {
    title: event.title,
    category: event.category,
    subcategory: event.subcategory,
    online: event.online,
    id: event.event_id || event.id
  })
  
  console.log("🎯 Filter Data:", {
    selectedFilter: selectedFilter,
    isMainCategory: Object.keys(FILTER_CATEGORIES).includes(selectedFilter),
    isOnlineFilter: selectedFilter === "online"
  })

  // Verificar si es subcategoría
  let subcategoryInfo = null
  for (const [categoryKey, categoryData] of Object.entries(FILTER_CATEGORIES)) {
    const subcategory = categoryData.subcategories.find(sub => sub.name === selectedFilter)
    if (subcategory) {
      subcategoryInfo = {
        parentCategory: categoryKey,
        subcategory: subcategory,
        parentLabel: categoryData.label
      }
      break
    }
  }

  if (subcategoryInfo) {
    console.log("📂 Subcategory Info:", subcategoryInfo)
  }

  // Verificar coincidencias
  const matches = matchesFilter(event, selectedFilter)
  console.log("✅ Matches Filter:", matches)

  // Verificar coincidencias específicas
  if (selectedFilter === "online") {
    console.log("🌐 Online Check:", {
      eventOnline: event.online,
      eventOnlineType: typeof event.online,
      eventCategory: event.category,
      shouldMatch: event.online === true || event.online === "true" || event.category === "online"
    })
  }

  // Verificar coincidencias de categoría
  if (event.category) {
    const categoryMatches = event.category.toLowerCase() === selectedFilter.toLowerCase()
    console.log("📁 Category Match:", {
      eventCategory: event.category.toLowerCase(),
      selectedFilter: selectedFilter.toLowerCase(),
      exactMatch: categoryMatches,
      includes: event.category.toLowerCase().includes(selectedFilter.toLowerCase())
    })
  }

  // Verificar coincidencias de subcategoría
  if (event.subcategory) {
    const subcategoryMatches = event.subcategory.toLowerCase() === selectedFilter.toLowerCase()
    console.log("📂 Subcategory Match:", {
      eventSubcategory: event.subcategory.toLowerCase(),
      selectedFilter: selectedFilter.toLowerCase(),
      exactMatch: subcategoryMatches,
      includes: event.subcategory.toLowerCase().includes(selectedFilter.toLowerCase())
    })
  }

  console.log("🔍 ===== END DEBUG =====")
  
  return matches
}

/**
 * Debuggea todos los eventos para un filtro específico
 * @param {Array} events - Array de eventos
 * @param {string} selectedFilter - Filtro aplicado
 */
export const debugAllEvents = (events, selectedFilter) => {
  console.log(`🔍 ===== DEBUGGING ALL EVENTS FOR FILTER: ${selectedFilter} =====`)
  
  const matchingEvents = []
  const nonMatchingEvents = []

  events.forEach(event => {
    const matches = matchesFilter(event, selectedFilter)
    if (matches) {
      matchingEvents.push(event)
    } else {
      nonMatchingEvents.push(event)
    }
  })

  console.log(`✅ Matching Events (${matchingEvents.length}):`)
  matchingEvents.forEach(event => {
    console.log(`  - ${event.title} (category: ${event.category}, subcategory: ${event.subcategory}, online: ${event.online})`)
  })

  console.log(`❌ Non-Matching Events (${nonMatchingEvents.length}):`)
  nonMatchingEvents.forEach(event => {
    console.log(`  - ${event.title} (category: ${event.category}, subcategory: ${event.subcategory}, online: ${event.online})`)
  })

  console.log("🔍 ===== END ALL EVENTS DEBUG =====")
  
  return { matchingEvents, nonMatchingEvents }
}

/**
 * Verifica la configuración de categorías
 */
export const debugCategories = () => {
  console.log("🔍 ===== CATEGORIES DEBUG =====")
  
  Object.entries(FILTER_CATEGORIES).forEach(([key, category]) => {
    console.log(`📁 ${key}: ${category.label}`)
    category.subcategories.forEach(sub => {
      console.log(`  📂 ${sub.name}: ${sub.label}`)
    })
  })
  
  console.log("🔍 ===== END CATEGORIES DEBUG =====")
}

/**
 * Función helper para usar en la consola del navegador
 * Uso: window.debugMyEvent = debugMyEvent
 */
export const debugMyEvent = (eventTitle, filterName) => {
  // Esta función se puede usar desde la consola del navegador
  console.log(`Debugging event "${eventTitle}" with filter "${filterName}"`)
  // Aquí podrías agregar lógica adicional si necesitas
}