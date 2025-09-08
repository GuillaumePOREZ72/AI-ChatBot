import { useTheme } from "../contexts/ThemeContext";
import "./ThemeToggle.css";

/**
 * COMPOSANT BOUTON DE BASCULEMENT DU THÈME
 *
 * Ce composant affiche un bouton qui permet de basculer
 * entre le thème clair et le thème sombre.
 *
 * Il utilise notre hook personnalisé useTheme() pour :
 * - Connaître le thème actuel
 * - Appeler la fonction toggleTheme() quand on clique
 */
const ThemeToggle = () => {
  // Récupérer les données du thème depuis notre contexte
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      title={`Basculer vers le thème ${isDark ? "clair" : "sombre"}`}
      aria-label={`Basculer vers le thème ${isDark ? "clair" : "sombre"}`}
    >
      {/* 
        ICÔNES CONDITIONNELLES
        
        On affiche une icône différente selon le thème actuel :
        - Thème sombre → icône soleil (pour passer au clair)
        - Thème clair → icône lune (pour passer au sombre)
        
        C'est une convention UX : on montre ce vers quoi on va basculer
      */}
      <div className="theme-toggle-icon">
        {isDark ? (
          // Icône soleil pour passer au thème clair
          <i className="bx bx-sun" />
        ) : (
          // Icône lune pour passer au thème sombre
          <i className="bx bx-moon" />
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;
