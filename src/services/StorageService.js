/**
 * Storage Service - Abstracts data persistence operations
 * Implements Dependency Inversion Principle by providing an interface for storage
 */

/**
 * Storage interface for dependency inversion
 */
class StorageInterface {
  /**
   * @param {string} key - Storage key
   * @returns {*} Stored value
   */
  get(key) {
    throw new Error('get method must be implemented');
  }

  /**
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   */
  set(key, value) {
    throw new Error('set method must be implemented');
  }

  /**
   * @param {string} key - Storage key to remove
   */
  remove(key) {
    throw new Error('remove method must be implemented');
  }

  /**
   * Clear all storage
   */
  clear() {
    throw new Error('clear method must be implemented');
  }
}

/**
 * LocalStorage implementation of StorageInterface
 */
class LocalStorageAdapter extends StorageInterface {
  /**
   * Gets value from localStorage
   * @param {string} key - Storage key
   * @returns {*} Parsed value or null
   */
  get(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from localStorage for key "${key}":`, error);
      return null;
    }
  }

  /**
   * Sets value in localStorage
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage for key "${key}":`, error);
    }
  }

  /**
   * Removes value from localStorage
   * @param {string} key - Storage key to remove
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from localStorage for key "${key}":`, error);
    }
  }

  /**
   * Clears all localStorage
   */
  clear() {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
}

/**
 * In-memory storage implementation for testing
 */
class InMemoryStorageAdapter extends StorageInterface {
  constructor() {
    super();
    this.storage = new Map();
  }

  get(key) {
    return this.storage.get(key) || null;
  }

  set(key, value) {
    this.storage.set(key, value);
  }

  remove(key) {
    this.storage.delete(key);
  }

  clear() {
    this.storage.clear();
  }
}

/**
 * Storage service that uses the injected storage adapter
 */
class StorageService {
  /**
   * @param {StorageInterface} adapter - Storage adapter to use
   */
  constructor(adapter = new LocalStorageAdapter()) {
    this.adapter = adapter;
  }

  /**
   * Gets workout plan from storage
   * @param {string} key - Storage key
   * @returns {Object|null} Workout plan or null
   */
  getWorkoutPlan(key = 'workoutPlan') {
    return this.adapter.get(key);
  }

  /**
   * Saves workout plan to storage
   * @param {Object} workoutPlan - Workout plan to save
   * @param {string} key - Storage key
   */
  saveWorkoutPlan(workoutPlan, key = 'workoutPlan') {
    this.adapter.set(key, workoutPlan);
  }

  /**
   * Removes workout plan from storage
   * @param {string} key - Storage key
   */
  removeWorkoutPlan(key = 'workoutPlan') {
    this.adapter.remove(key);
  }

  /**
   * Gets user preferences from storage
   * @param {string} key - Storage key
   * @returns {Object|null} User preferences or null
   */
  getUserPreferences(key = 'userPreferences') {
    return this.adapter.get(key);
  }

  /**
   * Saves user preferences to storage
   * @param {Object} preferences - Preferences to save
   * @param {string} key - Storage key
   */
  saveUserPreferences(preferences, key = 'userPreferences') {
    this.adapter.set(key, preferences);
  }
}

// Export singleton instance with localStorage adapter
export const storageService = new StorageService();

// Export classes for testing and custom implementations
export { StorageService, LocalStorageAdapter, InMemoryStorageAdapter, StorageInterface };