const mongoose = require("mongoose");

const routeSchema = new mongoose.Schema({
  routeId: String,
  name: String,
  stops: [String],
});

module.exports = mongoose.model("Route", routeSchema);
