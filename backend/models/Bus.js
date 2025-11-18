const mongoose = require("mongoose");

const busSchema = new mongoose.Schema({
  busId: String,
  numberPlate: String,
  routeId: String,
  routeName: String,

  // Live Tracking
  currentStop: String,
  nextStop: String,
  totalStops: Number,
  progress: Number,
  stops: [String],

  // Driver Journey
  driverId: String,
  journeyActive: { type: Boolean, default: false },

  lastLocation: {
    lat: Number,
    lng: Number,
    timestamp: Date,
  },

  lastStudents: { type: Array, default: [] },
});

module.exports = mongoose.model("Bus", busSchema);
