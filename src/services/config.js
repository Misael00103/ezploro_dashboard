// config.js - VERSIÓN ACTUALIZADA Y COMPLETA PARA DASHBOARD

// Configuración de la API
// Base URL for the entire API (modificado para conectar al backend en la nube, con /api prefix)
const REACT_APP_API_URL = process.env.REACT_APP_API_URL || "https://api-v5-backend-ezploro.apps.ezploro.com/api";
export const BASE_URL = REACT_APP_API_URL;

// Configuración del Dashboard
export const DASHBOARD_CONFIG = {
  // Configuración de autenticación
  AUTH: {
    TOKEN_KEY: 'token',
    USER_KEY: 'user',
    USER_ID_KEY: 'userId',
    REFRESH_TOKEN_KEY: 'refreshToken',
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 horas en milisegundos
    AUTO_LOGOUT_WARNING: 5 * 60 * 1000, // 5 minutos antes del logout
  },
  
  // Configuración de la UI del Dashboard
  UI: {
    SIDEBAR_COLLAPSED_KEY: 'sidebarCollapsed',
    THEME_KEY: 'theme',
    LANGUAGE_KEY: 'language',
    ITEMS_PER_PAGE: 10,
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },
  
  // Configuración de notificaciones
  NOTIFICATIONS: {
    POSITION: 'top-right',
    DURATION: 5000,
    MAX_NOTIFICATIONS: 5,
  },
  
  // Configuración de roles y permisos
  ROLES: {
    ADMIN: 'admin',
    USER: 'user',
    MODERATOR: 'moderator',
  },
  
  // Configuración de endpoints específicos del dashboard
  ENDPOINTS: {
    DASHBOARD_STATS: '/admin/dashboard/stats',
    USER_ANALYTICS: '/admin/users/analytics',
    POST_ANALYTICS: '/admin/posts/analytics',
    SYSTEM_HEALTH: '/admin/system/health',
  }
};

// Function to ensure proper URL format
const normalizeUrl = (url) => {
  if (!url) return url
  // Fix common URL malformation issues
  return url.replace(/([^:]\/)\/+/g, "$1")
}

// Base URL for serving images (remueve trailing /api)
export const BASE_URL_IMAGE = normalizeUrl(BASE_URL.replace(/\/api\/?$/, '')) || "https://api-v5-backend-ezploro.apps.ezploro.com"

/**
 * Normaliza y formatea cualquier URL de imagen del sistema (eventos, posts, testimonios, perfil, logo)
 * @param {string} url - URL o ruta de imagen
 * @returns {string} URL formateada correctamente contra la API activa o vacía si el valor es inválido
 */
export const formatImageUrl = (url) => {
  if (!url || typeof url !== 'string') return '';

  const trimmed = url.trim();
  const lower = trimmed.toLowerCase();
  
  // Sanitización de cadenas dummy por defecto en Swagger/Backend o valores nulos en string
  if (
    !trimmed || 
    lower === 'string' || 
    lower === 'null' || 
    lower === 'undefined' || 
    lower === 'none'
  ) {
    return '';
  }

  // Previsualizaciones locales
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  // Corregir protocolo HTTP -> HTTPS para evitar bloqueos por Contenido Mixto en producción
  let cleanUrl = trimmed;
  if (cleanUrl.startsWith('http://api-v5-backend-ezploro.apps.ezploro.com')) {
    cleanUrl = cleanUrl.replace('http://', 'https://');
  } else if (
    typeof window !== 'undefined' && 
    window.location && 
    window.location.protocol === 'https:' && 
    cleanUrl.startsWith('http://')
  ) {
    cleanUrl = cleanUrl.replace('http://', 'https://');
  }

  // Rutas que contienen /uploads/
  if (cleanUrl.includes('/uploads/')) {
    const uploadPath = cleanUrl.substring(cleanUrl.indexOf('/uploads/'));
    return `${BASE_URL_IMAGE}${uploadPath}`;
  }

  if (cleanUrl.startsWith('uploads/')) {
    return `${BASE_URL_IMAGE}/${cleanUrl}`;
  }

  // URLs absolutas externas o guardadas con dominios del backend
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    if (cleanUrl.includes('localhost:3000') || cleanUrl.includes('apps.ezploro.com')) {
      const path = cleanUrl.replace(/^https?:\/\/[^\/]+/, '');
      return `${BASE_URL_IMAGE}${path}`;
    }
    return cleanUrl;
  }

  if (cleanUrl.startsWith('/')) {
    return `${BASE_URL_IMAGE}${cleanUrl}`;
  }

  return `${BASE_URL_IMAGE}/${cleanUrl}`;
};

