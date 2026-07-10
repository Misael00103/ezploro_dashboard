// constants.js
export const CARD_WIDTH = 300; // Width for card components, adjust based on design
export const CARD_HEIGHT = 150; // Height for card components, adjust as needed
export const SPACING = 16; // Standard spacing for margins and padding
export const BORDER_RADIUS = 12; // Standard border radius for UI elements

// Colors (from NotificationsScreen.js)
export const COLORS = {
  background: "#000000",
  surface: "#1A1A1A",
  card: "#2A2A2A",
  text: "#FFFFFF",
  textSecondary: "#8E8E93",
  border: "#3A3A3C",
  accent: "#007AFF",
  success: "#30D158",
  warning: "#FF9F0A",
  error: "#FF453A",
};

// Notification Types (from NotificationsScreen.js)
export const NOTIFICATION_TYPES = {
  like: { icon: "heart", color: "#FF453A" },
  comment: { icon: "chatbubble", color: "#007AFF" },
  follow: { icon: "person-add", color: "#30D158" },
  event: { icon: "calendar", color: "#FF9F0A" },
  message: { icon: "mail", color: "#007AFF" },
};