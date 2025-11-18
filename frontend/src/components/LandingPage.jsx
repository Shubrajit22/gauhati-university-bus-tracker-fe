

import {
  MapPin,
  Clock,
  Users,
  Shield,
  Bus,
  Navigation,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();
  const features = [
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Real-time Tracking",
      description:
        "Track university buses in real-time with precise location updates.",
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Accurate ETAs",
      description: "Get reliable estimated arrival times for better planning.",
    },
    {
      icon: <Navigation className="w-6 h-6" />,
      title: "Route Information",
      description: "Complete route maps with all bus stops and timings.",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Student Friendly",
      description: "Designed specifically for university students and staff.",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Reliable Service",
      description: "Dependable tracking system for daily commuting needs.",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Instant Updates",
      description: "Lightning-fast notifications and route updates.",
    },
  ];

  return (
    <div className="relative min-h-screen w-full bg-gray-100 overflow-hidden font-inter">
      {/* ✅ Grid Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e5e7eb 1px, transparent 2px),
            linear-gradient(to bottom, #e5e7eb 1px, transparent 2px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* ✅ Logo */}
      <div className="relative z-10 flex justify-center pt-10 sm:pt-12 md:pt-16">
        <img
          src="/image.png"
          alt="Gauhati University Logo"
          className="w-24 sm:w-32 md:w-40 lg:w-48 h-auto object-contain "
        />
      </div>

      {/* ✅ Hero Section */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 py-12 sm:py-24 md:py-32 lg:py-22">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-extrabold leading-snug max-w-4xl">
          Welcome to{" "}
          <span className="text-black">
            Gauhati University Bus Tracking System
          </span>
        </h1>

        <p className="text-gray-700 font-bold text-base sm:text-lg md:text-xl mt-6 max-w-2xl">
          Never miss your university bus again. Experience real-time tracking,
          accurate arrival times, and seamless commute planning.
        </p>

        <button
          onClick={() => navigate("/bus-tracking")}
          className="mt-10 sm:mt-12 px-8 py-4 sm:px-10 sm:py-5 cursor-pointer rounded-xl bg-black text-white text-base sm:text-lg font-semibold hover:bg-gray-900 transform hover:scale-105 transition-all duration-300 shadow-2xl flex items-center"
        >
          <Bus className="w-5 h-5 mr-2" />
          Get Started Now
        </button>
      </section>

      {/* ✅ Divider Line */}
      <div className="w-16 h-1 bg-black mx-auto my-12 sm:my-16"></div>

      {/* ✅ Features Grid */}
      <section className="relative z-10 px-4 py-10 sm:py-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-6 sm:p-8 border-2 rounded-lg border-black bg-white hover:bg-black hover:text-white transition-all duration-300 hover:-translate-y-2 cursor-default shadow-sm"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-black text-white group-hover:bg-white group-hover:text-black flex items-center justify-center rounded-md transition-all duration-300">
                  {feature.icon}
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg sm:text-xl font-bold">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 group-hover:text-white/80 transition-colors text-sm sm:text-base leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ✅ CTA Section */}
      <section className="relative z-10 py-20 sm:py-28 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center px-6 space-y-8">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
            Start Tracking Your Bus
          </h2>
          <div className="w-16 h-1 bg-black mx-auto" />
          <p className="text-base sm:text-lg text-gray-700 leading-relaxed max-w-2xl mx-auto">
            Join hundreds of students and staff who are already using our
            tracking system to make their daily commute more efficient and
            predictable.
          </p>
          <button
            onClick={() => navigate("/bus-tracking")}
            className="mt-4 px-8 py-4 sm:px-10 sm:py-5 rounded-xl cursor-pointer bg-black text-white text-base sm:text-lg font-semibold hover:bg-gray-900 transform hover:scale-105 transition-all duration-300 shadow-2xl flex items-center justify-center mx-auto"
          >
            <Bus className="w-5 h-5 mr-2" />
            Get Started Now
          </button>
        </div>
      </section>

      {/* ✅ Footer */}
      <footer className="relative z-10 bg-black text-white text-center py-6 mt-10">
        <p className="text-sm sm:text-base font-medium">
          © {new Date().getFullYear()} All Rights Reserved | IT Department, Gauhati University
        </p>
        <p className="text-xs sm:text-sm text-gray-400 mt-2">
          Developed by <span className="font-semibold text-white">Shubrajit Deb</span> &{" "}
          <span className="font-semibold text-white">Midanka Lahon</span>
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;

