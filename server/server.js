/**
 * SERVEUR PRINCIPAL - AI CHATBOT BACKEND
 *
 * Ce serveur Express gère :
 * - L'authentification avec Clerk
 * - Les appels à l'API Gemini (sécurisés)
 * - La persistance des conversations en base
 * - Les API REST pour le frontend
 */

// === IMPORTS ===
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

// Charger les variables d'environnement
dotenv.config();

// === CONFIGURATION ===
const app = express();
const PORT = process.env.PORT || 5000;

// === MIDDLEWARE GLOBAL ===

// CORS - Autoriser les requêtes depuis le frontend
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-clerk-auth-token"],
  })
);

// Parser JSON
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Logging des requêtes (simple)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// === CONNEXION À LA BASE DE DONNÉES ===
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB connecté: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ Erreur de connexion MongoDB:", error.message);
    // En développement, on continue sans DB pour tester l'API
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    } else {
      console.log("⚠️  Mode développement: continuation sans DB");
    }
  }
};

// === ROUTES DE BASE ===

// Route de santé
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "AI Chatbot Backend is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Route de test
app.get("/api/test", (req, res) => {
  res.json({
    message: "API Backend fonctionnelle !",
    geminiKey: process.env.GOOGLE_AI_KEY ? "Configurée" : "Manquante",
    clerkKey: process.env.CLERK_SECRET_KEY ? "Configurée" : "Manquante",
    database:
      mongoose.connection.readyState === 1 ? "Connectée" : "Déconnectée",
  });
});

// === IMPORT DES ROUTES ===
// (Nous les créerons dans les prochaines étapes)

// === GESTION D'ERREURS GLOBALE ===
app.use((err, req, res, next) => {
  console.error("❌ Erreur serveur:", err.stack);
  res.status(500).json({
    error: "Erreur interne du serveur",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Une erreur est survenue",
  });
});

// Route 404 - doit être la dernière
app.use((req, res) => {
  res.status(404).json({
    error: "Route non trouvée",
    path: req.originalUrl,
    method: req.method,
  });
});

// === DÉMARRAGE DU SERVEUR ===
const startServer = async () => {
  try {
    // Connexion à la base de données
    await connectDB();

    // Démarrage du serveur
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur le port ${PORT}`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`🔧 Environnement: ${process.env.NODE_ENV}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("❌ Erreur de démarrage:", error);
    process.exit(1);
  }
};

// Gestion propre de l'arrêt
process.on("SIGTERM", () => {
  console.log("🛑 Arrêt du serveur...");
  mongoose.connection.close();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 Arrêt du serveur (Ctrl+C)...");
  mongoose.connection.close();
  process.exit(0);
});

// Démarrer le serveur
startServer();