// Base URL for socket connection (without /api) - Fixed URL construction
export const SOCKET_URL = normalizeUrl(BASE_URL.replace('/api', ''))

// Debug logging (remove in production)
console.log('🔧 Config Debug:', {
  REACT_APP_API_URL,
  BASE_URL,
  BASE_URL_IMAGE,
  SOCKET_URL
})

// ==================== AUTENTICACIÓN (SESION) ====================
export const API_URL_AUTH = `${BASE_URL}/auth`
export const API_URL_AUTH_REGISTER = `${API_URL_AUTH}/register`
export const API_URL_AUTH_LOGIN = `${API_URL_AUTH}/login`
export const API_URL_AUTH_LOGOUT = `${API_URL_AUTH}/logout`
export const API_URL_AUTH_GOOGLE = `${API_URL_AUTH}/google`
export const API_URL_AUTH_GOOGLE_EXPO = `${API_URL_AUTH}/google-expo`
export const API_URL_AUTH_GOOGLE_SIGNIN = `${API_URL_AUTH}/google-signin`

// ==================== USUARIOS ====================
export const API_URL_USERS = `${BASE_URL}/users`
export const API_URL_USER_PREFERENCES = `${BASE_URL}/user/preferences`
export const API_URL_USER_SECURITY_SETTINGS = `${BASE_URL}/user/security-settings`
export const API_URL_USERS_LIST = `${API_URL_USERS}`
export const API_URL_USERS_BY_ID = `${API_URL_USERS}/:userId`
export const API_URL_USERS_UPDATE = `${API_URL_USERS}/update/:userId`
export const API_URL_USERS_SEARCH_BY_NAME = `${API_URL_USERS}/search/:query`
export const API_URL_USERS_SEARCH_BY_QUERY = `${API_URL_USERS}/search`
export const API_URL_USERS_ACTIVE = `${API_URL_USERS}/active`
export const API_URL_USERS_EVENTS_CREATED = `${API_URL_USERS}/events/:userId`
export const API_URL_USERS_SUBSCRIBED_EVENTS = `${API_URL_USERS}/subscribed/:userId`
export const API_URL_USERS_UPLOAD_IMAGE = `${API_URL_USERS}/upload-image`
export const API_URL_USERS_COMMENTS = `${API_URL_USERS}/comments/:userId`
export const API_URL_USERS_PROFILE_BY_ID = `${API_URL_USERS}/profile/:userId`
export const API_URL_USERS_ME = `${API_URL_USERS}/me`
export const API_URL_USERS_BOOKMARKS = `${API_URL_USERS}/:userId/bookmarks`

// ==================== EVENTOS ====================
export const API_URL_EVENTS = `${BASE_URL}/events`
export const API_URL_EVENTS_LIST = `${API_URL_EVENTS}`
export const API_URL_EVENTS_CREATE = `${API_URL_EVENTS}`
export const API_URL_EVENTS_BY_ID = `${API_URL_EVENTS}/:id`
export const API_URL_EVENTS_UPDATE = `${API_URL_EVENTS}/:id`
export const API_URL_EVENTS_DELETE = `${API_URL_EVENTS}/:id`
export const API_URL_EVENTS_FILTER_STATUS = `${API_URL_EVENTS}/filter/status`
export const API_URL_EVENTS_THIS_WEEK = `${API_URL_EVENTS}/this-week`
export const API_URL_EVENTS_RECOMMENDATIONS = `${API_URL_EVENTS}/recommendations/:user_id`
export const API_URL_EVENTS_BY_LIKES = `${API_URL_EVENTS}/by-likes`
export const API_URL_EVENTS_CONFIRM_ATTENDANCE = `${API_URL_EVENTS}/:id/attendees`
export const API_URL_EVENTS_ATTENDEES = `${API_URL_EVENTS}/:id/attendees`
export const API_URL_EVENTS_INSIGHTS = `${API_URL_EVENTS}/:id/insights`
export const API_URL_EVENTS_SUBSCRIBERS = `${API_URL_EVENTS}/:id/subscribers`

