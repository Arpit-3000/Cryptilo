import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Lock, Globe } from "lucide-react";
import { generateMnemonic } from "bip39";
import { getDatabase, ref, get } from "firebase/database"; 
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import SHA256 from "crypto-js/sha256";



const WelcomePage = () => {
  const [showOptions, setShowOptions] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [mnemonic, setMnemonic] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");


  const navigate = useNavigate();


  const handleCreateWallet = async () => {

    const mn = generateMnemonic();
    setMnemonic(mn);
    console.log(mn);

  }

  const handleLogin = async () => {
  if (!loginUsername || !loginPassword) {
    toast.error("Please fill in both fields");
    return;
  }

  try {
    const db = getDatabase();
    const userRef = ref(db, `users/${loginUsername}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      toast.error("No user found with this username");
      return;
    }

    const data = snapshot.val();
    const storedHash = data.password;
    const inputHash = SHA256(loginPassword).toString();

    if (inputHash !== storedHash) {
      toast.error("Incorrect password");
      return;
    }

   
    toast.success("Login successful!");
    navigate("/wallet", {
      state: {
        username: loginUsername,
        mnemonic: data.mnemonic, 
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    toast.error("Something went wrong — please try again.");
  }
};


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
          Welcome to Cryptilo
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
                  onClick={() => { handleCreateWallet() }}
                >
                  Create Wallet
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="bg-gray-100 dark:bg-gray-700 dark:text-white text-purple-800 font-medium px-6 py-2 rounded-full w-48 shadow-md"
                  onClick={() => setShowLoginModal(true)}
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

          {/* Mnemonic Popup Modal */}
          <AnimatePresence>
            {mnemonic && (
              <motion.div
                initial={{ opacity: 0, y: "-50%", scale: 0.9 }}
                animate={{ opacity: 1, y: "0%", scale: 1 }}
                exit={{ opacity: 0, y: "-50%", scale: 0.9 }}
                transition={{ duration: 0.4 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-2 sm:px-4"
              >
                <motion.div
                  className="relative w-full max-w-3xl bg-white dark:bg-gray-900 p-6 sm:p-10 rounded-3xl shadow-2xl text-center border border-purple-300 dark:border-purple-700 overflow-y-auto max-h-[90vh]"
                >
                  {/* Close button */}
                  <button
                    onClick={() => setMnemonic("")}
                    className="absolute top-3 right-3 text-purple-600 dark:text-purple-300 hover:text-red-500 text-xl font-bold"
                  >
                    &times;
                  </button>
                  <h2 className="text-2xl sm:text-3xl font-bold text-purple-700 dark:text-purple-300 mb-4">
                    Your Wallet Recovery Phrase
                  </h2>
                  <p className="text-sm sm:text-md text-gray-600 dark:text-gray-300 mb-6 px-2">
                    Write down these 12 words in order and store them securely.
                  </p>

                  {/* Responsive Mnemonic Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8 px-2">
                    {mnemonic.split(" ").map((word, index) => (
                      <div
                        key={index}
                        className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white py-3 px-4 rounded-lg shadow-sm border border-purple-200 dark:border-purple-600 font-mono text-sm tracking-wide flex items-center"
                      >
                        <span className="font-semibold text-purple-500 mr-2">{index + 1}.</span>
                        {word}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      navigate("/register", { state: { mnemonic } });
                      setMnemonic("");
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3 rounded-full transition"
                  >
                    Click to Continue
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/*Login Model*/}
          <AnimatePresence>
            {showLoginModal && (
              <motion.div
                initial={{ opacity: 0, y: "-50%", scale: 0.9 }}
                animate={{ opacity: 1, y: "0%", scale: 1 }}
                exit={{ opacity: 0, y: "-50%", scale: 0.9 }}
                transition={{ duration: 0.4 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-2 sm:px-4"
              >
                <motion.div
                  className="relative w-full max-w-md bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl text-center border border-purple-300 dark:border-purple-700"
                >
                 
                  <button
                    onClick={() => setShowLoginModal(false)}
                    className="absolute top-3 right-3 text-purple-600 dark:text-purple-300 hover:text-red-500 text-xl font-bold"
                  >
                    &times;
                  </button>
                  <button
                    onClick={() => {
                      setShowLoginModal(false);
                    }}
                    className="absolute top-3 right-3 text-purple-600 dark:text-purple-300 hover:text-red-500 text-xl font-bold"
                  >
                    &times;
                  </button>

                  <h2 className="text-2xl font-bold text-purple-700 dark:text-purple-300 mb-4">
                    Login to Wallet
                  </h2>
                  <input
                    type="text"
                    placeholder="Username"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="w-full mb-4 px-4 py-2 rounded-lg border border-purple-300 focus:outline-none bg-gray-100 dark:bg-gray-800 dark:text-white"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full mb-4 px-4 py-2 rounded-lg border border-purple-300 focus:outline-none bg-gray-100 dark:bg-gray-800 dark:text-white"
                  />
                  <button
                    onClick={handleLogin}
                    className="w-full mb-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-lg transition"
                  >
                    Login
                  </button>
                  <button
                    className="text-sm text-purple-500 hover:underline"
                    onClick={() => toast.info("Forgot Password? Feature coming soon.")}
                  >
                    Forgot Password?
                  </button>

                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
