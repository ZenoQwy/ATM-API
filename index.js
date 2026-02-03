const express = require("express");
const axios = require("axios"); // Ajout d'axios
const app = express();
app.use(express.json());

// Tes variables d'environnement sur Render
const MY_SECRET_TOKEN = process.env.SECRET_TOKEN;
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_REST_KEY = process.env.ONESIGNAL_REST_KEY;

app.post("/notify", async (req, res) => {
  // 1. Vérification du Token
  if (req.headers["x-auth-token"] !== MY_SECRET_TOKEN) {
    return res.status(403).end();
  }

  const { playerName, message } = req.body;
  const horodatage = new Date().toLocaleTimeString("fr-FR");

  console.log(`[${horodatage}] 🏠 Détection : ${playerName}`);

  // 2. Envoi de la notification vers OneSignal
  try {
    await axios.post(
      "https://onesignal.com/api/v1/notifications",
      {
        app_id: ONESIGNAL_APP_ID,
        included_segments: ["Total Subscriptions"], // Envoie à tous ceux qui ont l'app
        headings: { en: "⚠️ INTRUSION SKYBLOCK" },
        contents: { en: `${playerName} est dans ta base !` },
        android_accent_color: "FF8C00", // Orange ATM
        priority: 10, // Haute priorité
      },
      {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          Authorization: `Basic ${ONESIGNAL_REST_KEY}`,
        },
      },
    );
    console.log(`[${horodatage}] ✅ Notification envoyée via OneSignal`);
  } catch (error) {
    console.error(
      `[${horodatage}] ❌ Erreur OneSignal:`,
      error.response?.data || error.message,
    );
  }

  res.status(200).json({ status: "OK" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Passerelle ATM active sur le port ${PORT}`);
});
