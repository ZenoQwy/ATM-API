const express = require("express");
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const MY_SECRET_TOKEN = process.env.SECRET_TOKEN || "change_moi_vite";

app.post("/notify", (req, res) => {
  const clientToken = req.headers["x-auth-token"];
  const { playerName, message } = req.body;

  if (clientToken !== MY_SECRET_TOKEN) {
    console.warn(`[!] Tentative d'accès non autorisée de l'IP: ${req.ip}`);
    return res.status(403).json({ error: "Interdit. Token invalide." });
  }

  console.log(`[+] Alerte : ${playerName} est détecté ! (${message})`);

  res.status(200).json({ status: "Notification reçue !" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Serveur prêt sur le port ${PORT}`);
  console.log(
    `Token configuré : ${process.env.SECRET_TOKEN ? "OUI (défini)" : "NON (utilise la valeur par défaut)"}`,
  );
});
