// copy edit
import React, { useState, useEffect, useRef } from "react";
import { Bus, LogOut, Play, Square, Navigation, Clock } from "lucide-react";
import BusRouteDetails from "./BusRouteDetails";

const WS_URL = "ws://localhost:3001";

export default function BusTrackingApp() {
  // modes: select | student | student_detail | driver | driver_bus_select | driver_dashboard
  const [mode, setMode] = useState("select");

  // websocket state (for students and for driver after connecting with token)
  const [ws, setWs] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // driver auth state
  const [driverCredentials, setDriverCredentials] = useState({ username: "", password: "" });
  const [driverInfo, setDriverInfo] = useState(null);
  const [driverToken, setDriverToken] = useState(null);
  const [driverAssignedBuses, setDriverAssignedBuses] = useState([]);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // driver session state
  const [selectedBus, setSelectedBus] = useState(null);
  const [journeyActive, setJourneyActive] = useState(false);
  const [currentLocation, setCurrentLocation] = useState({ lat: 26.1445, lng: 91.7362 });

  // student / general state
  const [routes, setRoutes] = useState({});
  const [buses, setBuses] = useState([]);
  const [busLocation, setBusLocation] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, []);

  // Generic WS connect used for students (and other non-token flows)
  const connectWebSocket = () => {
    if (isConnecting || wsRef.current) return;
    setIsConnecting(true);

    const socket = new WebSocket(WS_URL);

    socket.onopen = () => {
      setConnected(true);
      setIsConnecting(false);
      setWs(socket);
      wsRef.current = socket;
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleMessage(data);
      } catch (e) {
        console.warn("Invalid WS message", e);
      }
    };

    socket.onclose = () => {
      setConnected(false);
      setIsConnecting(false);
      setWs(null);
      wsRef.current = null;
      // try reconnect if not on select screen
      if (mode !== "select") {
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
      }
    };

    socket.onerror = () => {
      setIsConnecting(false);
    };
  };

  // Handle incoming WS messages (both student and driver messages)
  const handleMessage = (data) => {
    switch (data.type) {
      case "login_success":
        // legacy/optional - if server sends this via WS (we now use HTTP JWT) keep handling
        if (data.driver) {
          setDriverInfo(data.driver);
          if (Array.isArray(data.assignedBuses)) setDriverAssignedBuses(data.assignedBuses);
          setMode("driver_bus_select");
        }
        break;

      case "auth_ok":
        // server confirmed token authentication
        // optional: server may include assignedBuses in payload
        if (data.payload?.assignedBuses) setDriverAssignedBuses(data.payload.assignedBuses);
        break;

      case "driver_selected_bus_confirm":
        if (data.bus) {
          setSelectedBus(data.bus);
        }
        setMode("driver_dashboard");
        break;

      case "driver_buses":
        if (Array.isArray(data.buses)) setDriverAssignedBuses(data.buses);
        break;

      case "journey_started":
        if (!data.busId || (selectedBus && data.busId === selectedBus.busId) || (selectedBus && data.busId === selectedBus.id)) {
          setJourneyActive(true);
        }
        break;

      case "journey_stopped":
        if (!data.busId || (selectedBus && data.busId === selectedBus.busId) || (selectedBus && data.busId === selectedBus.id)) {
          setJourneyActive(false);
        }
        break;

      case "buses_list":
        setRoutes(data.routes || {});
        setBuses(data.buses || []);
        break;

      case "location_update":
      case "bus_status_update":
        setBusLocation(data.bus || null);
        setLastUpdateTime(new Date());
        break;

      case "subscribed":
        // student subscription acknowledgement
        console.log("Subscribed to bus:", data.busId);
        break;

      default:
        // ignore unknown types
        break;
    }
  };

  // ===== DRIVER LOGIN (HTTP, returns JWT) =====
  const handleDriverLogin = async () => {
    try {
      setIsLoggingIn(true);

      const res = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: driverCredentials.username,
          password: driverCredentials.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Login failed");
        setIsLoggingIn(false);
        return;
      }

      // Save token & driver info
      setDriverToken(data.token);
      setDriverInfo(data.driver || { username: driverCredentials.username, name: data.driver?.name || driverCredentials.username });
      setDriverAssignedBuses(data.driver?.assignedBuses || []);

      // Open WebSocket with token in query string
      const socket = new WebSocket(`${WS_URL}?token=${data.token}`);

      socket.onopen = () => {
        console.log("WS connected (driver)");
        setWs(socket);
        wsRef.current = socket;
        setMode("driver_bus_select");
        setIsLoggingIn(false);
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          handleMessage(msg);
        } catch (e) {
          console.warn("Invalid WS JSON", e);
        }
      };

      socket.onclose = () => {
        console.log("WS closed (driver)");
        setWs(null);
        wsRef.current = null;
      };

      socket.onerror = (err) => {
        console.warn("WS error", err);
      };
    } catch (err) {
      console.error("Login error:", err);
      alert("Network error");
      setIsLoggingIn(false);
    }
  };

  // Start/Stop journey (send to server)
  const handleStartJourney = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      alert("WebSocket not connected");
      return;
    }
    // server expects busId (selectedBus may be object with id or busId)
    const busId = selectedBus?.busId || selectedBus?.id || selectedBus?.busId;
    wsRef.current.send(JSON.stringify({ type: "start_journey", busId }));
    // optimistic
    setJourneyActive(true);
    // send an immediate location update
    wsRef.current.send(JSON.stringify({ type: "location_update", busId, lat: currentLocation.lat, lng: currentLocation.lng }));
  };

  const handleStopJourney = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      alert("WebSocket not connected");
      return;
    }
    const busId = selectedBus?.busId || selectedBus?.id || selectedBus?.busId;
    wsRef.current.send(JSON.stringify({ type: "stop_journey", busId }));
    setJourneyActive(false);
  };

  // location simulation while journeyActive
  const simulateMovement = () => {
    if (!journeyActive || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !selectedBus) return;
    const newLat = currentLocation.lat + (Math.random() - 0.5) * 0.001;
    const newLng = currentLocation.lng + (Math.random() - 0.5) * 0.001;
    setCurrentLocation({ lat: newLat, lng: newLng });

    const busId = selectedBus?.busId || selectedBus?.id || selectedBus?.busId;
    wsRef.current.send(JSON.stringify({ type: "location_update", busId, lat: newLat, lng: newLng }));
  };

  useEffect(() => {
    if (journeyActive) {
      const interval = setInterval(simulateMovement, 2000);
      return () => clearInterval(interval);
    }
  }, [journeyActive, currentLocation, selectedBus]);

  // Student mode: connect and request buses
  const handleStudentMode = () => {
    setMode("student");
    // use generic WS connection for student
    connectWebSocket();
    setTimeout(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "get_buses" }));
      }
    }, 500);
  };

  const handleBusSelect = (bus) => {
    setSelectedBus(bus);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "student_subscribe", routeId: bus.routeId, busId: bus.busId }));
    }
  };

  // logout clears everything and closes socket
  const handleLogout = () => {
    if (wsRef.current) wsRef.current.close();
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);

    setMode("select");
    setDriverInfo(null);
    setDriverToken(null);
    setDriverAssignedBuses([]);
    setJourneyActive(false);
    setSelectedBus(null);
    setBusLocation(null);
    setDriverCredentials({ username: "", password: "" });
    setWs(null);
    wsRef.current = null;
  };

  // Reusable background
  const Background = () => (
    <div
      className="absolute inset-0 z-0"
      style={{
        background: "white",
        backgroundImage: `
        linear-gradient(to right, #e5e7eb 1px, transparent 2px),
        linear-gradient(to bottom, #e5e7eb 1px, transparent 2px)
      `,
        backgroundSize: "40px 40px, 40px 40px, cover",
      }}
    />
  );

  // ---------- UI RENDERING ----------

  // Select screen
  if (mode === "select") {
    return (
      <div className="min-h-screen w-full bg-black relative text-white flex items-center justify-center p-6">
        <Background />
        <div className="relative z-10 text-center space-y-8">
          <h1 className="text-5xl text-black font-black">Bus Tracking System</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <button
              onClick={() => setMode("driver")}
              className="bg-white text-black hover:bg-gray-800 hover:text-white cursor-pointer transition-all rounded-2xl border-2 p-8 font-bold text-xl"
            >
              Driver Portal
            </button>
            <button
              onClick={handleStudentMode}
              className="bg-white text-black hover:bg-gray-800 hover:text-white cursor-pointer transition-all rounded-2xl p-8 font-bold text-xl border-2"
            >
              Student Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Driver login (HTTP)
  if (mode === "driver" && !driverInfo) {
    return (
      <div className="min-h-screen w-full bg-black relative flex items-center justify-center text-white p-6">
        <Background />
        <div className="relative z-10 bg-black border border-gray-700 p-6 rounded-3xl w-full max-w-md space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center">Driver Login</h2>
          <p className="text-center text-yellow-400 font-semibold">🚧 Driver Portal</p>

          <input
            type="text"
            value={driverCredentials.username}
            onChange={(e) => setDriverCredentials({ ...driverCredentials, username: e.target.value })}
            placeholder="Username"
            className="w-full p-3 rounded-xl bg-black border border-gray-600 text-white"
          />
          <input
            type="password"
            value={driverCredentials.password}
            onChange={(e) => setDriverCredentials({ ...driverCredentials, password: e.target.value })}
            placeholder="Password"
            className="w-full p-3 rounded-xl bg-black border border-gray-600 text-white"
          />

          <button
            onClick={handleDriverLogin}
            disabled={isLoggingIn}
            className="w-full bg-white text-black hover:bg-gray-200 transition-all rounded-xl p-3 font-bold"
          >
            {isLoggingIn ? "Logging in..." : "Login"}
          </button>

          <button onClick={() => setMode("select")} className="w-full bg-black border border-gray-500 hover:bg-gray-900 rounded-xl p-3 font-bold text-white">
            Back
          </button>
        </div>
      </div>
    );
  }

  // Driver bus selection (after successful HTTP login + ws with token)
  if (mode === "driver_bus_select") {
    // fallback sample buses if none assigned
    const sampleDriverBuses = [
      { busId: "bus-1", numberPlate: "AS01-BC-4421", route: "AT7 Boys Hall ↔ Chandmari" },
      { busId: "bus-2", numberPlate: "AS01-DE-9932", route: "AT5 Girls Hostel ↔ Uzanbazar" },
    ];
    const list = driverAssignedBuses.length ? driverAssignedBuses : sampleDriverBuses;

    return (
      <div className="min-h-screen w-full bg-gray-100 relative text-black px-4 py-6 sm:px-6">
        <Background />
        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="relative bg-white rounded-2xl shadow p-4 flex items-center justify-between">
            <h2 className="text-xl sm:text-3xl font-bold">Select Your Bus</h2>
            <button onClick={handleLogout} className="bg-black text-white px-3 py-2 rounded-xl flex items-center gap-1 text-xs sm:text-sm">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>

          <div className="space-y-4">
            {list.map((b) => (
              <div
                key={b.busId || b.id}
                onClick={() => {
                  // send selection to server via ws
                  if (wsRef.current?.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({ type: "driver_select_bus", busId: b.busId || b.id }));
                  }
                  setSelectedBus(b);
                  setMode("driver_dashboard");
                }}
                className="bg-white border border-gray-200 rounded-2xl shadow p-4 flex justify-between items-center hover:bg-gray-50 transition cursor-pointer"
              >
                <div>
                  <p className="text-lg font-bold">{b.numberPlate}</p>
                  <p className="text-sm text-gray-600">{b.route}</p>
                </div>
                <button className="bg-black text-white px-3 py-2 rounded-xl text-xs sm:text-sm">Select</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Driver dashboard (after selecting a bus)
  if (mode === "driver_dashboard" && (driverInfo || true) && selectedBus) {
    return (
      <div className="min-h-screen w-full bg-gray-100 relative text-black px-4 py-6 sm:px-6">
        <Background />

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="relative bg-white rounded-2xl shadow p-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-3xl font-bold">Hello, {driverInfo?.name || driverInfo?.username || "Driver"}</h2>
              <p className="text-sm text-gray-600">{selectedBus.numberPlate} • {selectedBus.route}</p>
            </div>

            <button onClick={handleLogout} className="bg-black text-white text-xs sm:text-sm px-3 py-2 rounded-xl flex items-center gap-1 shadow">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow p-6 space-y-4">
            <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <Navigation className="w-5 h-5" />
              Journey Control
            </h3>

            {journeyActive ? (
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <p className="text-sm font-semibold text-green-700">Journey is LIVE</p>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <p className="text-sm font-semibold text-red-700">Journey is currently stopped</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {!journeyActive ? (
                <button onClick={handleStartJourney} className="w-full bg-black text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all">
                  <Play className="w-5 h-5" /> Start Journey
                </button>
              ) : (
                <button onClick={handleStopJourney} className="w-full bg-red-600 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 hover:bg-red-700 transition-all">
                  <Square className="w-5 h-5" /> Stop Journey
                </button>
              )}

              <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-center text-sm text-gray-600">
                <div>
                  <div className="text-xs text-gray-500">Last update</div>
                  <div className="font-semibold">{lastUpdateTime ? lastUpdateTime.toLocaleTimeString() : "—"}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow p-6 space-y-3">
            <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Live Location
            </h3>

            {journeyActive ? (
              <div className="bg-gray-100 p-4 rounded-xl border border-gray-300">
                <p className="text-sm text-gray-700">Latitude: <span className="font-semibold">{currentLocation.lat.toFixed(6)}</span></p>
                <p className="text-sm text-gray-700">Longitude: <span className="font-semibold">{currentLocation.lng.toFixed(6)}</span></p>
                <p className="mt-3 text-xs text-gray-500">Updating every 2 seconds…</p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Start the journey to begin sending live GPS updates.</p>
            )}
          </div>

          <div className="text-center text-gray-400 text-xs py-4">Powered by GU Bus Tracking System</div>
        </div>
      </div>
    );
  }

  // Student listing (unchanged, mobile-optimized)
  if (mode === "student" && !selectedBus) {
    const busCards = [
      {
        id: 1,
        name: "AT7 Boys Hall to Chandmari",
        from: "AT7 Boys Hall",
        to: "Chandmari",
        currentStop: "Maligaon Station",
        nextStop: "Kamakhya Temple",
        progress: 5,
        totalStops: 10,
        stops: ["AT7 Boys Hall", "University Gate", "Jalukbari Flyover", "Jalukbari Market", "Maligaon Station", "Kamakhya Temple", "A.T. Road", "Bharalumukh", "Uzanbazar", "Chandmari"],
        eta: "7 min",
        status: "Mid Route",
      },
      {
        id: 2,
        name: "AT5 Girls Hostel to Uzanbazar",
        from: "AT5 Girls Hostel",
        to: "Uzanbazar",
        currentStop: "Bharalumukh",
        nextStop: "Fancy Bazaar",
        progress: 6,
        totalStops: 9,
        stops: ["AT5 Girls Hostel", "University Gate", "Jalukbari Market", "Maligaon Station", "Kamakhya Temple", "Bharalumukh", "Fancy Bazaar", "Uzanbazar", "RG Baruah Road"],
        eta: "5 min",
        status: "Mid Route",
      },
      {
        id: 3,
        name: "Science Block to Khanapara",
        from: "Science Block",
        to: "Khanapara",
        currentStop: "Zoo Road",
        nextStop: "Khanapara Gate",
        progress: 8,
        totalStops: 11,
        stops: ["Science Block", "University Gate", "Bharalumukh", "Paltan Bazaar", "GS Road", "Zoo Road", "Ganeshguri", "Six Mile", "Khanapara Gate", "Khanapara", "Dispur"],
        eta: "4 min",
        status: "Mid Route",
      },
      {
        id: 4,
        name: "AT3 Hostel to Jalukbari",
        from: "AT3 Hostel",
        to: "Jalukbari",
        currentStop: "University Gate",
        nextStop: "Jalukbari Market",
        progress: 2,
        totalStops: 8,
        stops: ["AT3 Hostel", "Science Block", "University Gate", "Jalukbari Market", "Jalukbari Flyover", "Maligaon Station", "A.T. Road", "Jalukbari"],
        eta: "10 min",
        status: "Starting",
      },
    ];

    return (
      <div className="min-h-screen w-full bg-gray-700 relative text-white p-6">
        <Background />
        <div className="relative z-10 max-w-6xl mx-auto space-y-8 ">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h2 className="text-3xl sm:text-4xl text-black font-bold mb-0 text-center">Available Buses</h2>
            <div className="text-center">
              <button onClick={handleLogout} className="bg-white text-black border-2 hover:bg-gray-200 px-4 py-2 rounded-xl font-semibold">
                <LogOut className="inline w-5 h-5 mr-1" /> Back
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {busCards.map((bus) => (
              <div key={bus.id} className="bg-white shadow-2xl border border-gray-300 rounded-2xl p-6 flex flex-col justify-between hover:shadow-2xl transition-all duration-300">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-2xl text-black font-bold">{bus.name}</h3>
                    <span className="bg-black text-white px-3 py-1 rounded-full text-sm font-semibold">{bus.status}</span>
                  </div>

                  <p className="text-gray-700 flex items-center text-sm mb-6"><Bus className="w-4 h-4 mr-2" /> {bus.from} → {bus.to}</p>

                  <div className="bg-gray-100 border border-gray-300 rounded-xl p-4 mb-6">
                    <p className="mb-2 text-black">🚌 Bus is currently at: <span className="font-semibold underline text-black">{bus.currentStop}</span></p>
                    <p className="text-black">⏩ Next stop: <span className="font-semibold">{bus.nextStop}</span></p>
                    <p className="mt-2 text-gray-600 text-sm">ETA: <span className="font-semibold">{bus.eta}</span></p>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>{bus.from}</span>
                      <span>{bus.progress} of {bus.totalStops} stops</span>
                      <span>{bus.to}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-black" style={{ width: `${(bus.progress / bus.totalStops) * 100}%` }} />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {bus.stops.slice(0, 5).map((stop, i) => (
                      <span key={i} className={`px-3 py-1 text-xs rounded-full border ${stop === bus.currentStop ? "bg-black text-white font-bold" : "text-gray-700 border-gray-400"}`}>
                        {stop}
                      </span>
                    ))}
                    <span className="text-gray-500 text-sm">+{bus.stops.length - 5} more</span>
                  </div>
                </div>

                <button onClick={() => { setSelectedBus(bus); setMode("student_detail"); }} className="mt-6 px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-all flex items-center justify-center">
                  <Bus className="w-5 h-5 mr-2" /> Track This Bus
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Student tracking view (detail)
  if (mode === "student_detail" && selectedBus) {
    return <BusRouteDetails bus={selectedBus} onBack={() => { setSelectedBus(null); setMode("student"); }} />;
  }

  return null;
}
