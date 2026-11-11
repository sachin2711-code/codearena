/**
 * Crayon Shin-chan Design System Configuration
 * All colors, dimensions, borders, and asset lists are configured here.
 * You can tweak these values to customize the overall visual style.
 */

export const SHINCHAN_THEME = {
  colors: {
    // Primary Shinchan Signature Colors
    yellow: '#FFD93D',      // Shinchan's iconic shorts / sunny yellow
    yellowSoft: '#FFEAA7',  // Soft pastel yellow
    yellowDim: '#997300',   // Deep golden yellow for text contrast

    red: '#E63946',         // Shinchan's iconic t-shirt / tomato red
    redSoft: '#FF6B6B',     // Soft coral red
    redDark: '#C1121F',     // Dark red for borders and accents

    blue: '#8ECAE6',        // Action Kamen / sky blue
    blueDeep: '#219EBC',    // Ocean blue
    blueNavy: '#023047',    // Deep navy accent

    cream: '#FFF8E7',       // Warm sketch-paper cream (Light mode base)
    creamCard: '#FFFDF6',   // Clean card cream
    creamBorder: '#F0E6D2', // Subtle cream divider

    // Dark Mode Palette
    darkBg: '#0F1026',      // Deep comic night navy
    darkPanel: '#161836',   // Navy panel card
    darkCard: '#1D2046',    // Raised navy container
    darkBorder: '#353966',  // Navy border

    // Universal Comic Outlines & Shadows
    outline: '#2B2D42',     // Thick dark comic ink border
    shadow: '#2B2D42',      // Sticker drop shadow
    muted: '#8D99AE',       // Subdued comic text
    white: '#FFFFFF',
  },

  borders: {
    thick: '3px solid #2B2D42',
    medium: '2px solid #2B2D42',
    radiusLg: '1.25rem',    // 20px
    radiusXl: '1.75rem',    // 28px
  },

  shadows: {
    sticker: '4px 4px 0px #2B2D42',
    stickerLg: '6px 6px 0px #2B2D42',
    stickerSm: '2px 2px 0px #2B2D42',
    stickerRed: '4px 4px 0px #E63946',
    stickerYellow: '4px 4px 0px #FFD93D',
  },

  fonts: {
    heading: '"Bangers", "Patrick Hand", cursive, sans-serif',
    hand: '"Patrick Hand", cursive, sans-serif',
    body: '"Nunito", system-ui, -apple-system, sans-serif',
    mono: '"JetBrains Mono", Consolas, monospace',
  },

  /**
   * Expected images in /public/assets/sinchan/
   * If an image is not found, the app automatically falls back to clean SVG stickers.
   */
  stickerFiles: [
    'shinchan-happy.png',
    'shinchan-running.png',
    'shinchan-waving.png',
    'chocobi-box.png',
    'shiro-dog.png',
    'action-kamen.png',
    'shinchan-dance.png',
  ],
};
