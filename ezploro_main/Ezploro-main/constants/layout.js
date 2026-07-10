import { Dimensions } from 'react-native';

// Get screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Export base dimensions
export { SCREEN_WIDTH, SCREEN_HEIGHT };

// Calculate and export derived dimensions
export const CARD_WIDTH = SCREEN_WIDTH * 0.85;
export const HORIZONTAL_CARD_WIDTH = SCREEN_WIDTH * 0.85;
export const EVENT_CARD_WIDTH = SCREEN_WIDTH - 40;

// Carousel dimensions
export const CAROUSEL_ITEM_WIDTH = SCREEN_WIDTH * 0.9;
export const CAROUSEL_ITEM_HEIGHT = 200;
export const ITEM_SPACING = (SCREEN_WIDTH - (SCREEN_WIDTH * 0.9)) / 2;

// Grid dimensions
export const SMALL_CARD_GRID_WIDTH = SCREEN_WIDTH * 0.3;
export const SMALL_CARD_GRID_HEIGHT = 160;
export const SMALL_CARD_GRID_MARGIN_HORIZONTAL = 5;

// For backward compatibility
export const getLayoutConstants = () => ({
  CARD_WIDTH,
  HORIZONTAL_CARD_WIDTH,
  EVENT_CARD_WIDTH,
  CAROUSEL_ITEM_WIDTH,
  CAROUSEL_ITEM_HEIGHT,
  ITEM_SPACING,
  SMALL_CARD_GRID_WIDTH,
  SMALL_CARD_GRID_HEIGHT,
  SMALL_CARD_GRID_MARGIN_HORIZONTAL,
});

// Offer card dimensions
export const OFFER_CARD_HEIGHT = 120;
export const OFFER_CARD_MARGIN_BOTTOM = 10;

export const EVENT_CARD_HEIGHT = 280;

export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