// ==================== EVENT LIKES ====================
// URLs corregidas según tu backend real
export const API_URL_LIKES_USER = `${BASE_URL}/likes/:userId` // GET /api/likes/:userId
export const API_URL_EVENT_LIKES_BY_USER = `${BASE_URL}/likes/:user_id/events` // GET /api/likes/:userId/events
export const API_URL_EVENT_LIKES_TOGGLE = `${BASE_URL}/event-likes/toggle` // POST /api/event-likes/toggle
export const API_URL_EVENT_LIKES_COUNT = `${BASE_URL}/event-likes/:event_id/count` // GET /api/event-likes/:event_id/count
export const API_URL_EVENT_LIKES_STATUS = `${BASE_URL}/event-likes/:event_id/:user_id` // GET /api/event-likes/:event_id/:user_id
export const API_URL_EVENT_LIKES = `${BASE_URL}/event-likes`

// ==================== EVENT SUBSCRIPTIONS ====================
// Usar solo endpoints que existen en tu backend
export const API_URL_EVENT_SUBSCRIPTIONS = `${BASE_URL}/event-subscriptions`
export const API_URL_EVENT_SUBSCRIPTIONS_TOGGLE = `${API_URL_EVENT_SUBSCRIPTIONS}` // POST /api/event-subscriptions - para toggle
export const API_URL_EVENT_SUBSCRIPTIONS_LIST = `${API_URL_EVENTS}/:event_id/subscribers` // GET /api/events/:id/subscribers - si existe
export const API_URL_EVENT_SUBSCRIPTIONS_BY_USER = `${API_URL_EVENT_SUBSCRIPTIONS}/:user_id`
export const API_URL_EVENT_SUBSCRIPTIONS_COUNT = `${API_URL_EVENT_SUBSCRIPTIONS}/count/:event_id`
export const API_URL_EVENT_SUBSCRIPTIONS_CHECK = `${API_URL_EVENT_SUBSCRIPTIONS}/:event_id/:user_id`
export const API_URL_EVENT_SUBSCRIPTIONS_TOGGLE_ALT = `${API_URL_EVENT_SUBSCRIPTIONS}/toggle`
export const API_URL_EVENT_SUBSCRIPTIONS_COUNT_ALT = `${API_URL_EVENT_SUBSCRIPTIONS}/:event_id/count`

// ==================== BOOKMARKS ====================
export const API_URL_BOOKMARKS = `${BASE_URL}/bookmarks`
export const API_URL_BOOKMARKS_TOGGLE = `${API_URL_BOOKMARKS}` // POST for add/remove toggle
export const API_URL_BOOKMARKS_REMOVE = `${API_URL_BOOKMARKS}` // DELETE
export const API_URL_BOOKMARKS_LIST = `${API_URL_BOOKMARKS}` // GET
export const API_URL_BOOKMARKS_LIST_USER_EVENTS = `${API_URL_BOOKMARKS}/users/:userId/bookmarks/events`
export const API_URL_BOOKMARKS_BY_USER = `${API_URL_BOOKMARKS}/:userId`

// ==================== PRIVATE MESSAGES ====================
export const API_URL_PRIVATE_MESSAGES = `${BASE_URL}/private-messages`
export const API_URL_PRIVATE_MESSAGES_USER_CHATS = `${API_URL_PRIVATE_MESSAGES}/user/:userId`
export const API_URL_PRIVATE_MESSAGES_CHAT_USER = `${API_URL_PRIVATE_MESSAGES}/chat-user/:userId`
export const API_URL_PRIVATE_MESSAGES_CREATE = `${API_URL_PRIVATE_MESSAGES}/create`
export const API_URL_PRIVATE_MESSAGES_CONVERSATION = `${API_URL_PRIVATE_MESSAGES}/:senderId/:receiverId`

// ==================== EVENT MESSAGES ====================
export const API_URL_EVENT_MESSAGES = `${BASE_URL}/event-messages`
export const API_URL_EVENT_MESSAGES_BY_EVENT_ID = `${API_URL_EVENT_MESSAGES}/:eventId`
export const API_URL_EVENT_MESSAGES_CREATE = `${API_URL_EVENT_MESSAGES}/create-message`
export const API_URL_EVENT_MESSAGES_WEBSOCKET_STATUS = `${API_URL_EVENT_MESSAGES}/websocket/status`
export const API_URL_EVENT_MESSAGES_JOIN_CHAT = `${API_URL_EVENT_MESSAGES}/events/:eventId/join-chat`

