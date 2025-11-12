// import React, { useEffect, useState } from "react";
// import { ArrowLeft, Bus, MapPin, Clock } from "lucide-react";

// const BusRouteDetails = ({ bus, onBack }) => {
//   const [currentProgress, setCurrentProgress] = useState(bus.progress);
//   const [eta, setEta] = useState(parseInt(bus.eta));
//   const [currentStop, setCurrentStop] = useState(bus.currentStop);
//   const [nextStop, setNextStop] = useState(bus.nextStop);
//   const [liveStops] = useState(bus.stops);

//   // Live simulation: updates every 5 seconds
//   useEffect(() => {
//     const interval = setInterval(() => {
//       setEta((prev) => (prev > 1 ? prev - 1 : 0));

//       if (eta <= 1 && currentProgress < bus.totalStops) {
//         const newProgress = currentProgress + 1;
//         setCurrentProgress(newProgress);

//         const newCurrentStop = bus.stops[newProgress - 1];
//         const newNextStop = bus.stops[newProgress] || "Destination Reached";

//         setCurrentStop(newCurrentStop);
//         setNextStop(newNextStop);
//         setEta(Math.floor(Math.random() * 5) + 3); // randomize next ETA
//       }
//     }, 5000);

//     return () => clearInterval(interval);
//   }, [eta, currentProgress]);

//   const progressPercent = (currentProgress / bus.totalStops) * 100;

//   return (
//     <div className="min-h-screen w-full bg-white text-black font-inter transition-all duration-500">
//       {/* Header */}
//       <div className="bg-black text-white py-6 px-6 flex justify-between items-center">
//         <button
//           onClick={onBack}
//           className="flex items-center text-sm font-semibold hover:underline"
//         >
//           <ArrowLeft className="w-4 h-4 mr-2" />
//           Back to Routes
//         </button>
//         <span className="bg-white text-black px-4 py-1 rounded-full font-semibold text-sm">
//           {bus.status}
//         </span>
//       </div>

//       {/* Main Container */}
//       <div className="max-w-5xl mx-auto px-6 py-8">
//         {/* Route Header */}
//         <h1 className="text-3xl font-black mb-2">{bus.name}</h1>
//         <p className="text-gray-600 flex items-center gap-2 mb-8">
//           <Bus className="w-4 h-4" />
//           {bus.from} → {bus.to}
//         </p>

//         {/* Current Info Card */}
//         <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-6 mb-8 transition-all duration-500">
//           <div className="mb-4">
//             <p className="text-gray-600 mb-2 flex items-center gap-2">
//               <MapPin className="w-4 h-4" />
//               Bus is currently at:
//             </p>
//             <h3 className="text-xl font-black">{currentStop}</h3>
//           </div>
//           <div className="mb-4">
//             <p className="text-gray-600 mb-2 flex items-center gap-2">
//               ⏩ Next stop:
//             </p>
//             <h3 className="text-xl font-black">{nextStop}</h3>
//           </div>
//           <div className="flex items-center text-gray-700 border-t border-gray-200 pt-4">
//             <Clock className="w-4 h-4 mr-2" />
//             ETA: <span className="font-bold ml-1">{eta} min</span>
//           </div>
//         </div>

//         {/* Progress Bar */}
//         <div className="mb-8 transition-all duration-500">
//           <div className="flex justify-between text-sm mb-2">
//             <span>{bus.from}</span>
//             <span className="text-gray-500">
//               {currentProgress} of {bus.totalStops} stops
//             </span>
//             <span>{bus.to}</span>
//           </div>
//           <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
//             <div
//               className="h-full bg-black transition-all duration-700 ease-in-out"
//               style={{ width: `${progressPercent}%` }}
//             ></div>
//           </div>
//         </div>

//         {/* Stops List */}
//         <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden transition-all duration-500">
//           {liveStops.map((stop, index) => {
//             const isPassed = index + 1 < currentProgress;
//             const isCurrent = index + 1 === currentProgress;

