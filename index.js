const express = require("express");
const axios = require("axios");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json());

const AUTH_CONFIG = {
    token: process.env.SECRET_TOKEN,
    osKey: process.env.ONESIGNAL_REST_KEY,
    osAppId: "9ea4abf1-0eb3-4b17-98e6-bf80e7f9d136"
};

let pendingMessages = [];
let onlinePlayers = [];
let chatHistory = [];

const cleanHistory = () => {
    const limit = Date.now() - (12 * 60 * 60 * 1000); 
    chatHistory = chatHistory.filter(m => m.timestamp > limit);
};
setInterval(cleanHistory, 600000);

const sendOS = async (title, text, type, priority = 10) => {
    try {
        await axios.post("https://onesignal.com/api/v1/notifications", {
            app_id: AUTH_CONFIG.osAppId,
            included_segments: ["Total Subscriptions"],
            headings: { en: title },
            contents: { en: text },
            data: { type },
            priority
        }, { headers: { Authorization: `Basic ${AUTH_CONFIG.osKey}` } });
    } catch (e) { console.error(`OS Error [${type}]:`, e.message); }
};

app.use((req, res, next) => {
    if (req.headers["x-auth-token"] !== AUTH_CONFIG.token) return res.status(403).end();
    next();
});

app.post("/alert", (req, res) => {
    const { playerName } = req.body;
    sendOS("INTRUSION SKYBLOCK", `${playerName} est dans ta base !`, "intrusion");
    res.json({ status: "OK" });
});

app.post("/update-players", (req, res) => {
    const { action, playerName, players } = req.body;
    if (action === "reset") onlinePlayers = players || [];
    else if (action === "join") {
        if (!onlinePlayers.includes(playerName)) onlinePlayers.push(playerName);
        sendOS("Activité Serveur", `${playerName} a rejoint le serveur.`, "join");
    } else if (action === "leave") {
        onlinePlayers = onlinePlayers.filter(p => p !== playerName);
        sendOS("Activité Serveur", `${playerName} a quitté le serveur.`, "leave");
    }
    io.emit("player_list_update", onlinePlayers);
    res.json({ status: "OK" });
});

app.post("/notify", (req, res) => {
    const { playerName, message } = req.body;
    const msgData = { user: playerName, msg: message, timestamp: Date.now() };
    chatHistory.push(msgData);
    io.emit("mc_chat_message", msgData);
    sendOS("Nouveau message", `${playerName}: ${message}`, "chat");
    res.json({ status: "OK" });
});

app.get("/get-messages", (req, res) => {
    res.json(pendingMessages.shift() || {});
});

io.on("connection", (socket) => {
    cleanHistory();
    socket.emit("player_list_update", onlinePlayers);
    socket.emit("chat_history", chatHistory);
    socket.on("send_to_mc", (data) => {
        pendingMessages.push({ message: data.text });
        const appMsg = { user: "DASHBOARD", msg: data.text, timestamp: Date.now() };
        chatHistory.push(appMsg);
        io.emit("mc_chat_message", appMsg);
    });
});

server.listen(process.env.PORT || 3000, "0.0.0.0");
