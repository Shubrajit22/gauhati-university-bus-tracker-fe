import React, { useState, useEffect, useRef } from "react";
import { Bus, LogOut, Play, Square, Navigation, Clock } from "lucide-react";
import BusRouteDetails from "./BusRouteDetails";

const WS_URL = "ws://localhost:3001";

export default function BusTrackingApp() {
  const [mode, setMode] = useState("select");
  const [ws, setWs] = useState(null);
  const [connected, setConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const [driverCredentials, setDriverCredentials] = useState({
    username: "",
    password: "",
  });
  const [driverInfo, setDriverInfo] = useState(null);
  const [journeyActive, setJourneyActive] = useState(false);
  const [currentLocation, setCurrentLocation] = useState({
    lat: 26.1445,
    lng: 91.7362,
  });
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [routes, setRoutes] = useState({});
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [busLocation, setBusLocation] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Cleanup
  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current)
        clearTimeout(reconnectTimeoutRef.current);
    };
  }, []);

  const connectWebSocket = () => {
    if (isConnecting) return;

    setIsConnecting(true);
    const socket = new WebSocket(WS_URL);

    socket.onopen = () => {
      setConnected(true);
      setIsConnecting(false);
      setWs(socket);
      wsRef.current = socket;
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleMessage(data);
    };

    socket.onclose = () => {
      setConnected(false);
      setIsConnecting(false);
      setWs(null);
      wsRef.current = null;

      if (mode !== "select") {
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
      }
    };

    socket.onerror = () => setIsConnecting(false);
  };

  const handleMessage = (data) => {
    switch (data.type) {
      case "login_success":
        setDriverInfo(data.driver);
        setIsLoggingIn(false);
        break;
      case "login_failed":
        alert(data.message);
        setIsLoggingIn(false);
        break;
      case "journey_started":
        setJourneyActive(true);
        break;
      case "journey_stopped":
        setJourneyActive(false);
        break;
      case "buses_list":
        setRoutes(data.routes);
        setBuses(data.buses);
        break;
      case "location_update":
      case "bus_status_update":
        setBusLocation(data.bus);
        setLastUpdateTime(new Date());
        break;
      default:
        break;
    }
  };

  const handleDriverLogin = () => {
    setIsLoggingIn(true);
    const payload = {
      type: "driver_login",
      username: driverCredentials.username,
      password: driverCredentials.password,
    };

    if (!ws) {
      connectWebSocket();
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify(payload));
        }
      }, 500);
    } else {
      ws.send(JSON.stringify(payload));
    }
  };

  const handleStartJourney = () =>
    ws?.send(JSON.stringify({ type: "start_journey" }));

  const handleStopJourney = () =>
    ws?.send(JSON.stringify({ type: "stop_journey" }));

  const simulateMovement = () => {
    if (!journeyActive || !ws) return;
    const newLat = currentLocation.lat + (Math.random() - 0.5) * 0.001;
    const newLng = currentLocation.lng + (Math.random() - 0.5) * 0.001;
    setCurrentLocation({ lat: newLat, lng: newLng });

    ws.send(
      JSON.stringify({
        type: "location_update",
        lat: newLat,
        lng: newLng,
      })
    );
  };

  useEffect(() => {
    if (journeyActive) {
      const interval = setInterval(simulateMovement, 2000);
      return () => clearInterval(interval);
    }
  }, [journeyActive, currentLocation, ws]);

  const handleStudentMode = () => {
    setMode("student");
    connectWebSocket();
    setTimeout(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "get_buses" }));
      }
    }, 500);
  };

  const handleBusSelect = (bus) => {
    setSelectedBus(bus);
    ws?.send(
      JSON.stringify({
        type: "student_subscribe",
        routeId: bus.routeId,
        busId: bus.busId,
      })
    );
  };

  const handleLogout = () => {
    ws?.close();
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    setMode("select");
    setDriverInfo(null);
    setJourneyActive(false);
    setSelectedBus(null);
    setBusLocation(null);
    setDriverCredentials({ username: "", password: "" });
  };

  // 🖤 Reusable Background
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

  // ---- Select Screen ----
  if (mode === "select") {
    return (
      <div className="min-h-screen w-full bg-black relative text-white flex items-center justify-center p-6">
        <Background />
        <div className="relative z-10 text-center space-y-8">
          <h1 className="text-5xl text-black font-black">
            Bus Tracking System
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <button
              onClick={() => setMode("driver")}
              className="bg-white text-black hover:bg-gray-800 hover:text-white cursor-pointer transition-all rounded-2xl border-2  p-8 font-bold text-xl"
            >
              Driver Portal
            </button>
            <button
              onClick={handleStudentMode}
              className="bg-white text-black hover:bg-gray-800 hover:text-white cursor-pointer transition-all rounded-2xl p-8 font-bold text-xl border-2 "
            >
              Student Portal
            </button>
          </div>
        </div>
      </div>
    );
  }
{/* ---- Driver Login ---- */}
if (mode === "driver" && !driverInfo) {
  return (
    <div className="min-h-screen w-full bg-black relative flex items-center justify-center text-white p-6">
      <Background />
      <div className="relative z-10 bg-black border border-gray-700 p-8 rounded-3xl w-full max-w-md space-y-6">
        <h2 className="text-3xl font-bold text-center">Driver Login</h2>
        <p className="text-center text-yellow-400 font-semibold">
          🚧 The Driver Portal is currently in development mode.
        </p>
        <input
          type="text"
          value={driverCredentials.username}
          onChange={(e) =>
            setDriverCredentials({
              ...driverCredentials,
              username: e.target.value,
            })
          }
          placeholder="Username"
          className="w-full p-3 rounded-xl bg-black border border-gray-600 text-white"
        />
        <input
          type="password"
          value={driverCredentials.password}
          onChange={(e) =>
            setDriverCredentials({
              ...driverCredentials,
              password: e.target.value,
            })
          }
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
        <button
          onClick={() => setMode("select")}
          className="w-full bg-black border border-gray-500 hover:bg-gray-900 rounded-xl p-3 font-bold text-white"
        >
          Back
        </button>
      </div>
    </div>
  );
}
  // ---- Driver Login ----
  // if (mode === "driver" && !driverInfo) {
  //   return (
  //     <div className="min-h-screen w-full bg-black relative flex items-center justify-center text-white p-6">
  //       <Background />
  //       <div className="relative z-10 bg-black border border-gray-700 p-8 rounded-3xl w-full max-w-md space-y-6">
  //         <h2 className="text-3xl font-bold text-center">Driver Login</h2>
  //         <input
  //           type="text"
  //           value={driverCredentials.username}
  //           onChange={(e) =>
  //             setDriverCredentials({
  //               ...driverCredentials,
  //               username: e.target.value,
  //             })
  //           }
  //           placeholder="Username"
  //           className="w-full p-3 rounded-xl bg-black border border-gray-600 text-white"
  //         />
  //         <input
  //           type="password"
  //           value={driverCredentials.password}
  //           onChange={(e) =>
  //             setDriverCredentials({
  //               ...driverCredentials,
  //               password: e.target.value,
  //             })
  //           }
  //           placeholder="Password"
  //           className="w-full p-3 rounded-xl bg-black border border-gray-600 text-white"
  //         />
  //         <button
  //           onClick={handleDriverLogin}
  //           disabled={isLoggingIn}
  //           className="w-full bg-white text-black hover:bg-gray-200 transition-all rounded-xl p-3 font-bold"
  //         >
  //           {isLoggingIn ? "Logging in..." : "Login"}
  //         </button>
  //         <button
  //           onClick={() => setMode("select")}
  //           className="w-full bg-black border border-gray-500 hover:bg-gray-900 rounded-xl p-3 font-bold text-white"
  //         >
  //           Back
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

  // ---- Driver Dashboard ----
  if (mode === "driver" && driverInfo) {
    return (
      <div className="min-h-screen w-full bg-black relative text-white p-6">
        <Background />
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">Welcome, {driverInfo.name}</h2>
            <button
              onClick={handleLogout}
              className="bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-xl font-semibold"
            >
              <LogOut className="inline w-4 h-4 mr-1" /> Logout
            </button>
          </div>

          <div className="p-6 bg-black border border-gray-600 rounded-2xl">
            <h3 className="text-xl font-bold mb-3 flex items-center">
              <Navigation className="w-5 h-5 mr-2" /> Journey Control
            </h3>
            {!journeyActive ? (
              <button
                onClick={handleStartJourney}
                className="bg-white text-black hover:bg-gray-200 w-full rounded-xl p-3 font-bold"
              >
                <Play className="inline w-4 h-4 mr-1" /> Start Journey
              </button>
            ) : (
              <button
                onClick={handleStopJourney}
                className="bg-white text-black hover:bg-gray-200 w-full rounded-xl p-3 font-bold"
              >
                <Square className="inline w-4 h-4 mr-1" /> Stop Journey
              </button>
            )}
            {journeyActive && (
              <div className="mt-4 text-sm text-gray-400">
                <p>Latitude: {currentLocation.lat.toFixed(6)}</p>
                <p>Longitude: {currentLocation.lng.toFixed(6)}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---- Student Interface ----
  if (mode === "student" && !selectedBus) {
    // 4 mock bus routes for now
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
        stops: [
          "AT7 Boys Hall",
          "University Gate",
          "Jalukbari Flyover",
          "Jalukbari Market",
          "Maligaon Station",
          "Kamakhya Temple",
          "A.T. Road",
          "Bharalumukh",
          "Uzanbazar",
          "Chandmari",
        ],
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
        stops: [
          "AT5 Girls Hostel",
          "University Gate",
          "Jalukbari Market",
          "Maligaon Station",
          "Kamakhya Temple",
          "Bharalumukh",
          "Fancy Bazaar",
          "Uzanbazar",
          "RG Baruah Road",
        ],
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
        stops: [
          "Science Block",
          "University Gate",
          "Bharalumukh",
          "Paltan Bazaar",
          "GS Road",
          "Zoo Road",
          "Ganeshguri",
          "Six Mile",
          "Khanapara Gate",
          "Khanapara",
          "Dispur",
        ],
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
        stops: [
          "AT3 Hostel",
          "Science Block",
          "University Gate",
          "Jalukbari Market",
          "Jalukbari Flyover",
          "Maligaon Station",
          "A.T. Road",
          "Jalukbari",
        ],
        eta: "10 min",
        status: "Starting",
      },
    ];

    return (
      <div className="min-h-screen w-full bg-gray-700 relative text-white p-6">
        <Background />

        <div className="relative z-10 max-w-6xl mx-auto space-y-8 ">
          <div className="flex gap-180">
            <h2 className="text-4xl text-black font-bold mb-6 text-center ml-8">
              Available Buses
            </h2>
            <div className="text-center  ">
              <button
                onClick={handleLogout}
                className="bg-white text-black border-2 hover:bg-gray-200 px-6 py-3 rounded-xl font-semibold"
              >
                <LogOut className="inline w-5 h-5 mr-1" /> Back
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {busCards.map((bus) => (
              <div
                key={bus.id}
                className="bg-white shadow-2xl border border-gray-300 rounded-2xl p-6 flex flex-col justify-between hover:shadow-2xl transition-all duration-300"
              >
                {/* Header */}
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-2xl text-black font-bold">
                      {bus.name}
                    </h3>
                    <span className="bg-black text-white px-3 py-1 rounded-full text-sm font-semibold">
                      {bus.status}
                    </span>
                  </div>

                  <p className="text-gray-700 flex items-center text-sm mb-6">
                    <Bus className="w-4 h-4 mr-2" /> {bus.from} → {bus.to}
                  </p>

                  {/* Bus Info */}
                  <div className="bg-gray-100 border border-gray-300 rounded-xl p-4 mb-6">
                    <p className="mb-2 text-black">
                      🚌 Bus is currently at:{" "}
                      <span className="font-semibold underline text-black">
                        {bus.currentStop}
                      </span>
                    </p>
                    <p className="text-black">
                      ⏩ Next stop:{" "}
                      <span className="font-semibold">{bus.nextStop}</span>
                    </p>
                    <p className="mt-2 text-gray-600 text-sm">
                      ETA: <span className="font-semibold">{bus.eta}</span>
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>{bus.from}</span>
                      <span>
                        {bus.progress} of {bus.totalStops} stops
                      </span>
                      <span>{bus.to}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-black"
                        style={{
                          width: `${(bus.progress / bus.totalStops) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Stops */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {bus.stops.slice(0, 5).map((stop, i) => (
                      <span
                        key={i}
                        className={`px-3 py-1 text-xs rounded-full border ${
                          stop === bus.currentStop
                            ? "bg-black text-white font-bold"
                            : "text-gray-700 border-gray-400"
                        }`}
                      >
                        {stop}
                      </span>
                    ))}
                    <span className="text-gray-500 text-sm">
                      +{bus.stops.length - 5} more
                    </span>
                  </div>
                </div>

                {/* Button */}
                <button
                  onClick={() => setSelectedBus(bus)}
                  className="mt-6 px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-all flex items-center justify-center"
                >
                  <Bus className="w-5 h-5 mr-2" />
                  Track This Bus
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  // ---- Student Tracking View ----
if (mode === "student" && selectedBus) {
  return (
    <BusRouteDetails
      bus={selectedBus}
      onBack={() => setSelectedBus(null)}
    />
  );
}


  return null;
}
