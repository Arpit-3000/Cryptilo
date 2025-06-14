import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Lock, Globe } from "lucide-react";

const WelcomePage = () => {
  const [showOptions, setShowOptions] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-white via-gray-100 to-purple-100 dark:from-black dark:via-gray-900 dark:to-purple-900 px-4 transition-colors duration-700 font-sans overflow-hidden relative">

      {/* Glowing cursor light */}
      <div
        className="pointer-events-none fixed top-0 left-0 w-full h-full z-0"
        style={{
          background: `radial-gradient(200px at ${mousePosition.x}px ${mousePosition.y}px, rgba(168,85,247,0.15), transparent 80%)`,
        }}
      />

      <div className="text-center z-10">
        <motion.h1
          className="text-4xl md:text-6xl font-extrabold text-purple-700 dark:text-purple-400 mb-4"
          initial={{ opacity: 0, y: -60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Welcome to Cry Wall
        </motion.h1>

        <motion.p
          className="text-gray-700 dark:text-gray-300 mb-8 text-lg md:text-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.7 }}
        >
          Your secure and smart way to manage digital assets.
        </motion.p>

        <motion.p
          className="text-purple-500 dark:text-purple-300 mb-10 text-sm md:text-base italic"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: [20, 10, 20] }}
          transition={{ delay: 1, duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          Fast. Safe. Decentralized.
        </motion.p>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowOptions(!showOptions)}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3 rounded-full shadow-xl transition duration-300"
        >
          {showOptions ? "Get Back" : "Get Started"}
        </motion.button>

        {/* Toggle Content Smoothly */}
        <div className="mt-8 relative h-[160px] md:h-[180px]">
        <AnimatePresence>
          {showOptions && (
            <motion.div
              key="options"
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 80 }}
              transition={{ duration: 0.5 }}
              className="mt-8 flex flex-col items-center gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="bg-white dark:bg-gray-800 dark:text-white text-purple-800 font-medium px-6 py-2 rounded-full w-48 shadow-md"
              >
                Create Wallet
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                className="bg-gray-100 dark:bg-gray-700 dark:text-white text-purple-800 font-medium px-6 py-2 rounded-full w-48 shadow-md"
              >
                Existing Wallet
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
        </div>

        {/* Feature Highlights */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 text-left px-4 max-w-5xl mx-auto">
          {[{
            icon: <ShieldCheck size={32} />,
            title: "Security First",
            desc: "Top-grade encryption ensures your assets are always safe."
          }, {
            icon: <Lock size={32} />,
            title: "Private Keys",
            desc: "Only you hold access. Privacy is guaranteed."
          }, {
            icon: <Globe size={32} />,
            title: "Global Access",
            desc: "Manage your wallet from anywhere in the world."
          }].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-md border border-purple-300/30 dark:border-white/20 rounded-2xl p-6 shadow-xl text-gray-900 dark:text-white transition-all"
            >
              <div className="mb-3 text-purple-600 dark:text-purple-300">{item.icon}</div>
              <h3 className="text-lg font-bold mb-1">{item.title}</h3>
              <p className="text-sm leading-snug">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
