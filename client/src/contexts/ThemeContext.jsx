import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * CONTEXTE POUR LA GESTION DU THÈME
 * 
 * Ici, nous stockons :
 * - theme: 'light' ou 'dark' (le thème actuel)
 * - toggleTheme: fonction pour basculer entre les thèmes
 */

// 1. Créer le contexte (la "boîte magique")
const ThemeContext = createContext();

/**
 * FOURNISSEUR DE THÈME (ThemeProvider)
 * 
 * Ce composant va "envelopper" notre application et fournir
 * les données du thème à tous ses enfants.
 * 
 * C'est comme un "distributeur" qui donne accès au thème
 * à tous les composants qui en ont besoin.
 */
export const ThemeProvider = ({ children }) => {
  // État pour stocker le thème actuel ('light' ou 'dark')
  const [theme, setTheme] = useState('dark'); // Par défaut : thème sombre

  /**
   * CHARGEMENT DE LA PRÉFÉRENCE SAUVEGARDÉE
   * 
   * useEffect se déclenche quand le composant se monte (apparaît).
   * Ici, on vérifie si l'utilisateur avait déjà choisi un thème
   * et on le restaure depuis localStorage.
   */
  useEffect(() => {
    // Récupérer la préférence sauvegardée
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
      // Si une préférence existe, l'utiliser
      setTheme(savedTheme);
    } else {
      // Sinon, détecter la préférence système de l'utilisateur
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []); // [] signifie "exécuter une seule fois au montage"

  /**
   * APPLIQUER LE THÈME AU DOCUMENT
   * 
   * Chaque fois que le thème change, on ajoute une classe CSS
   * à l'élément <html> pour appliquer les styles correspondants.
   */
  useEffect(() => {
    // Supprimer les anciennes classes de thème
    document.documentElement.classList.remove('light-theme', 'dark-theme');
    
    // Ajouter la nouvelle classe de thème
    document.documentElement.classList.add(`${theme}-theme`);
    
    // Sauvegarder la préférence
    localStorage.setItem('theme', theme);
  }, [theme]); // Se déclenche chaque fois que 'theme' change

  /**
   * FONCTION POUR BASCULER ENTRE LES THÈMES
   * 
   * Cette fonction sera appelée quand l'utilisateur clique
   * sur le bouton de basculement du thème.
   */
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  /**
   * VALEUR DU CONTEXTE
   * 
   * C'est ce qui sera accessible à tous les composants enfants.
   * On fournit le thème actuel et la fonction pour le changer.
   */
  const value = {
    theme,        // 'light' ou 'dark'
    toggleTheme,  // fonction pour basculer
    isDark: theme === 'dark',  // booléen pratique
    isLight: theme === 'light' // booléen pratique
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * HOOK PERSONNALISÉ POUR UTILISER LE THÈME
 * 
 * Au lieu d'utiliser useContext(ThemeContext) partout,
 * on crée ce hook personnalisé qui est plus pratique.
 * 
 * Usage dans un composant :
 * const { theme, toggleTheme, isDark } = useTheme();
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  // Vérifier que le hook est utilisé dans un ThemeProvider
  if (context === undefined) {
    throw new Error('useTheme doit être utilisé dans un ThemeProvider');
  }
  
  return context;
};

// Validation des props pour éviter les erreurs
ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
