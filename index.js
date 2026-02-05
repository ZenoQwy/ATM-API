const express = require("express");
const axios = require("axios");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(express.json());

const MY_SECRET_TOKEN = process.env.SECRET_TOKEN;
const ONESIGNAL_REST_KEY = process.env.ONESIGNAL_REST_KEY;

let pendingMessages = [];
let onlinePlayers = [];

app.post("/alert", async (req, res) => {
    if (req.headers["x-auth-token"] !== MY_SECRET_TOKEN) return res.status(403).end();
    const { playerName } = req.body;
    console.log(`[ALERT] Intrusion de ${playerName}`);
    try {
        await axios.post("https://onesignal.com/api/v1/notifications", {
            app_id: "9ea4abf1-0eb3-4b17-98e6-bf80e7f9d136",
            included_segments: ["Total Subscriptions"],
            android_accent_color: "FF0F172A",
            data: { "type": "intrusion" },
            headings: { "en": "INTRUSION SKYBLOCK" },
            contents: { "en": `${playerName} est dans ta base !` }
        }, { headers: { Authorization: `Basic ${ONESIGNAL_REST_KEY}` } });
    } catch (e) { console.error("Erreur OneSignal", e.message); }
    res.status(200).json({ status: "OK" });
});

app.post("/update-players", async (req, res) => {
    if (req.headers["x-auth-token"] !== MY_SECRET_TOKEN) return res.status(403).end();
    
    const { action, playerName, players } = req.body;

    if (action === "reset") {
        onlinePlayers = players || [];
        console.log("Liste réinitialisée :", onlinePlayers);
    } else if (action === "join") {
        if (!onlinePlayers.includes(playerName)) onlinePlayers.push(playerName);
        sendNotification(`🚀 ${playerName} a rejoint le serveur !`, "join");
    } else if (action === "leave") {
        onlinePlayers = onlinePlayers.filter(p => p !== playerName);
        sendNotification(`👋 ${playerName} a quitté le serveur.`, "leave");
    }

    io.emit("player_list_update", onlinePlayers);
    res.status(200).json({ status: "OK" });
});

async function sendNotification(text, type) {
    try {
        await axios.post("https://onesignal.com/api/v1/notifications", {
            app_id: "9ea4abf1-0eb3-4b17-98e6-bf80e7f9d136",
            included_segments: ["Total Subscriptions"],
            headings: { "en": "Statut Serveur" },
            contents: { "en": text },
            data: { "type": type }
        }, { headers: { Authorization: `Basic ${ONESIGNAL_REST_KEY}` } });
    } catch (e) { console.error("Erreur OneSignal Status:", e.message); }
}

app.post("/notify", async (req, res) => {
    if (req.headers["x-auth-token"] !== MY_SECRET_TOKEN) return res.status(403).end();
    
    const { playerName, message } = req.body;
    console.log(`[MC -> APP] ${playerName}: ${message}`);

    io.emit("mc_chat_message", { user: playerName, msg: message });

    try {
        await axios.post("https://onesignal.com/api/v1/notifications", {
            app_id: "9ea4abf1-0eb3-4b17-98e6-bf80e7f9d136",
            included_segments: ["Total Subscriptions"],
            android_accent_color: "FF0F172A",
            data: { "type": "chat" },
            headings: { "en": `Nouveau message` },
            contents: { "en": `${playerName}: ${message}`},
            priority: 10
        }, {
            headers: { Authorization: `Basic ${ONESIGNAL_REST_KEY}` }
        });
    } catch (e) { 
        console.error("Erreur OneSignal (Chat):", e.message); 
    }

    res.status(200).json({ status: "OK" });
});

app.get("/get-messages", (req, res) => {
    if (req.headers["x-auth-token"] !== MY_SECRET_TOKEN) return res.status(403).end();
    const msg = pendingMessages.shift() || {}; 
    res.json(msg);
});

io.on("connection", (socket) => {
    socket.on("send_to_mc", (data) => {
        console.log(`[APP -> MC] Nouveau message stocké: ${data.text}`);
        pendingMessages.push({ message: data.text });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => console.log(`🚀 Bridge actif sur le port ${PORT}`));
