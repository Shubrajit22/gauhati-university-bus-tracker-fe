import React, { useEffect, useState } from "react";
import { ArrowLeft, Bus } from "lucide-react";

const BusRouteDetails = ({ bus, onBack }) => {
  const [currentIndex, setCurrentIndex] = useState(bus.progress - 1 || 4);
  const [stops, setStops] = useState([]);
  const [elapsed, setElapsed] = useState(0);

  const baseTime = new Date();
  baseTime.setHours(0, 0, 0, 0);

  useEffect(() => {
    const updatedStops = bus.stops.map((name, i) => {
      const scheduled = new Date(baseTime.getTime() + i * 6 * 60000);
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

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);

      setStops((prevStops) =>
        prevStops.map((stop, i) => {
          if (i < currentIndex) return stop;

          if (i === currentIndex) {
            if (!stop.actual && elapsed % 5 === 0) {
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
      <div className="bg-black text-white py-4 px-4 sm:px-6 flex justify-between items-center">
        <button
          onClick={onBack}
          className="flex items-center text-xs sm:text-sm font-semibold hover:underline"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </button>
        <span className="bg-white text-black px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
          Live Tracking
        </span>
      </div>

      {/* Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-10">

        {/* Bus Name */}
        <div className="flex justify-between items-center">
          <h1 className="text-xl sm:text-3xl font-black">{bus.name}</h1>
          <span className="bg-gray-100 px-3 py-1 rounded-full font-semibold text-gray-700 text-xs sm:text-sm">
            {progressPercent}%
          </span>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-5 sm:p-10">
          <h3 className="text-lg sm:text-2xl font-bold mb-6 sm:mb-10">
            Route Progress
          </h3>

          <div className="relative pl-10 sm:pl-14">

            {/* Main line */}
            <div className="absolute top-0 left-6 sm:left-[35px] w-1 h-full bg-gray-800 rounded-full" />

            {/* Progress line */}
            <div
              className="absolute top-0 left-6 sm:left-[35px] w-1 bg-green-500 rounded-full transition-all duration-700"
              style={{
                height: `${progressPercent}%`,
              }}
            />

            <div className="space-y-6 sm:space-y-10 relative z-10">
              {stops.map((stop, i) => {
                const isCurrent = i === currentIndex;
                const isPast = i < currentIndex;

                return (
                  <div key={stop.id} className="flex justify-between items-start">

                    {/* Dot + Icon */}
                    <div className="relative w-12 sm:w-20 flex justify-center">
                      <div
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 shadow-md transition-all duration-500 ${
                          isCurrent
                            ? "bg-blue-500 text-white border-blue-300 animate-pulse ring-2 sm:ring-4 ring-blue-200"
                            : isPast
                            ? "bg-green-500 text-white border-green-400"
                            : "bg-gray-300 text-gray-400 border-gray-300"
                        }`}
                      >
                        <Bus className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                    </div>

                    {/* Stop name + status */}
                    <div className="flex-1 ml-3 sm:ml-4">
                      <p
                        className={`font-bold text-sm sm:text-lg ${
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
                            className={`text-[10px] sm:text-xs font-semibold px-2 py-1 sm:px-3 sm:py-1 rounded-full ${
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
                              className={`text-[10px] sm:text-xs ml-2 ${
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

                    {/* Timing */}
                    <div className="text-right w-20 sm:w-32">
                      {stop.actual && (
                        <>
                          <p className="text-[10px] sm:text-sm text-gray-500 font-medium">
                            Actual
                          </p>
                          <p
                            className={`text-sm sm:text-xl font-bold ${
                              isCurrent ? "text-blue-600" : "text-green-600"
                            }`}
                          >
                            {formatTime(stop.actual)}
                          </p>
                        </>
                      )}
                      <p className="text-[10px] sm:text-sm text-gray-500 font-medium mt-1">
                        Scheduled
                      </p>
                      <p className="text-gray-700 text-xs sm:text-sm font-semibold">
                        {formatTime(stop.scheduled)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white shadow-md rounded-xl p-4 sm:p-6 text-center">
            <h3 className="text-xl sm:text-3xl font-bold">{bus.totalStops}</h3>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">Total Stops</p>
          </div>
          <div className="bg-green-50 shadow-md rounded-xl p-4 sm:p-6 text-center">
            <h3 className="text-xl sm:text-3xl font-bold text-green-700">
              {currentIndex + 1}
            </h3>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">Completed</p>
          </div>
          <div className="bg-white shadow-md rounded-xl p-4 sm:p-6 text-center">
            <h3 className="text-xl sm:text-3xl font-bold">
              {bus.totalStops - (currentIndex + 1)}
            </h3>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">Remaining</p>
          </div>
          <div className="bg-blue-50 shadow-md rounded-xl p-4 sm:p-6 text-center">
            <h3 className="text-xl sm:text-3xl font-bold text-blue-600">
              {Math.max(5, (bus.totalStops - (currentIndex + 1)) * 6)}
            </h3>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">Mins Left</p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-black to-gray-900 text-white py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse" />
            <h4 className="font-bold uppercase tracking-wide text-xs sm:text-sm">
              Live Tracking Active
            </h4>
          </div>
          <p className="text-gray-300 text-[10px] sm:text-sm">
            Real-time bus updates
          </p>
        </div>
      </div>
    </div>
  );
};

export default BusRouteDetails;
