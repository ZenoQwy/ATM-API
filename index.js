const express = require("express");
const app = express();
app.use(express.json());

const MY_SECRET_TOKEN = process.env.SECRET_TOKEN;

app.post("/notify", (req, res) => {
  if (req.headers["x-auth-token"] !== MY_SECRET_TOKEN) {
    return res.status(403).end();
  }

  const { playerName } = req.body;

  const horodatage = new Date().toLocaleTimeString("fr-FR");
  console.log(`[${horodatage}] 🏠 Détection : ${playerName} est dans la base.`);

  res.status(200).json({ status: "OK" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Système de surveillance prêt sur le port ${PORT}`);
});
