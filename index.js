const express = require("express");
const axios = require("axios");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.json());

const MY_SECRET_TOKEN = process.env.SECRET_TOKEN;
const ONESIGNAL_REST_KEY = process.env.ONESIGNAL_REST_KEY;

let pendingMessages = [];

app.post("/alert", async (req, res) => {
    if (req.headers["x-auth-token"] !== MY_SECRET_TOKEN) return res.status(403).end();

    const { playerName } = req.body;
    console.log(`[ALERT] Intrusion de ${playerName}`);

    try {
        await axios.post("https://onesignal.com/api/v1/notifications", {
            app_id: "9ea4abf1-0eb3-4b17-98e6-bf80e7f9d136",
            included_segments: ["Total Subscriptions"],
            headings: { "en": "⚠️ INTRUSION SKYBLOCK" },
            contents: { "en": `${playerName} est dans ta base !` },
            priority: 10
        }, {
            headers: { Authorization: `Basic ${ONESIGNAL_REST_KEY}` }
        });
    } catch (e) { console.error("Erreur OneSignal", e.message); }

    res.status(200).json({ status: "OK" });
});

app.post("/bridge", (req, res) => {
    if (req.headers["x-auth-token"] !== MY_SECRET_TOKEN) return res.status(403).end();
    
    const { playerName, message } = req.body;
    io.emit("mc_chat_message", { user: playerName, msg: message });
    res.status(200).json({ status: "OK" });
});

app.get("/get-messages", (req, res) => {
    if (req.headers["x-auth-token"] !== MY_SECRET_TOKEN) return res.status(403).end();
    res.json(pendingMessages.shift() || {});
});

io.on("connection", (socket) => {
    socket.on("send_to_mc", (data) => {
        pendingMessages.push({ message: data.text });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => console.log(`🚀 ATM Bridge & Sentinel sur port ${PORT}`));
