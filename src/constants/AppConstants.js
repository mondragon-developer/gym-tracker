/**
 * Application Constants - Centralized constant definitions
 * Follows Don't Repeat Yourself (DRY) principle
 */

/**
 * Days of the week in order
 */
export const DAYS_OF_WEEK = [
  "Monday", 
  "Tuesday", 
  "Wednesday", 
  "Thursday", 
  "Friday", 
  "Saturday", 
  "Sunday"
];

/**
 * Available muscle groups for individual selection
 */
export const INDIVIDUAL_MUSCLE_GROUPS = [
  "Rest",
  "Chest",
  "Back", 
  "Shoulders",
  "Biceps",
  "Triceps",
  "Forearms",
  "Legs",
  "Abs",
  "Cardio"
];

/**
 * Exercise status types
 */
export const EXERCISE_STATUS = {
  INCOMPLETE: 'incomplete',
  COMPLETED: 'completed',
  SKIPPED: 'skipped'
};

/**
 * Exercise type categories
 */
export const EXERCISE_TYPES = {
  STRENGTH: 'strength',
  CARDIO: 'cardio',
  FLEXIBILITY: 'flexibility'
};

/**
 * Color schemes for different muscle groups
 */
export const MUSCLE_GROUP_COLORS = {
  Rest: '#6b7280',
  Chest: '#ef4444',
  Back: '#3b82f6',
  Shoulders: '#f59e0b',
  Biceps: '#8b5cf6',
  Triceps: '#ec4899',
  Forearms: '#06b6d4',
  Legs: '#10b981',
  Abs: '#f97316',
  Cardio: '#84cc16'
};

/**
 * Application-wide theme colors
 */
export const THEME_COLORS = {
  primary: '#06b6d4',
  secondary: '#0891b2',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  light: '#f8fafc',
  dark: '#1e293b'
};

/**
 * Common border radius values
 */
export const BORDER_RADIUS = {
  small: '4px',
  medium: '8px',
  large: '12px',
  round: '50%'
};

/**
 * Common spacing values
 */
export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px'
};

/**
 * Common font sizes
 */
export const FONT_SIZES = {
  xs: '12px',
  sm: '14px',
  md: '16px',
  lg: '18px',
  xl: '20px',
  xxl: '24px'
};

/**
 * Z-index values for layering
 */
export const Z_INDEX = {
  dropdown: 100,
  modal: 1000,
  tooltip: 1100,
  overlay: 1200
};