//             return (
//               <div
//                 key={index}
//                 className={`flex justify-between items-center px-6 py-4 border-b border-gray-100 ${
//                   isCurrent ? "bg-black text-white" : "bg-white text-black"
//                 } transition-all duration-500`}
//               >
//                 <div className="flex items-center gap-3">
//                   <div
//                     className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${
//                       isCurrent
//                         ? "bg-white text-black"
//                         : "bg-gray-100 text-gray-700"
//                     }`}
//                   >
//                     {index + 1}
//                   </div>
//                   <div>
//                     <p className="font-semibold">{stop}</p>
//                     {isCurrent && (
//                       <p className="text-xs text-gray-300">Current Location</p>
//                     )}
//                   </div>
//                 </div>
//                 <div className="text-sm font-semibold">
//                   {isPassed
//                     ? "Passed"
//                     : isCurrent
//                     ? "Now"
//                     : `${index * 6 + 32} min`}
//                 </div>
//               </div>
//             );
//           })}
//         </div>

//         {/* Stats */}
//         <div className="grid grid-cols-3 gap-6 my-12">
//           <div className="p-6 border border-gray-200 rounded-2xl shadow-xl text-center">
//             <h3 className="text-3xl font-black">{bus.totalStops}</h3>
//             <p className="text-gray-600 text-sm mt-2">TOTAL STOPS</p>
//           </div>
//           <div className="p-6 border border-gray-200 rounded-2xl shadow-xl text-center">
//             <h3 className="text-3xl font-black">{currentProgress}</h3>
//             <p className="text-gray-600 text-sm mt-2">COMPLETED</p>
//           </div>
//           <div className="p-6 border border-gray-200 rounded-2xl shadow-xl text-center">
//             <h3 className="text-3xl font-black">{bus.totalStops * 6}</h3>
//             <p className="text-gray-600 text-sm mt-2">TOTAL TIME (MIN)</p>
//           </div>
//         </div>

//         {/* Live Status */}
//         <div className="bg-black text-white py-4 px-6 rounded-xl flex items-center justify-center font-semibold shadow-xl">
//           <span className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></span>
//           LIVE TRACKING ACTIVE
//         </div>
//       </div>
//     </div>
//   );
// };

import React, { useEffect, useState } from "react";
import { ArrowLeft, Bus } from "lucide-react";