// ==================== COMMENTS ====================
export const API_URL_COMMENTS = `${BASE_URL}/comments`
export const API_URL_EVENT_COMMENTS = `${BASE_URL}/events/:event_id/comments` // GET/POST for event comments
export const API_URL_EVENT_COMMENTS_CREATE = `${BASE_URL}/events/:event_id/comments`
export const API_URL_COMMENTS_UPDATE = `${API_URL_COMMENTS}/:id`
export const API_URL_COMMENTS_DELETE = `${API_URL_COMMENTS}/:id`

// ==================== COMMENT REPLIES ====================
export const API_URL_COMMENT_REPLIES = `${API_URL_COMMENTS}/:eventId/replies/:commentId`
export const API_URL_COMMENT_REPLIES_CREATE = `${API_URL_COMMENTS}/reply`

// ==================== CONTACT ====================
export const API_URL_CONTACT = `${BASE_URL}/contact`
export const API_URL_CONTACT_CREATE = `${API_URL_CONTACT}`
export const API_URL_CONTACT_LIST = `${API_URL_CONTACT}`
export const API_URL_CONTACT_UPDATE_STATUS = `${API_URL_CONTACT}/:id/status`
export const API_URL_NEWSLETTER_STATS = `${API_URL_CONTACT}/newsletter/stats`

// ==================== FOLLOW ====================
export const API_URL_FOLLOW = `${BASE_URL}/follow`
export const API_URL_FOLLOW_CREATE = `${API_URL_FOLLOW}` // POST
export const API_URL_FOLLOW_FOLLOW = `${API_URL_FOLLOW}` // POST - Alias for consistency
export const API_URL_FOLLOW_UNFOLLOW = `${API_URL_FOLLOW}/:followedId`
export const API_URL_FOLLOW_FOLLOWING_COUNT = `${API_URL_FOLLOW}/following-count/:userId`
export const API_URL_FOLLOW_FOLLOWERS_COUNT = `${API_URL_FOLLOW}/followers-count/:userId`
export const API_URL_FOLLOW_STATUS = `${API_URL_FOLLOW}/status/:followedId`

// ==================== FRIEND REQUESTS ====================
export const API_URL_FRIEND_REQUEST = `${BASE_URL}/friend-request`
export const API_URL_FRIEND_REQUEST_TOGGLE = `${API_URL_FRIEND_REQUEST}/toggle`
export const API_URL_FRIEND_REQUEST_RECEIVED = `${API_URL_FRIEND_REQUEST}/received`
export const API_URL_FRIEND_REQUEST_SENT = `${API_URL_FRIEND_REQUEST}/sent`
export const API_URL_FRIEND_REQUEST_ACCEPT = `${API_URL_FRIEND_REQUEST}/accept`

// ==================== GAMIFICATION ====================
export const API_URL_GAMIFICATION = `${BASE_URL}/gamification`
export const API_URL_GAMIFICATION_ACTION = `${API_URL_GAMIFICATION}/action`
export const API_URL_GAMIFICATION_POINTS = `${API_URL_GAMIFICATION}/points/:user_id`
export const API_URL_GAMIFICATION_REDEEM = `${API_URL_GAMIFICATION}/redeem`
export const API_URL_GAMIFICATION_HISTORY = `${API_URL_GAMIFICATION}/history/:user_id`
export const API_URL_RULES = `${BASE_URL}/rules`

// ==================== POINTS ====================
export const API_URL_POINTS = `${BASE_URL}/points`
export const API_URL_POINTS_ACTIONS = `${API_URL_POINTS}/actions/:userId`
export const API_URL_POINTS_CLAIM = `${API_URL_POINTS}/actions/:actionId/claim/:userId`
export const API_URL_POINTS_TRANSACTIONS = `${API_URL_POINTS}/transactions/claimed/:userId`

