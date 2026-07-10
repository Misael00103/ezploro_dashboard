// constants/filterCategories.js - Sistema unificado de categorías para filtros

export const FILTER_CATEGORIES = {
  "musica": {
    label: "Música",
    icon: "musical-notes-outline",
    color: "#FF4757",
    subcategories: [
      { name: "reggaeton_dembow", label: "Reguetón / Dembow", icon: "musical-note-outline", color: "#FF4757" },
      { name: "bachata", label: "Bachata", icon: "heart-outline", color: "#F472B6" },
      { name: "merengue", label: "Merengue", icon: "happy-outline", color: "#FBBF24" },
      { name: "electronica", label: "Electrónica", icon: "flash-outline", color: "#60A5FA" },
      { name: "salsa", label: "Salsa", icon: "flame-outline", color: "#EC4899" },
      { name: "trap_hiphop", label: "Trap / Hip-Hop", icon: "mic-outline", color: "#A78BFA" },
      { name: "pop", label: "Pop", icon: "star-outline", color: "#34D399" },
      { name: "rock_alternativo", label: "Rock / Alternativo", icon: "thunderstorm-outline", color: "#FB923C" },
      { name: "karaoke", label: "Karaoke", icon: "mic-outline", color: "#6EE7B7" },
      { name: "otros_musica", label: "Otros", icon: "ellipsis-horizontal-outline", color: "#B8B8B8" },
    ]
  },
  "comida_bebida": {
    label: "Comida & Bebida",
    icon: "restaurant-outline",
    color: "#34D399",
    subcategories: [
      { name: "brunch", label: "Brunch", icon: "sunny-outline", color: "#FBBF24" },
      { name: "comida_rapida", label: "Comida rápida", icon: "fast-food-outline", color: "#FF4757" },
      { name: "dominicana", label: "Dominicana", icon: "flag-outline", color: "#60A5FA" },
      { name: "internacional", label: "Internacional", icon: "globe-outline", color: "#A78BFA" },
      { name: "asiatica", label: "Asiática", icon: "restaurant-outline", color: "#EC4899" },
      { name: "mexicana", label: "Mexicana", icon: "leaf-outline", color: "#10B981" },
      { name: "mariscos", label: "Mariscos", icon: "fish-outline", color: "#6EE7B7" },
      { name: "italiana", label: "Italiana", icon: "pizza-outline", color: "#F472B6" },
      { name: "catas_bebidas", label: "Catas & Bebidas", icon: "wine-outline", color: "#FB923C" },
    ]
  },
  "deportes_fitness": {
    label: "Deportes & Fitness",
    icon: "fitness-outline",
    color: "#FBBF24",
    subcategories: [
      { name: "beisbol", label: "Béisbol", icon: "baseball-outline", color: "#FF4757" },
      { name: "baloncesto", label: "Baloncesto", icon: "basketball-outline", color: "#EC4899" },
      { name: "futbol", label: "Fútbol", icon: "football-outline", color: "#34D399" },
      { name: "boxeo", label: "Boxeo", icon: "fitness-outline", color: "#60A5FA" },
      { name: "fitness", label: "Fitness", icon: "barbell-outline", color: "#A78BFA" },
      { name: "running_maratones", label: "Running / Maratones", icon: "walk-outline", color: "#F472B6" },
      { name: "baile", label: "Baile", icon: "body-outline", color: "#6EE7B7" },
    ]
  },
  "teatro": {
    label: "Teatro",
    icon: "library-outline",
    color: "#A78BFA",
    subcategories: [
      { name: "obras_teatro", label: "Obras de teatro", icon: "library-outline", color: "#EC4899" },
      { name: "standup_comedy", label: "Stand-up comedy", icon: "happy-outline", color: "#FBBF24" },
      { name: "musicales", label: "Musicales", icon: "musical-notes-outline", color: "#FF4757" },
      { name: "danza", label: "Danza", icon: "person-outline", color: "#34D399" },
    ]
  },
  "tecnologia_educacion": {
    label: "Tecnología & Educación",
    icon: "laptop-outline",
    color: "#60A5FA",
    subcategories: [
      { name: "conferencias", label: "Conferencias", icon: "people-outline", color: "#A78BFA" },
      { name: "talleres_cursos", label: "Talleres / cursos", icon: "school-outline", color: "#6EE7B7" },
      { name: "startups_innovacion", label: "Startups / Innovación", icon: "rocket-outline", color: "#FB923C" },
    ]
  },
  "familia": {
    label: "Familia",
    icon: "people-outline",
    color: "#F472B6",
    subcategories: [
      { name: "eventos_infantiles", label: "Eventos infantiles", icon: "balloon-outline", color: "#FF4757" },
      { name: "aire_libre", label: "Aire libre", icon: "leaf-outline", color: "#34D399" },
      { name: "talleres_ninos", label: "Talleres para niños", icon: "construct-outline", color: "#FBBF24" },
      { name: "shows_familiares", label: "Shows familiares", icon: "star-outline", color: "#EC4899" },
      { name: "actividades_escolares", label: "Actividades escolares", icon: "school-outline", color: "#60A5FA" },
    ]
  },
  "ferias_mercados": {
    label: "Ferias & Mercados",
    icon: "storefront-outline",
    color: "#FB923C",
    subcategories: [
      { name: "ferias_comida", label: "Ferias de comida", icon: "restaurant-outline", color: "#34D399" },
      { name: "mercados_artesanales", label: "Mercados artesanales", icon: "color-palette-outline", color: "#A78BFA" },
      { name: "moda_diseno", label: "Moda & diseño", icon: "shirt-outline", color: "#F472B6" },
      { name: "libros_cultura", label: "Libros & cultura", icon: "book-outline", color: "#60A5FA" },
      { name: "ferias_inmobiliarias", label: "Ferias inmobiliarias / negocios", icon: "business-outline", color: "#EC4899" },
      { name: "feria_anime", label: "Feria anime y cultura pop", icon: "game-controller-outline", color: "#FF4757" },
      { name: "videojuegos_esports", label: "Videojuegos / eSports", icon: "game-controller-outline", color: "#6EE7B7" },
    ]
  },
  "naturaleza_aire_libre": {
    label: "Naturaleza & Aire Libre",
    icon: "leaf-outline",
    color: "#10B981",
    subcategories: [
      { name: "excursiones", label: "Excursiones", icon: "walk-outline", color: "#FBBF24" },
      { name: "camping", label: "Camping", icon: "bonfire-outline", color: "#FF4757" },
      { name: "ecoturismo", label: "Ecoturismo", icon: "earth-outline", color: "#34D399" },
      { name: "actividades_acuaticas", label: "Actividades acuáticas", icon: "water-outline", color: "#60A5FA" },
      { name: "aventuras_extremas", label: "Aventuras extremas", icon: "flash-outline", color: "#EC4899" },
    ]
  },
  "caridad_comunidad": {
    label: "Caridad & Comunidad",
    icon: "heart-outline",
    color: "#EC4899",
    subcategories: [
      { name: "eventos_beneficos", label: "Eventos benéficos", icon: "heart-outline", color: "#F472B6" },
      { name: "voluntariado", label: "Voluntariado", icon: "hand-left-outline", color: "#A78BFA" },
      { name: "donaciones", label: "Donaciones", icon: "gift-outline", color: "#FB923C" },
      { name: "campanas_sociales", label: "Campañas sociales", icon: "megaphone-outline", color: "#6EE7B7" },
    ]
  },
  "online": {
    label: "Online",
    icon: "globe-outline",
    color: "#6EE7B7",
    subcategories: [
      { name: "webinars", label: "Webinars", icon: "videocam-outline", color: "#60A5FA" },
      { name: "talleres_virtuales", label: "Talleres virtuales", icon: "laptop-outline", color: "#A78BFA" },
      { name: "networking_online", label: "Networking online", icon: "share-social-outline", color: "#34D399" },
      { name: "streaming", label: "Streaming", icon: "tv-outline", color: "#FF4757" },
      { name: "cursos_online", label: "Cursos en línea", icon: "school-outline", color: "#FBBF24" },
    ]
  },
  "casino": {
    label: "Casino",
    icon: "diamond-outline",
    color: "#FFD700",
    subcategories: [
      { name: "torneos", label: "Torneos", icon: "trophy-outline", color: "#C0C0C0" },
    ]
  },
  "after": {
    label: "After",
    icon: "moon-outline",
    color: "#6366F1",
    subcategories: []
  }
}

