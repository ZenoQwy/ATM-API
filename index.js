const express = require("express");
const app = express();
app.use(express.json());

const MY_SECRET_TOKEN = process.env.SECRET_TOKEN;

app.post("/notify", (req, res) => {
  const clientToken = req.headers["x-auth-token"];
  const { playerName, message } = req.body;

  // Log de réception brute pour débugger
  console.log("--- NOUVELLE REQUÊTE REÇUE ---");
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);

  if (clientToken !== MY_SECRET_TOKEN) {
    console.error("[-] ÉCHEC : Token invalide !");
    return res.status(403).json({ error: "Token invalide" });
  }

  console.log(`[!] SUCCÈS : Détection de ${playerName} -> ${message}`);
  res.status(200).json({ status: "Données reçues par le serveur !" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Serveur en écoute sur le port ${PORT}`);
});