// ==================== GROUP CHAT ====================
export const API_URL_GROUP_CHAT = `${BASE_URL}/groups`
export const API_URL_GROUP_CHAT_CREATE = `${BASE_URL}/create/groups` // Manteniendo el path del list, aunque parece inconsistente; considera revisar si es typo y debería ser /groups
export const API_URL_GROUP_CHAT_UPDATE = `${API_URL_GROUP_CHAT}/:groupId`
export const API_URL_GROUP_CHAT_DELETE = `${API_URL_GROUP_CHAT}/:groupId`
export const API_URL_GROUP_CHAT_ADD_PERSON = `${API_URL_GROUP_CHAT}/:groupId/add-person`
export const API_URL_GROUP_CHAT_REMOVE_PERSON = `${API_URL_GROUP_CHAT}/:groupId/remove-person`
export const API_URL_GROUP_CHAT_JOIN = `${API_URL_GROUP_CHAT}/:groupId/join`
export const API_URL_GROUP_CHAT_MESSAGES_SEND = `${API_URL_GROUP_CHAT}/:groupId/messages`
export const API_URL_GROUP_CHAT_MESSAGES_GET = `${API_URL_GROUP_CHAT}/:groupId/messages`

// ==================== LIKES ====================
export const API_URL_LIKES = `${BASE_URL}/likes`
export const API_URL_LIKES_BY_USER = `${API_URL_LIKES}/:userId`
export const API_URL_LIKES_EVENTS_BY_USER = `${API_URL_LIKES}/:userId/events`

// ==================== PASSWORD RESET ====================
export const API_URL_PASSWORD_RESET_REQUEST = `${BASE_URL}/auth/forgot-password`
export const API_URL_PASSWORD_RESET_CONFIRM = `${BASE_URL}/auth/confirm-pin`
export const API_URL_PASSWORD_RESET_COMPLETE = `${BASE_URL}/auth/reset-password`
export const API_URL_PASSWORD_CHANGE = `${BASE_URL}/auth/change-password`

// ==================== RANKINGS ====================
export const API_URL_RANKINGS = `${BASE_URL}/ranking`
export const API_URL_RANKINGS_USUARIOS_MAS_SUSCRITOS = `${API_URL_RANKINGS}/usuarios-mas-suscritos`
export const API_URL_RANKINGS_USUARIOS_MAS_PUNTOS = `${API_URL_RANKINGS}/points-rank`
export const API_URL_RANKINGS_USUARIOS_MAS_LIKES_DADOS = `${API_URL_RANKINGS}/usuarios-mas-likes-dados`
export const API_URL_RANKINGS_USUARIOS_MAS_COMENTARIOS = `${API_URL_RANKINGS}/usuarios-mas-comentarios`
export const API_URL_RANKINGS_USUARIOS_MAS_EVENTOS_CREADOS = `${API_URL_RANKINGS}/usuarios-mas-eventos-creados`
export const API_URL_RANKINGS_EVENTOS_MAS_SUSCRITOS = `${API_URL_RANKINGS}/eventos-mas-suscritos`
export const API_URL_RANKINGS_EVENTOS_MAS_LIKES = `${API_URL_RANKINGS}/eventos-mas-likes`

// ==================== TESTIMONIALS ====================
export const API_URL_TESTIMONIALS = `${BASE_URL}/testimonial`
export const API_URL_TESTIMONIALS_CREATE = `${API_URL_TESTIMONIALS}`
export const API_URL_TESTIMONIALS_LIST = `${API_URL_TESTIMONIALS}`
export const API_URL_TESTIMONIALS_BY_ID = `${API_URL_TESTIMONIALS}/:id`
export const API_URL_TESTIMONIALS_UPDATE = `${API_URL_TESTIMONIALS}/:id`
export const API_URL_TESTIMONIALS_DELETE = `${API_URL_TESTIMONIALS}/:id`

// ==================== USER BLOCKS ====================
export const API_URL_USER_BLOCK = `${BASE_URL}/user-block` // POST for block
export const API_URL_USER_UNLOCK = `${BASE_URL}/unlock` // POST for unblock (corrigiendo nombre para claridad)
export const API_URL_USER_BLOCKED_LIST = `${BASE_URL}/user/:user_id` // GET blocked users
export const API_URL_USER_BLOCK_CHECK = `${BASE_URL}/check` // GET check if blocked

// ==================== USER REPORTS ====================
export const API_URL_USER_REPORTS = `${BASE_URL}/user-reports`
export const API_URL_USER_REPORTS_CREATE = `${API_URL_USER_REPORTS}`
export const API_URL_USER_REPORTS_LIST = `${API_URL_USER_REPORTS}`
export const API_URL_USER_REPORTS_UPDATE_STATUS = `${API_URL_USER_REPORTS}/:id/status`
export const API_URL_USER_REPORTS_STATS = `${API_URL_USER_REPORTS}/stats`

