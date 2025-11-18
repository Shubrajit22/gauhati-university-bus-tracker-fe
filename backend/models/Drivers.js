// models/Driver.js
const mongoose = require("mongoose");

const assignedBusSchema = new mongoose.Schema({
  busId: String,
  numberPlate: String,
  route: String,
});

const driverSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  // store bcrypt-hashed password
  password: { type: String, required: true },
  name: String,
  assignedBuses: [assignedBusSchema],
}, { timestamps: true });

module.exports = mongoose.model("Driver", driverSchema);
