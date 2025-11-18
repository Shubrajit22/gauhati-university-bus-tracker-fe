// utils/jwt.js
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

function verifyToken(token) {
  try {
    if (!token) return null;
    // allow "Bearer <token>" format
    if (token.startsWith("Bearer ")) token = token.split(" ")[1];
    const payload = jwt.verify(token, JWT_SECRET);
    return payload;
  } catch (err) {
    return null;
  }
}

module.exports = { verifyToken };