// ==================== VIEW COUNTERS ====================
export const API_URL_VIEW_COUNTERS = `${BASE_URL}/views`
export const API_URL_VIEW_COUNTERS_REGISTER = `${API_URL_VIEW_COUNTERS}` // POST
export const API_URL_VIEW_COUNTERS_COUNT = `${API_URL_VIEW_COUNTERS}/:object_type/:object_id/count`
export const API_URL_VIEW_COUNTERS_STATS = `${API_URL_VIEW_COUNTERS}/:object_type/:object_id/stats`
export const API_URL_VIEW_COUNTERS_EVENT_REGISTER = `${API_URL_VIEW_COUNTERS}/events/:event_id`
export const API_URL_VIEW_COUNTERS_EVENT_COUNT = `${API_URL_VIEW_COUNTERS}/events/:event_id/count`
export const API_URL_VIEW_COUNTERS_EVENT_STATS = `${API_URL_VIEW_COUNTERS}/events/:event_id/stats`

// ==================== ADMIN ====================
export const API_URL_ADMIN = `${BASE_URL}/admin`
export const API_URL_ADMIN_SYNC_FIREBASE_USERS = `${API_URL_ADMIN}/sync-firebase-users`

// ==================== LOCATIONS ====================
export const API_URL_LOCATIONS = `${BASE_URL}/locations`

// ==================== NOTIFICATIONS ====================
export const API_URL_NOTIFICATIONS = `${BASE_URL}/notifications` // Corregido: quitando /api extra asumiendo typo en list
export const API_URL_NOTIFICATIONS_REGISTER_DEVICE = `${API_URL_NOTIFICATIONS}/register-device`
export const API_URL_NOTIFICATIONS_SEND = `${API_URL_NOTIFICATIONS}/send`
export const API_URL_NOTIFICATIONS_LIST = `${API_URL_NOTIFICATIONS}`
export const API_URL_NOTIFICATIONS_MARK_READ = `${API_URL_NOTIFICATIONS}/:id/read`
export const API_URL_NOTIFICATIONS_MARK_ALL_READ = `${API_URL_NOTIFICATIONS}/read-all`
export const API_URL_NOTIFICATIONS_PREFERENCES_UPDATE = `${API_URL_NOTIFICATIONS}/preferences` // PUT
export const API_URL_NOTIFICATIONS_PREFERENCES = `${API_URL_NOTIFICATIONS}/preferences` // GET
export const API_URL_NOTIFICATIONS_BROADCAST = `${API_URL_NOTIFICATIONS}/broadcast`
export const API_URL_NOTIFICATIONS_DEVICE_DELETE = `${API_URL_NOTIFICATIONS}/device/:token`
export const API_URL_NOTIFICATIONS_STATS = `${API_URL_NOTIFICATIONS}/stats`

// ==================== POSTS ====================
export const API_URL_POSTS = `${BASE_URL}/posts`
export const API_URL_POSTS_CREATE = `${API_URL_POSTS}` // POST /api/posts
export const API_URL_POSTS_UPDATE = `${API_URL_POSTS}/:postId` // PUT /api/posts/:postId
export const API_URL_POSTS_DELETE = `${API_URL_POSTS}/:postId` // DELETE /api/posts/:postId
export const API_URL_POSTS_BY_USER = `${API_URL_POSTS}/user/:userId` // GET /api/posts/user/:userId
export const API_URL_POSTS_ALL = `${API_URL_POSTS}/all-posts` // GET /api/posts/all-posts (admin only)

// ==================== POST COMMENTS ====================
export const API_URL_POST_COMMENTS = `${API_URL_POSTS}/comments` // Base para comentarios de posts
export const API_URL_POST_COMMENTS_CREATE = `${API_URL_POST_COMMENTS}` // POST /api/posts/comments
export const API_URL_POST_COMMENTS_BY_POST = `${API_URL_POST_COMMENTS}/:postId` // GET /api/posts/comments/:postId
export const API_URL_POST_COMMENTS_UPDATE = `${API_URL_POST_COMMENTS}/:commentId` // PUT /api/posts/comments/:commentId
export const API_URL_POST_COMMENTS_DELETE = `${API_URL_POST_COMMENTS}/:commentId` // DELETE /api/posts/comments/:commentId

