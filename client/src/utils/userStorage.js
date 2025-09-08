/**
 * Utilitaire pour gérer le stockage localStorage par utilisateur
 * Chaque utilisateur aura ses propres données isolées
 */

/**
 * Génère une clé de stockage préfixée par l'ID utilisateur
 * @param {string} userId - ID de l'utilisateur Clerk
 * @param {string} key - Clé de base (ex: 'chats', 'settings')
 * @returns {string} Clé préfixée (ex: 'user_123_chats')
 */
export const getUserStorageKey = (userId, key) => {
  if (!userId) {
    console.warn('getUserStorageKey: userId is null or undefined');
    return `temp_${key}`; // Clé temporaire si pas d'utilisateur
  }
  return `user_${userId}_${key}`;
};

/**
 * Sauvegarde des données pour un utilisateur spécifique
 * @param {string} userId - ID de l'utilisateur
 * @param {string} key - Clé de stockage
 * @param {any} data - Données à sauvegarder
 */
export const setUserData = (userId, key, data) => {
  try {
    const storageKey = getUserStorageKey(userId, key);
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving user data:', error);
  }
};

/**
 * Récupération des données pour un utilisateur spécifique
 * @param {string} userId - ID de l'utilisateur
 * @param {string} key - Clé de stockage
 * @param {any} defaultValue - Valeur par défaut si aucune donnée
 * @returns {any} Données récupérées ou valeur par défaut
 */
export const getUserData = (userId, key, defaultValue = null) => {
  try {
    const storageKey = getUserStorageKey(userId, key);
    const data = localStorage.getItem(storageKey);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error('Error getting user data:', error);
    return defaultValue;
  }
};

/**
 * Suppression d'une donnée pour un utilisateur spécifique
 * @param {string} userId - ID de l'utilisateur
 * @param {string} key - Clé de stockage
 */
export const removeUserData = (userId, key) => {
  try {
    const storageKey = getUserStorageKey(userId, key);
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error('Error removing user data:', error);
  }
};

/**
 * Migration des données existantes vers le nouveau système
 * @param {string} userId - ID de l'utilisateur actuel
 */
export const migrateExistingData = (userId) => {
  try {
    // Migrer les chats existants
    const existingChats = localStorage.getItem('chats');
    if (existingChats && !getUserData(userId, 'chats')) {
      const chats = JSON.parse(existingChats);
      setUserData(userId, 'chats', chats);
      
      // Migrer les messages de chaque chat
      chats.forEach(chat => {
        const existingMessages = localStorage.getItem(chat.id);
        if (existingMessages) {
          setUserData(userId, `chat_${chat.id}`, JSON.parse(existingMessages));
          localStorage.removeItem(chat.id); // Nettoyer l'ancienne clé
        }
      });
      
      localStorage.removeItem('chats'); // Nettoyer l'ancienne clé
      console.log('Migration completed for user:', userId);
    }
  } catch (error) {
    console.error('Error during migration:', error);
  }
};

/**
 * Nettoie toutes les données d'un utilisateur (utile pour la déconnexion)
 * @param {string} userId - ID de l'utilisateur
 */
export const clearUserData = (userId) => {
  try {
    const keys = Object.keys(localStorage);
    const userPrefix = `user_${userId}_`;
    
    keys.forEach(key => {
      if (key.startsWith(userPrefix)) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('User data cleared for:', userId);
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
};
