require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const connectDB = require("./config/db");
const { initWebSocketServer } = require("./websocket");

const app = express();
app.use(cors());
app.use(express.json());
// server.js (snippet near other app.use lines)
const authController = require("./controllers/authController");

app.post("/api/auth/register", authController.register); // optional (use for seeding)
app.post("/api/auth/login", authController.login);

// Connect MongoDB
connectDB();

// Simple Health Check
app.get("/", (req, res) => {
  res.send("Backend Running ✔");
});

// HTTP + WS server
const server = http.createServer(app);

// Initialize WebSocket server
initWebSocketServer(server);

// Start Server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));
