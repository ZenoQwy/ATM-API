const express = require("express");
const app = express();
app.use(express.json()); // Pour lire le JSON envoyé par CC

// --- CONFIGURATION ---
const PORT = process.env.PORT || 3000;
const MY_SECRET_TOKEN = process.env.SECRET_TOKEN || "change_moi_vite";

// --- ROUTE DE NOTIFICATION ---
app.post("/notify", (req, res) => {
  const clientToken = req.headers["x-auth-token"];
  const { playerName, message } = req.body;

  // 1. Vérification de sécurité
  if (clientToken !== MY_SECRET_TOKEN) {
    console.warn(`[!] Tentative d'accès non autorisée de l'IP: ${req.ip}`);
    return res.status(403).json({ error: "Interdit. Token invalide." });
  }

  // 2. Traitement de la donnée
  console.log(`[+] Alerte : ${playerName} est détecté ! (${message})`);

  // TODO: Ici on ajoutera l'appel à l'API OneSignal
  // sendOneSignalNotification(playerName, message);

  res.status(200).json({ status: "Notification reçue !" });
});

app.listen(PORT, () => {
  console.log(`Serveur sécurisé lancé sur le port ${PORT}`);
});
