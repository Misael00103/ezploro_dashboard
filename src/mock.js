// Mock data for dashboard

export const mockEvents = [
  {
    id: 1,
    title: "Tech Conference 2024",
    description: "Una conferencia sobre las últimas tendencias tecnológicas",
    date_time: "2024-08-15T10:00:00Z",
    location: "Centro de Convenciones",
    category: "Tecnología",
    attendees_count: 150,
    subscribers_count: 200,
    likes_count: 89,
    status: "upcoming",
    created_by: {
      id: 1,
      name: "Juan Pérez",
      email: "juan@example.com"
    },
    created_at: "2024-07-01T09:00:00Z"
  },
  {
    id: 2,
    title: "Workshop de React",
    description: "Aprende React desde cero con expertos",
    date_time: "2024-07-20T14:00:00Z",
    location: "Aula Virtual",
    category: "Educación",
    attendees_count: 75,
    subscribers_count: 120,
    likes_count: 56,
    status: "past",
    created_by: {
      id: 2,
      name: "María García",
      email: "maria@example.com"
    },
    created_at: "2024-06-15T12:00:00Z"
  },
  {
    id: 3,
    title: "Networking Empresarial",
    description: "Conecta con profesionales de tu sector",
    date_time: "2024-08-25T19:00:00Z",
    location: "Hotel Plaza",
    category: "Negocios",
    attendees_count: 300,
    subscribers_count: 450,
    likes_count: 123,
    status: "upcoming",
    created_by: {
      id: 1,
      name: "Juan Pérez",
      email: "juan@example.com"
    },
    created_at: "2024-07-10T16:00:00Z"
  }
];

export const mockContacts = [
  {
    id: 1,
    name: "Ana López",
    email: "ana@example.com",
    message: "Me interesa conocer más sobre sus eventos corporativos. ¿Podrían contactarme?",
    status: "unread",
    newsletter: true,
    created_at: "2024-07-15T10:30:00Z"
  },
  {
    id: 2,
    name: "Carlos Mendoza",
    email: "carlos@example.com",
    message: "Excelente plataforma, me gustaría saber sobre eventos de tecnología en mi ciudad.",
    status: "read",
    newsletter: false,
    created_at: "2024-07-14T15:45:00Z"
  },
  {
    id: 3,
    name: "Sofia Rivera",
    email: "sofia@example.com",
    message: "¿Ofrecen descuentos para estudiantes en sus eventos educativos?",
    status: "read",
    newsletter: true,
    created_at: "2024-07-12T09:15:00Z"
  }
];

export const mockTestimonials = [
  {
    id: 1,
    testimonio: "Scape Events ha transformado la forma en que organizamos nuestros eventos corporativos. La plataforma es intuitiva y el soporte es excepcional.",
    name_testimonio: "Roberto Silva",
    cargo_testimonio: "Director de Marketing, TechCorp",
    imagen_testimonio: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    is_active: true,
    created_at: "2024-06-20T14:00:00Z"
  },
  {
    id: 2,
    testimonio: "Como organizadora de eventos, necesitaba una herramienta que simplificara todo el proceso. Scape Events superó mis expectativas completamente.",
    name_testimonio: "Laura Martínez",
    cargo_testimonio: "Event Manager, Creativos Unidos",
    imagen_testimonio: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    is_active: true,
    created_at: "2024-06-18T11:30:00Z"
  },
  {
    id: 3,
    testimonio: "La gamificación y las estadísticas en tiempo real nos han ayudado a aumentar la participación en un 300%. Altamente recomendado.",
    name_testimonio: "Miguel Torres",
    cargo_testimonio: "CEO, Innovate Hub",
    imagen_testimonio: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    is_active: false,
    created_at: "2024-06-15T16:45:00Z"
  }
];

export const mockStats = {
  totalEvents: 1247,
  totalAttendees: 18592,
  totalUsers: 5433,
  activeUsers: 892,
  totalContacts: 234,
  unreadContacts: 12,
  totalTestimonials: 15,
  activeTestimonials: 12,
  topCategories: [
    { name: "Tecnología", count: 342 },
    { name: "Negocios", count: 289 },
    { name: "Educación", count: 201 },
    { name: "Entretenimiento", count: 156 }
  ]
};