// ==================== POST REPLY COMMENTS ====================
export const API_URL_POST_REPLIES = `${API_URL_POSTS}/replies` // POST /api/posts/replies
export const API_URL_POST_REPLIES_BY_COMMENT = `${API_URL_POST_REPLIES}/comment/:comment_post_id` // GET /api/posts/replies/comment/:comment_post_id
export const API_URL_POST_REPLIES_UPDATE = `${API_URL_POST_REPLIES}/:reply_id` // PUT /api/posts/replies/:reply_id
export const API_URL_POST_REPLIES_DELETE = `${API_URL_POST_REPLIES}/:reply_id` // DELETE /api/posts/replies/:reply_id
export const API_URL_POST_REPLIES_COUNT = `${API_URL_POST_REPLIES}/comment/:comment_post_id/count` // GET /api/posts/replies/comment/:comment_post_id/count

// ==================== POST LIKES ====================
export const API_URL_POST_LIKES_TOGGLE = `${API_URL_POSTS}/likes/toggle` // POST /api/posts/likes/toggle
export const API_URL_POST_LIKES_BY_POST = `${API_URL_POSTS}/:postId/likes` // GET /api/posts/:postId/likes
export const API_URL_POST_LIKES_COUNT = `${API_URL_POSTS}/:postId/likes/count` // Para obtener solo el conteo

// ==================== TOOLS ====================
export const API_URL_TOOLS = `${BASE_URL}/tools`

// ==================== OFFERS ====================
// El router está montado en /api/offer y las rutas son /rewards/offers
export const API_URL_OFFERS = `${BASE_URL}/offer/rewards/offers`
export const API_URL_OFFERS_CREATE = `${API_URL_OFFERS}` // POST /api/offer/rewards/offers
export const API_URL_OFFERS_LIST = `${API_URL_OFFERS}/all` // GET /api/offer/rewards/offers/all
export const API_URL_OFFERS_ACTIVE = `${API_URL_OFFERS}` // GET /api/offer/rewards/offers (getAvailableOffers)
export const API_URL_OFFERS_STATS = `${BASE_URL}/offer/rewards/stats` // GET /api/offer/rewards/stats
export const API_URL_OFFERS_PROMO_VALIDATE = `${API_URL_OFFERS}/promo/:promo_code/validate`
export const API_URL_OFFERS_PROMO_USE = `${API_URL_OFFERS}/promo/:promo_code/use`
export const API_URL_OFFERS_BY_ID = `${API_URL_OFFERS}/:id`
export const API_URL_OFFERS_UPDATE = `${API_URL_OFFERS}/:offerId` // PUT /api/offer/rewards/offers/:offerId
export const API_URL_OFFERS_DELETE = `${API_URL_OFFERS}/:offerId` // DELETE /api/offer/rewards/offers/:offerId
export const API_URL_OFFERS_TOGGLE_STATUS = `${API_URL_OFFERS}/:id/toggle-status`
export const API_URL_OFFERS_REDEEM = `${API_URL_OFFERS}/redeem/:offerId` // POST /api/offer/rewards/offers/redeem/:offerId
export const API_URL_OFFERS_MY_REDEMPTIONS = `${BASE_URL}/offer/rewards/my-redemptions` // GET /api/offer/rewards/my-redemptions
export const API_URL_OFFERS_VERIFY_CODE = `${BASE_URL}/offer/rewards/verify-code` // POST /api/offer/rewards/verify-code
export const API_URL_OFFERS_USE_CODE = `${BASE_URL}/offer/rewards/use-code` // POST /api/offer/rewards/use-code

// Configuración adicional
export const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_PLACES_API_KEY || "";

// Google Places API endpoints (proxy through backend)
export const API_URL_PLACES_AUTOCOMPLETE = `${BASE_URL}/places/autocomplete`
export const API_URL_PLACES_DETAILS = `${BASE_URL}/places/details`
export const API_URL_PLACES_GEOCODE = `${BASE_URL}/places/geocode`

