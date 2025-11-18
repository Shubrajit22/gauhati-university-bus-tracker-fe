// controllers/authController.js
const Driver = require("../models/Driver");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

async function register(req, res) {
  try {
    const { username, password, name, assignedBuses } = req.body;
    if (!username || !password) return res.status(400).json({ message: "username & password required" });

    const existing = await Driver.findOne({ username });
    if (existing) return res.status(400).json({ message: "username already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const driver = new Driver({ username, password: hashed, name, assignedBuses: assignedBuses || [] });
    await driver.save();

    return res.status(201).json({ message: "driver created" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
}

async function login(req, res) {
  try {
    const { username, password } = req.body;
    const driver = await Driver.findOne({ username });
    if (!driver) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, driver.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const payload = { sub: driver._id.toString(), username: driver.username, name: driver.name, role: "driver" };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.json({
      token,
      driver: {
        id: driver._id,
        username: driver.username,
        name: driver.name,
        assignedBuses: driver.assignedBuses,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
}

module.exports = { register, login };