export const mockPosts = [
  {
    id: 1,
    title: "¡Nuevo evento de tecnología próximamente!",
    description: "Estamos emocionados de anunciar nuestro próximo evento sobre inteligencia artificial y machine learning.",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=300&fit=crop",
    user_id: 2,
    user: {
      id: 2,
      name: "María García",
      email: "maria@example.com",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
    },
    likes_count: 23,
    comments_count: 8,
    created_at: "2024-07-15T14:30:00Z"
  },
  {
    id: 2,
    title: "Recap del Workshop de React",
    description: "Increíble participación en nuestro workshop de React. ¡Gracias a todos los asistentes por hacer de este evento un éxito!",
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=300&fit=crop",
    user_id: 1,
    user: {
      id: 1,
      name: "Juan Pérez",
      email: "juan@example.com",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
    },
    likes_count: 45,
    comments_count: 12,
    created_at: "2024-07-12T09:15:00Z"
  },
  {
    id: 3,
    title: "Networking exitoso en el Hotel Plaza",
    description: "Una noche increíble de networking empresarial. Nuevas conexiones y oportunidades de negocio surgieron.",
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop",
    user_id: 3,
    user: {
      id: 3,
      name: "Carlos Mendoza",
      email: "carlos@example.com",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
    },
    likes_count: 67,
    comments_count: 15,
    created_at: "2024-07-10T18:45:00Z"
  }
];

export const mockLandingPageContent = {
  hero: {
    title: "Descubre Eventos Increíbles con Scape Events",
    subtitle: "Conecta, participa y crea experiencias inolvidables en la plataforma líder de eventos sociales",
    description: "Únete a miles de usuarios que ya han encontrado su comunidad perfecta a través de nuestros eventos únicos y experiencias sociales personalizadas.",
    cta_text: "Explorar Eventos",
    background_image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1920&h=1080&fit=crop",
    is_active: true
  },
  features: {
    title: "¿Por qué elegir Scape Events?",
    subtitle: "Funcionalidades diseñadas para crear conexiones auténticas",
    features_list: [
      {
        id: 1,
        title: "Eventos Personalizados",
        description: "Descubre eventos que se adaptan a tus intereses y ubicación",
        icon: "calendar",
        is_active: true
      },
      {
        id: 2,
        title: "Comunidad Activa",
        description: "Conecta con personas que comparten tus mismas pasiones",
        icon: "users",
        is_active: true
      },
      {
        id: 3,
        title: "Gamificación",
        description: "Gana puntos y desbloquea recompensas por tu participación",
        icon: "trophy",
        is_active: true
      }
    ],
    is_active: true
  },
  about: {
    title: "Nuestra Historia",
    content: "Scape Events nació de la idea de crear conexiones reales en un mundo cada vez más digital. Desde 2023, hemos ayudado a más de 10,000 personas a encontrar su comunidad ideal a través de eventos únicos y experiencias sociales auténticas.",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop",
    is_active: true
  },
  cta: {
    title: "¿Listo para tu próxima aventura?",
    description: "Únete a nuestra comunidad y descubre eventos increíbles cerca de ti",
    button_text: "Comenzar Ahora",
    background_color: "purple",
    is_active: true
  }
};

export const mockSocialMedia = [
  {
    id: 1,
    platform: "Facebook",
    name: "facebook",
    url: "https://facebook.com/scapeevents",
    icon: "facebook",
    is_active: true,
    followers: 12500
  },
  {
    id: 2,
    platform: "Instagram",
    name: "instagram",
    url: "https://instagram.com/scapeevents",
    icon: "instagram",
    is_active: true,
    followers: 8900
  },
  {
    id: 3,
    platform: "Twitter / X",
    name: "twitter",
    url: "https://x.com/scapeevents",
    icon: "twitter",
    is_active: true,
    followers: 5400
  },
  {
    id: 4,
    platform: "LinkedIn",
    name: "linkedin",
    url: "https://linkedin.com/company/scapeevents",
    icon: "linkedin",
    is_active: true,
    followers: 3200
  },
  {
    id: 5,
    platform: "YouTube",
    name: "youtube",
    url: "https://youtube.com/@scapeevents",
    icon: "youtube",
    is_active: false,
    followers: 890
  },
  {
    id: 6,
    platform: "TikTok",
    name: "tiktok",
    url: "https://tiktok.com/@scapeevents",
    icon: "music",
    is_active: false,
    followers: 2100
  }
];

export const mockGamificationActions = [
  {
    id: 1,
    user_id: 2,
    user: {
      id: 2,
      name: "María García",
      email: "maria@example.com",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
    },
    action_name: "event_created",
    points_awarded: 50,
    event_id: 1,
    event_title: "Workshop de React",
    created_at: "2024-07-15T14:30:00Z"
  },
  {
    id: 2,
    user_id: 3,
    user: {
      id: 3,
      name: "Carlos Mendoza",
      email: "carlos@example.com",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
    },
    action_name: "event_attended",
    points_awarded: 25,
    event_id: 2,
    event_title: "Tech Conference 2024",
    created_at: "2024-07-14T09:15:00Z"
  },
  {
    id: 3,
    user_id: 4,
    user: {
      id: 4,
      name: "Ana López",
      email: "ana@example.com",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
    },
    action_name: "profile_completed",
    points_awarded: 20,
    event_id: null,
    event_title: null,
    created_at: "2024-07-13T16:45:00Z"
  }
];