// Función para obtener todas las categorías como array (para compatibilidad)
export const getCategoriesArray = () => {
  return Object.entries(FILTER_CATEGORIES).map(([key, value]) => ({
    value: key,
    label: value.label,
    icon: value.icon,
    color: value.color
  }))
}

// Función para obtener subcategorías de una categoría
export const getSubcategories = (categoryKey) => {
  return FILTER_CATEGORIES[categoryKey]?.subcategories || []
}

// Función para obtener el label de una categoría
export const getCategoryLabel = (categoryKey) => {
  return FILTER_CATEGORIES[categoryKey]?.label || categoryKey
}

// Función para obtener el label de una subcategoría
export const getSubcategoryLabel = (categoryKey, subcategoryKey) => {
  const subcategories = getSubcategories(categoryKey)
  const subcategory = subcategories.find(sub => sub.name === subcategoryKey)
  return subcategory?.label || subcategoryKey
}

// Función para buscar una categoría por subcategoría
export const findCategoryBySubcategory = (subcategoryKey) => {
  for (const [categoryKey, categoryData] of Object.entries(FILTER_CATEGORIES)) {
    const subcategory = categoryData.subcategories.find(sub => sub.name === subcategoryKey)
    if (subcategory) {
      return {
        categoryKey,
        categoryData,
        subcategory
      }
    }
  }
  return null
}