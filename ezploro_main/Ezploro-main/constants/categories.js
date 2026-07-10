export const CATEGORIES = [
  { value: 'musica', label: '🎵 Música' },
  { value: 'deportes', label: '⚽ Deportes' },
  { value: 'tecnologia', label: '💻 Tecnología' },
  { value: 'arte', label: '🎨 Arte' },
  { value: 'educacion', label: '📚 Educación' },
  { value: 'negocios', label: '💼 Negocios' },
  { value: 'gastronomia', label: '🍽️ Gastronomía' },
  { value: 'entretenimiento', label: '🎭 Entretenimiento' },
];

export const getSubcategories = (category) => {
  const subcategories = {
    musica: [
      { name: 'concierto', label: 'Concierto' },
      { name: 'festival', label: 'Festival' },
      { name: 'karaoke', label: 'Karaoke' },
    ],
    deportes: [
      { name: 'futbol', label: 'Fútbol' },
      { name: 'basketball', label: 'Basketball' },
      { name: 'running', label: 'Running' },
    ],
    tecnologia: [
      { name: 'conferencia', label: 'Conferencia' },
      { name: 'workshop', label: 'Workshop' },
      { name: 'hackathon', label: 'Hackathon' },
    ],
    arte: [
      { name: 'exposicion', label: 'Exposición' },
      { name: 'taller', label: 'Taller' },
      { name: 'performance', label: 'Performance' },
    ],
    educacion: [
      { name: 'seminario', label: 'Seminario' },
      { name: 'curso', label: 'Curso' },
      { name: 'conferencia', label: 'Conferencia' },
    ],
    negocios: [
      { name: 'networking', label: 'Networking' },
      { name: 'conferencia', label: 'Conferencia' },
      { name: 'workshop', label: 'Workshop' },
    ],
    gastronomia: [
      { name: 'degustacion', label: 'Degustación' },
      { name: 'cooking_class', label: 'Clase de Cocina' },
      { name: 'festival', label: 'Festival' },
    ],
    entretenimiento: [
      { name: 'comedia', label: 'Comedia' },
      { name: 'teatro', label: 'Teatro' },
      { name: 'cine', label: 'Cine' },
    ],
  };

  return subcategories[category] || [];
};

export const CATEGORIES_WITH_SUBCATEGORIES = {
  musica: { color: '#E91E63', icon: 'musical-notes-outline' },
  deportes: { color: '#4CAF50', icon: 'football-outline' },
  tecnologia: { color: '#2196F3', icon: 'laptop-outline' },
  arte: { color: '#9C27B0', icon: 'brush-outline' },
  educacion: { color: '#FF9800', icon: 'school-outline' },
  negocios: { color: '#607D8B', icon: 'briefcase-outline' },
  gastronomia: { color: '#FF5722', icon: 'restaurant-outline' },
  entretenimiento: { color: '#795548', icon: 'theater-outline' },
};