const BusRouteDetails = ({ bus, onBack }) => {
  const [currentIndex, setCurrentIndex] = useState(bus.progress - 1 || 4);
  const [stops, setStops] = useState([]);
  const [elapsed, setElapsed] = useState(0); // simulate time in minutes

  // Base start time for schedule (e.g., 12:00 AM)
  const baseTime = new Date();
  baseTime.setHours(0, 0, 0, 0);

  // Initialize schedule dynamically
  useEffect(() => {
    const updatedStops = bus.stops.map((name, i) => {
      const scheduled = new Date(baseTime.getTime() + i * 6 * 60000); // +6 mins per stop
      return {
        id: i + 1,
        name,
        scheduled,
        actual: null,
        status: i === 0 ? "Departed" : "Upcoming",
        diff: "",
      };
    });
    setStops(updatedStops);
  }, [bus.stops]);

  // Simulate real-time progress
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1); // simulate 1 minute per tick

      setStops((prevStops) =>
        prevStops.map((stop, i) => {
          if (i < currentIndex) return stop; // already passed
          if (i === currentIndex) {
            // bus at this stop
            if (!stop.actual && elapsed % 5 === 0) {
              // bus "arrives" every ~5 simulated mins
              const now = new Date(baseTime.getTime() + elapsed * 60000);
              const diffMin = Math.round((now - stop.scheduled) / 60000);
              return {
                ...stop,
                actual: now,
                status: "Arrived",
                diff:
                  diffMin > 0
                    ? `${diffMin} min late`
                    : `${Math.abs(diffMin)} min early`,
              };
            }
            return stop;
          }
          if (i === currentIndex + 1) {
            return { ...stop, status: "Next Stop (ETA)", diff: "" };
          }
          return stop;
        })
      );

      // Move bus forward every 15 simulated mins
      if (elapsed !== 0 && elapsed % 15 === 0) {
        setCurrentIndex((prev) => (prev < bus.totalStops - 1 ? prev + 1 : prev));
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [elapsed, currentIndex]);

  const formatTime = (date) =>
    date
      ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "--:--";

  const progressPercent = ((currentIndex / (bus.totalStops - 1)) * 100).toFixed(2);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-inter">
      {/* Header */}
      <div className="bg-black text-white py-5 px-6 flex justify-between items-center">
        <button
          onClick={onBack}
          className="flex items-center text-sm font-semibold hover:underline"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Routes
        </button>
        <span className="bg-white text-black px-4 py-1 rounded-full font-semibold text-sm">
          Live Tracking
        </span>
      </div>

      {/* Main */}
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-black">{bus.name}</h1>
          <span className="bg-gray-100 px-3 py-1 rounded-full font-semibold text-gray-700">
            {progressPercent}%
          </span>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-3xl shadow-xl p-10">
          <h3 className="text-2xl font-bold mb-10">Route Progress</h3>

          <div className="relative pl-14">
            {/* Main line */}
            <div className="absolute top-0 left-[35px] w-1 h-full bg-gray-800 rounded-full" />
            {/* Progress line */}
            <div
              className="absolute top-0 left-[35px] w-1 bg-green-500 rounded-full transition-all duration-700"
              style={{
                height: `${progressPercent}%`,
              }}
            />

            {/* Stops */}
            <div className="space-y-10 relative z-10">
              {stops.map((stop, i) => {
                const isCurrent = i === currentIndex;
                const isPast = i < currentIndex;

                return (
                  <div
                    key={stop.id}
                    className="flex justify-between items-start relative"
                  >
                    {/* Left timeline */}
                    <div className="relative w-20 flex justify-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-md transition-all duration-500 ${
                          isCurrent
                            ? "bg-blue-500 text-white border-blue-300 animate-pulse ring-4 ring-blue-200"
                            : isPast
                            ? "bg-green-500 text-white border-green-400"
                            : "bg-gray-300 text-gray-400 border-gray-300"
                        }`}
                      >
                        <Bus className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Stop info */}
                    <div className="flex-1 ml-4">
                      <p
                        className={`font-bold text-lg ${
                          isCurrent
                            ? "text-blue-600"
                            : isPast
                            ? "text-gray-900"
                            : "text-gray-500"
                        }`}
                      >
                        {stop.name}
                      </p>
                      {stop.status && (
                        <div className="mt-1">
                          <span
                            className={`text-xs font-semibold px-3 py-1 rounded-full ${
                              isCurrent
                                ? "bg-blue-100 text-blue-700"
                                : isPast
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {stop.status}
                          </span>
                          {stop.diff && (
                            <span
                              className={`text-xs ml-2 ${
                                stop.diff.includes("early")
                                  ? "text-green-600"
                                  : stop.diff.includes("late")
                                  ? "text-red-600"
                                  : "text-gray-500"
                              }`}
                            >
                              ⚡ {stop.diff}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Timing info */}
                    <div className="text-right w-32">
                      {stop.actual && (
                        <>
                          <p className="text-sm text-gray-500 font-medium">
                            Actual Arrival
                          </p>
                          <p
                            className={`text-xl font-bold ${
                              isCurrent ? "text-blue-600" : "text-green-600"
                            }`}
                          >
                            {formatTime(stop.actual)}
                          </p>
                        </>
                      )}
                      <p className="text-sm text-gray-500 font-medium mt-1">
                        Scheduled
                      </p>
                      <p className="text-gray-700 text-sm font-semibold">
                        {formatTime(stop.scheduled)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="grid sm:grid-cols-4 gap-6">
          <div className="bg-white shadow-md rounded-2xl p-6 text-center">
            <h3 className="text-3xl font-bold">{bus.totalStops}</h3>
            <p className="text-gray-500 text-sm mt-1">Total Stops</p>
          </div>
          <div className="bg-green-50 shadow-md rounded-2xl p-6 text-center">
            <h3 className="text-3xl font-bold text-green-700">
              {currentIndex + 1}
            </h3>
            <p className="text-gray-500 text-sm mt-1">Completed</p>
          </div>
          <div className="bg-white shadow-md rounded-2xl p-6 text-center">
            <h3 className="text-3xl font-bold">
              {bus.totalStops - (currentIndex + 1)}
            </h3>
            <p className="text-gray-500 text-sm mt-1">Remaining</p>
          </div>
          <div className="bg-blue-50 shadow-md rounded-2xl p-6 text-center">
            <h3 className="text-3xl font-bold text-blue-600">
              {Math.max(5, (bus.totalStops - (currentIndex + 1)) * 6)}
            </h3>
            <p className="text-gray-500 text-sm mt-1">Mins Left</p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-black to-gray-900 text-white py-5 px-6 rounded-2xl flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <h4 className="font-bold uppercase tracking-wide">
              Live Tracking Active
            </h4>
          </div>
          <p className="text-gray-300 text-sm">
            Real-time bus arrival updates
          </p>
        </div>
      </div>
    </div>
  );
};

export default BusRouteDetails;