export const mockPointsRules = [
  {
    id: 1,
    action_name: "event_created",
    display_name: "Crear Evento",
    points: 50,
    description: "Puntos otorgados al crear un nuevo evento",
    is_active: true,
    category: "events"
  },
  {
    id: 2,
    action_name: "event_attended",
    display_name: "Asistir a Evento",
    points: 25,
    description: "Puntos por confirmar asistencia a un evento",
    is_active: true,
    category: "events"
  },
  {
    id: 3,
    action_name: "profile_completed",
    display_name: "Perfil Completado",
    points: 20,
    description: "Puntos por completar el perfil al 100%",
    is_active: true,
    category: "profile"
  },
  {
    id: 4,
    action_name: "event_liked",
    display_name: "Like a Evento",
    points: 5,
    description: "Puntos por dar like a un evento",
    is_active: true,
    category: "engagement"
  },
  {
    id: 5,
    action_name: "comment_created",
    display_name: "Comentar Evento",
    points: 10,
    description: "Puntos por comentar en un evento",
    is_active: true,
    category: "engagement"
  },
  {
    id: 6,
    action_name: "event_shared",
    display_name: "Compartir Evento",
    points: 15,
    description: "Puntos por compartir un evento en redes sociales",
    is_active: false,
    category: "engagement"
  }
];

export const mockRewards = [
  {
    id: 1,
    name: "Descuento 10%",
    description: "10% de descuento en tu próximo evento premium",
    points_required: 100,
    is_active: true,
    times_redeemed: 23,
    category: "discounts"
  },
  {
    id: 2,
    name: "Evento VIP",
    description: "Acceso gratuito a un evento VIP de tu elección",
    points_required: 500,
    is_active: true,
    times_redeemed: 7,
    category: "events"
  },
  {
    id: 3,
    name: "Badge Especial",
    description: "Badge exclusivo 'Community Leader' en tu perfil",
    points_required: 250,
    is_active: true,
    times_redeemed: 15,
    category: "badges"
  },
  {
    id: 4,
    name: "Merchandising",
    description: "Kit de merchandising oficial de Scape Events",
    points_required: 300,
    is_active: false,
    times_redeemed: 3,
    category: "merchandise"
  }
];

export const mockUserRankings = [
  {
    rank: 1,
    user_id: 2,
    user: {
      id: 2,
      name: "María García",
      email: "maria@example.com",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
    },
    total_points: 1250,
    events_created: 8,
    events_attended: 15,
    likes_given: 45,
    comments_made: 23,
    level: "Gold",
    badges: ["Early Adopter", "Event Master", "Community Helper"]
  },
  {
    rank: 2,
    user_id: 3,
    user: {
      id: 3,
      name: "Carlos Mendoza",
      email: "carlos@example.com",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
    },
    total_points: 980,
    events_created: 5,
    events_attended: 22,
    likes_given: 67,
    comments_made: 31,
    level: "Silver",
    badges: ["Active Participant", "Social Butterfly"]
  },
  {
    rank: 3,
    user_id: 4,
    user: {
      id: 4,
      name: "Ana López",
      email: "ana@example.com",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
    },
    total_points: 756,
    events_created: 3,
    events_attended: 18,
    likes_given: 34,
    comments_made: 19,
    level: "Silver",
    badges: ["Rising Star"]
  },
  {
    rank: 4,
    user_id: 5,
    user: {
      id: 5,
      name: "Roberto Silva",
      email: "roberto@example.com",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
    },
    total_points: 543,
    events_created: 2,
    events_attended: 12,
    likes_given: 28,
    comments_made: 14,
    level: "Bronze",
    badges: ["Newcomer"]
  }
];

export const mockRedemptionHistory = [
  {
    id: 1,
    user_id: 2,
    user: {
      id: 2,
      name: "María García",
      email: "maria@example.com",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
    },
    reward_name: "Descuento 10%",
    points_redeemed: 100,
    status: "used",
    redeemed_at: "2024-07-10T14:30:00Z",
    used_at: "2024-07-12T16:00:00Z"
  },
  {
    id: 2,
    user_id: 3,
    user: {
      id: 3,
      name: "Carlos Mendoza",
      email: "carlos@example.com",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
    },
    reward_name: "Badge Especial",
    points_redeemed: 250,
    status: "active",
    redeemed_at: "2024-07-08T11:15:00Z",
    used_at: null
  }
];

export const mockUser = {
  id: 1,
  name: "Admin User",
  email: "admin@scapeevents.com",
  role: "admin",
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
};

// Mock functions to simulate API calls
export const mockLogin = async (email, password) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (email === "admin@scapeevents.com" && password === "admin123") {
        resolve({
          user: mockUser,
          token: "mock_jwt_token_12345"
        });
      } else {
        reject(new Error("Credenciales inválidas"));
      }
    }, 1000);
  });
};