// websocket/index.js
const WebSocket = require("ws");
const url = require("url");
const { handleWSMessage } = require("./handlers");
const { verifyToken } = require("../utils/jwt");

let wss;

function initWebSocketServer(server) {
  wss = new WebSocket.Server({ server });

  console.log("🟢 WebSocket Server Running");

  wss.on("connection", (ws, req) => {
    // attempt to parse token from query string e.g. ws://host?token=...
    try {
      const parsed = url.parse(req.url, true);
      const token = parsed.query?.token;
      if (token) {
        const payload = verifyToken(token);
        if (payload) {
          ws.auth = payload; // store payload
          ws.role = payload.role;
          ws.driverId = payload.sub;
        }
      }
    } catch (e) {
      // ignore
    }

    ws.id = Date.now() + Math.floor(Math.random() * 1000);
    console.log("🔌 Client connected", ws.id);

    ws.on("message", (msg) => {
      let data;
      try {
        data = JSON.parse(msg);
      } catch (e) {
        return ws.send(JSON.stringify({ type: "error", message: "invalid_json" }));
      }
      handleWSMessage(ws, data, wss);
    });

    ws.on("close", () => {
      console.log("❌ Client disconnected", ws.id);
    });

    ws.on("error", (err) => {
      console.warn("WS error", err);
    });
  });
}

module.exports = { initWebSocketServer };
