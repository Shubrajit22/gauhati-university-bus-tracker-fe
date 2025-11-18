// websocket/handlers.js
const Driver = require("../models/Driver");
const Bus = require("../models/Bus");
const { verifyToken } = require("../utils/jwt");

// helper broadcast only to students subscribed to a bus
async function broadcastToStudents(wss, busId, message) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1 && client.role === "student" && client.subscribedBus === busId) {
      client.send(JSON.stringify(message));
    }
  });
}

async function handleWSMessage(ws, data, wss) {
  switch (data.type) {
    // Allow client to authenticate after connection: { type: "authenticate", token }
    case "authenticate": {
      const payload = verifyToken(data.token || "");
      if (!payload) {
        ws.send(JSON.stringify({ type: "auth_failed", message: "invalid token" }));
        return;
      }
      ws.auth = payload;
      ws.role = payload.role;
      ws.driverId = payload.sub;
      ws.send(JSON.stringify({ type: "auth_ok", payload }));
      return;
    }

    // Backwards compatibility: driver_login (plain user/password) - deprecated but supported
    case "driver_login": {
      const driver = await Driver.findOne({ username: data.username });
      if (!driver) {
        return ws.send(JSON.stringify({ type: "login_failed", message: "Driver not found" }));
      }
      // NOTE: this path assumes password stored in plain text (legacy). Recommend using HTTP login instead.
      if (driver.password !== data.password) {
        return ws.send(JSON.stringify({ type: "login_failed", message: "Wrong password" }));
      }
      ws.role = "driver";
      ws.driverId = driver._id.toString();
      ws.send(JSON.stringify({
        type: "login_success",
        driver: { name: driver.name, username: driver.username },
        assignedBuses: driver.assignedBuses,
      }));
      return;
    }

    // STUDENT SUBSCRIBE
    case "student_subscribe": {
      ws.role = "student";
      ws.subscribedBus = data.busId;
      ws.send(JSON.stringify({ type: "subscribed", busId: data.busId }));
      return;
    }

    // GET ALL BUSES
    case "get_buses": {
      const found = await Bus.find({});
      ws.send(JSON.stringify({ type: "buses_list", buses: found }));
      return;
    }

    // Protected actions require authenticated driver
    case "driver_select_bus": {
      // ensure driver authenticated via token or prior login
      if (!ws.driverId && !ws.auth) {
        return ws.send(JSON.stringify({ type: "error", message: "auth_required" }));
      }
      const busId = data.busId;
      ws.selectedBus = busId;
      const bus = await Bus.findOne({ busId });
      ws.send(JSON.stringify({ type: "driver_selected_bus_confirm", bus }));
      return;
    }

    case "start_journey": {
      if (!ws.driverId && !ws.auth) return ws.send(JSON.stringify({ type: "error", message: "auth_required" }));
      const busId = ws.selectedBus || data.busId;
      if (!busId) return ws.send(JSON.stringify({ type: "error", message: "no_bus_selected" }));

      await Bus.updateOne({ busId }, { journeyActive: true });
      // notify driver and students
      wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({ type: "journey_started", busId }));
        }
      });
      return;
    }

    case "stop_journey": {
      if (!ws.driverId && !ws.auth) return ws.send(JSON.stringify({ type: "error", message: "auth_required" }));
      const busId = ws.selectedBus || data.busId;
      if (!busId) return ws.send(JSON.stringify({ type: "error", message: "no_bus_selected" }));

      await Bus.updateOne({ busId }, { journeyActive: false });
      wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({ type: "journey_stopped", busId }));
        }
      });
      return;
    }

    case "location_update": {
      if (!ws.driverId && !ws.auth) return ws.send(JSON.stringify({ type: "error", message: "auth_required" }));
      const busId = ws.selectedBus || data.busId;
      if (!busId) return ws.send(JSON.stringify({ type: "error", message: "no_bus_selected" }));

      const lat = data.lat;
      const lng = data.lng;
      await Bus.updateOne({ busId }, { lastLocation: { lat, lng, timestamp: new Date() } });

      // broadcast to all students subscribed to this bus
      broadcastToStudents(wss, busId, { type: "location_update", bus: { busId, lat, lng } });
      // also send to all clients (optional)
      // wss.clients.forEach(client => client.readyState === 1 && client.send(JSON.stringify({ type: "location_update", bus: { busId, lat, lng } })));
      return;
    }

    default:
      ws.send(JSON.stringify({ type: "error", message: "unknown_type" }));
      return;
  }
}

module.exports = { handleWSMessage };
