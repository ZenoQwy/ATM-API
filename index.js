const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

const MY_SECRET_TOKEN = process.env.SECRET_TOKEN;
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_REST_KEY = process.env.ONESIGNAL_REST_KEY;

app.post("/notify", async (req, res) => {
  if (req.headers["x-auth-token"] !== MY_SECRET_TOKEN) {
    return res.status(403).end();
  }

  const { playerName, message } = req.body;
  const horodatage = new Date().toLocaleTimeString("fr-FR");

  console.log(`[${horodatage}] 🏠 Détection : ${playerName}`);

  try {
    await axios.post(
      "https://onesignal.com/api/v1/notifications",
      {
        app_id: "9ea4abf1-0eb3-4b17-98e6-bf80e7f9d136",
        included_segments: ["Total Subscriptions"],
        headings: { "en": "⚠️ INTRUSION SKYBLOCK" },
        contents: { "en": `${playerName} est dans ta base !` },
        android_accent_color: "0F172A",
        small_icon: "ic_stat_onesignal_default",
        large_icon: "ic_launcher_round", 
        priority: 10
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
