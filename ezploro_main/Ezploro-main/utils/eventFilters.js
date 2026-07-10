// utils/eventFilters.js - Lógica unificada de filtros para eventos

import { FILTER_CATEGORIES } from "../constants/filterCategories"

/**
 * Filtra eventos por categoría y subcategoría de manera unificada
 * @param {Array} events - Array de eventos
 * @param {string} selectedFilter - Filtro seleccionado
 * @param {string} searchQuery - Query de búsqueda (opcional)
 * @param {Date} selectedDate - Fecha seleccionada (opcional)
 * @returns {Array} - Eventos filtrados
 */
export const filterEvents = (events, selectedFilter, searchQuery = "", selectedDate = null) => {
  let filtered = [...events]

  // Filtro por búsqueda
  if (searchQuery && searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim()
    filtered = filtered.filter((event) => {
      return (
        event.title?.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.city?.toLowerCase().includes(query) ||
        event.address?.toLowerCase().includes(query) ||
        event.creator?.username?.toLowerCase().includes(query)
      )
    })
  }

  // Filtro por categoría/subcategoría
  if (selectedFilter && selectedFilter !== "all_events") {
    filtered = filtered.filter((event) => {
      return matchesFilter(event, selectedFilter)
    })
  }

  // Filtro por fecha
  if (selectedDate) {
    filtered = filtered.filter((event) => {
      const eventDate = new Date(event.date_time)
      return (
        eventDate.getDate() === selectedDate.getDate() &&
        eventDate.getMonth() === selectedDate.getMonth() &&
        eventDate.getFullYear() === selectedDate.getFullYear()
      )
    })
  }

  return filtered
}

/**
 * Verifica si un evento coincide con el filtro seleccionado
 * @param {Object} event - Evento a verificar
 * @param {string} selectedFilter - Filtro seleccionado
 * @returns {boolean} - true si coincide, false si no
 */
export const matchesFilter = (event, selectedFilter) => {
  // Caso especial para eventos online
  if (selectedFilter === "online") {
    return event.online === true || event.online === "true" || event.category === "online"
  }

  // Normalizar datos del evento
  const eventCategory = event.category ? event.category.toLowerCase().trim() : ""
  const eventSubcategory = event.subcategory ? event.subcategory.toLowerCase().trim() : ""
  const filterLower = selectedFilter.toLowerCase().trim()

  // Verificar si es una categoría principal
  const isMainCategory = Object.keys(FILTER_CATEGORIES).includes(selectedFilter)
  
  if (isMainCategory) {
    // Para categorías principales, verificar coincidencia exacta o parcial
    return (
      eventCategory === filterLower ||
      eventCategory.includes(filterLower) ||
      filterLower.includes(eventCategory)
    )
  }

  // Verificar si es una subcategoría
  for (const [categoryKey, categoryData] of Object.entries(FILTER_CATEGORIES)) {
    const subcategory = categoryData.subcategories.find(sub => sub.name === selectedFilter)
    
    if (subcategory) {
      // Es una subcategoría válida
      const subcategoryLower = subcategory.name.toLowerCase().trim()
      const subcategoryLabelLower = subcategory.label.toLowerCase().trim()
      const categoryKeyLower = categoryKey.toLowerCase().trim()
      
      // Verificar múltiples formas de coincidencia
      return (
        // Coincidencia exacta de subcategoría
        eventSubcategory === subcategoryLower ||
        eventSubcategory.includes(subcategoryLower) ||
        subcategoryLower.includes(eventSubcategory) ||
        
        // Coincidencia por label de subcategoría
        eventSubcategory === subcategoryLabelLower ||
        eventSubcategory.includes(subcategoryLabelLower) ||
        subcategoryLabelLower.includes(eventSubcategory) ||
        
        // Coincidencia de categoría principal (para eventos que solo tienen categoría)
        (eventCategory === categoryKeyLower && !eventSubcategory) ||
        eventCategory.includes(categoryKeyLower) ||
        categoryKeyLower.includes(eventCategory) ||
        
        // Coincidencia directa con el nombre del filtro
        eventCategory === filterLower ||
        eventSubcategory === filterLower ||
        eventCategory.includes(filterLower) ||
        eventSubcategory.includes(filterLower)
      )
    }
  }

  // Si no es una categoría o subcategoría conocida, hacer coincidencia directa
  return (
    eventCategory === filterLower ||
    eventSubcategory === filterLower ||
    eventCategory.includes(filterLower) ||
    eventSubcategory.includes(filterLower) ||
    filterLower.includes(eventCategory) ||
    filterLower.includes(eventSubcategory)
  )
}

/**
 * Obtiene el label del filtro activo
 * @param {string} selectedFilter - Filtro seleccionado
 * @returns {string} - Label del filtro
 */
export const getActiveFilterLabel = (selectedFilter) => {
  if (!selectedFilter || selectedFilter === "all_events") {
    return "Todos"
  }

  // Verificar si es una categoría principal
  const category = FILTER_CATEGORIES[selectedFilter]
  if (category) {
    return category.label
  }

  // Buscar en subcategorías
  for (const categoryData of Object.values(FILTER_CATEGORIES)) {
    const subcategory = categoryData.subcategories.find(sub => sub.name === selectedFilter)
    if (subcategory) {
      return subcategory.label
    }
  }

  // Fallback
  return selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1)
}

/**
 * Debug: Imprime información del evento para debugging
 * @param {Object} event - Evento a debuggear
 * @param {string} selectedFilter - Filtro aplicado
 */
export const debugEventFilter = (event, selectedFilter) => {
  console.log("🔍 Debug Event Filter:", {
    eventTitle: event.title,
    eventCategory: event.category,
    eventSubcategory: event.subcategory,
    eventOnline: event.online,
    selectedFilter: selectedFilter,
    matches: matchesFilter(event, selectedFilter)
  })
}