// ==================== SOCIAL NETWORKS ====================
// El router está montado en /api directamente, no en /api/social-networks
export const API_URL_SOCIAL_NETWORKS = `${BASE_URL}`
export const API_URL_SOCIAL_NETWORKS_ALL = `${API_URL_SOCIAL_NETWORKS}/all-networks`
export const API_URL_SOCIAL_NETWORKS_ACTIVE = `${API_URL_SOCIAL_NETWORKS}/active-networks`
export const API_URL_SOCIAL_NETWORKS_TOTAL_FOLLOWERS = `${API_URL_SOCIAL_NETWORKS}/total-network-followers`
export const API_URL_SOCIAL_NETWORKS_BY_ID = `${API_URL_SOCIAL_NETWORKS}/network/:id`
export const API_URL_SOCIAL_NETWORKS_CREATE = `${API_URL_SOCIAL_NETWORKS}/network/`
export const API_URL_SOCIAL_NETWORKS_UPDATE = `${API_URL_SOCIAL_NETWORKS}/network/:id`
export const API_URL_SOCIAL_NETWORKS_TOGGLE = `${API_URL_SOCIAL_NETWORKS}/network/:id/toggle`
export const API_URL_SOCIAL_NETWORKS_DELETE = `${API_URL_SOCIAL_NETWORKS}/network/:id`
export const API_URL_SOCIAL_NETWORKS_COUNT = `${API_URL_SOCIAL_NETWORKS}/count/:plataforma`

// ==================== MISSING API URLS ====================
export const API_URL_CONTACTS = `${BASE_URL}/contact`
export const API_URL_CONTACTS_REPLY = `${BASE_URL}/contact/messages`
export const API_URL_CONTACTS_LIST = `${BASE_URL}/contact-us/messages`
export const API_URL_SOCIAL_MEDIA = `${BASE_URL}/social-media` // Mantener por compatibilidad
export const API_URL_LANDING_PAGE = `${BASE_URL}/landing-page`

// ==================== PUBLICIDAD & ANUNCIOS ====================
export const API_URL_ADS = `${BASE_URL}/ads`
export const API_URL_ADS_LIST = `${API_URL_ADS}/all`
export const API_URL_ADS_CREATE = `${API_URL_ADS}`
export const API_URL_ADS_BY_ID = `${API_URL_ADS}/:id`
export const API_URL_ADS_STATS = `${API_URL_ADS}/stats`
export const API_URL_ADS_TOGGLE_STATUS = `${API_URL_ADS}/:id/toggle-status`

// ==================== PREMIOS DIARIOS (COFRES) ====================
export const API_URL_DAILY_REWARDS = `${BASE_URL}/daily-rewards`
export const API_URL_DAILY_REWARDS_CONFIG = `${API_URL_DAILY_REWARDS}/config`
export const API_URL_DAILY_REWARDS_CLAIM = `${API_URL_DAILY_REWARDS}/claim`
export const API_URL_DAILY_REWARDS_HISTORY = `${API_URL_DAILY_REWARDS}/history`

// ==================== RACHAS (STREAKS) ====================
export const API_URL_STREAKS = `${BASE_URL}/streaks`
export const API_URL_STREAKS_CONFIG = `${API_URL_STREAKS}/config`
export const API_URL_STREAKS_USER = `${API_URL_STREAKS}/user/:userId`

// ==================== PERFIL & PASS VIP ====================
export const API_URL_VIP_PASS = `${BASE_URL}/vip-pass`
export const API_URL_VIP_PASS_LEVELS = `${API_URL_VIP_PASS}/levels`
export const API_URL_VIP_PASS_CONFIG = `${API_URL_VIP_PASS}/config`

// ==================== PROMOCIONES & CATEGORÍAS ====================
export const API_URL_PROMOTIONS_CATEGORIES = `${BASE_URL}/promotions/categories`

// ==================== GAMIFICATION MATRIX ENDPOINTS ====================
export const API_URL_GAMIFICATION_VIP_PASS = `${BASE_URL}/gamification/vip-pass`
export const API_URL_GAMIFICATION_VIP_LEVELS = `${BASE_URL}/gamification/vip-levels`
export const API_URL_GAMIFICATION_REWARDED_AD = `${BASE_URL}/gamification/rewarded-ad`
export const API_URL_GAMIFICATION_CLAIM_REWARDED_AD = `${BASE_URL}/gamification/claim-rewarded-ad`
export const API_URL_GAMIFICATION_DAILY_PRIZE = `${BASE_URL}/gamification/daily-prize`
export const API_URL_GAMIFICATION_CLAIM_DAILY_PRIZE = `${BASE_URL}/gamification/claim-daily-prize`
export const API_URL_GAMIFICATION_DAILY_PRIZE_CONFIG = `${BASE_URL}/gamification/daily-prize-config`
export const API_URL_GAMIFICATION_DAILY_STREAK = `${BASE_URL}/gamification/daily-streak`
export const API_URL_GAMIFICATION_CHECK_IN = `${BASE_URL}/gamification/check-in`
