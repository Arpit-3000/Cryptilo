import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getDatabase, ref, get, remove } from "firebase/database";
import SHA256 from "crypto-js/sha256";
import toast from "react-hot-toast";
import { useNetwork } from "../context/NetworkContext";

const SettingsMenu = ({ username, mnemonic }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState("");
  const [showConfirmationPrompt, setShowConfirmationPrompt] = useState(false);
  const [showDevMenu, setShowDevMenu] = useState(false);
  const menuRef = useRef();
  const navigate = useNavigate();
  const { network, setNetwork } = useNetwork();

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const goToManageWallets = () => {
    navigate("/manage-wallets", { state: { username, mnemonic } });
    setIsOpen(false);
  };

  const verifyPassword = async () => {
    try {
      const db = getDatabase();
      const passRef = ref(db, `users/${username}/password`);
      const passSnap = await get(passRef);
      const storedHash = passSnap.val();
      const inputHash = SHA256(password).toString();

      if (inputHash !== storedHash) {
        toast.error("Incorrect password", { icon: "🔒" });
        return;
      }

      setShowPasswordPrompt(false);
      setShowConfirmationPrompt(true);
    } catch (err) {
      console.error(err);
      toast.error("Error verifying password");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const db = getDatabase();
      await remove(ref(db, `users/${username}`));
      toast.success("Wallet deleted successfully", { icon: "🗑️" });
      setShowConfirmationPrompt(false);
      setPassword("");
      navigate("/");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete wallet");
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={toggleMenu}
        className="bg-purple-800 hover:bg-purple-700 px-4 py-2 rounded-lg font-medium transition"
      >
        ⚙️ Settings
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`
        absolute 
        right-2 sm:right-0
        left-2 sm:left-auto
        mt-2
        w-[calc(100vw-1rem)] sm:w-48
        max-w-xs
        bg-zinc-900 
        text-white 
        rounded-lg 
        shadow-lg 
        z-40 
        border border-purple-700
        ${showDevMenu ? "backdrop-blur-sm opacity-50 pointer-events-none" : ""}
      `}
          >
            <button
              onClick={goToManageWallets}
              className="w-full text-left px-4 py-2 hover:bg-purple-700 transition"
            >
              Manage Wallets
            </button>
            <button
              onClick={() => toast.success("Settings Coming Soon")}
              className="w-full text-left px-4 py-2 hover:bg-purple-700 transition"
            >
              Preferences
            </button>
            <button
              onClick={() => setShowDevMenu(!showDevMenu)}
              className="w-full text-left px-4 py-2 hover:bg-purple-700 transition"
            >
              Developer Settings
            </button>
            <button
              onClick={() => navigate("/")}
              className="w-full text-left px-4 py-2 hover:bg-purple-700 transition"
            >
              Logout
            </button>
            <button
              onClick={() => {
                setShowPasswordPrompt(true);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-red-700 hover:text-black text-red-400 transition"
            >
              Trash Wallet
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🔐 Password Prompt */}
      {showPasswordPrompt && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-zinc-900 p-6 rounded-xl w-full max-w-sm space-y-4 border border-purple-700">
            <h2 className="text-lg font-bold text-purple-400">Enter your password to continue</h2>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-2 rounded bg-purple-950 text-white border border-purple-600"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowPasswordPrompt(false);
                  setPassword("");
                }}
                className="bg-gray-600 px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  verifyPassword();
                  setPassword("")
                }}
                className="bg-purple-700 hover:bg-purple-600 px-4 py-2 rounded-lg"
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ❗ Final Delete Confirmation */}
      {showConfirmationPrompt && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
          <div className="bg-zinc-900 p-6 rounded-xl w-full max-w-sm space-y-4 border border-red-700">
            <h2 className="text-lg font-bold text-red-400">Confirm Deletion</h2>
            <p className="text-sm text-gray-400">
              Are you absolutely sure you want to delete this wallet? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowConfirmationPrompt(false);
                  setPassword("");
                }}
                className="bg-gray-600 px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDeleteAccount();
                  setPassword("");
                }}
                className="bg-red-700 hover:bg-red-600 px-4 py-2 rounded-lg"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/*Developer Settings Menu*/}
      {showDevMenu && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="
    absolute z-50 
    left-2 right-2 sm:right-2 sm:left-auto
    bg-zinc-800 
    border border-purple-600 
    text-white 
    rounded-lg 
    shadow-md 
    w-[90vw] sm:w-64 
    max-w-xs px-4 py-3
  "
        >

          <h3 className="text-sm text-purple-300 font-semibold mb-2">Select Network</h3>
          <div className="flex flex-col gap-3">
            {/* Devnet Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Devnet Mode</p>
                <p className="text-xs text-gray-400">For testing transactions</p>
              </div>
              <div
                onClick={() => { setNetwork("devnet"); setShowDevMenu(false); setIsOpen(false) }}
                className={`w-11 h-6 flex items-center bg-gray-600 rounded-full p-1 cursor-pointer transition duration-300 ${network === "devnet" ? "bg-purple-600" : "bg-gray-700"}`}
              >
                <motion.div
                  layout
                  className="w-4 h-4 bg-white rounded-full shadow-md"
                  animate={{ x: network === "devnet" ? 20 : 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                />
              </div>
            </div>

            {/* Mainnet Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Mainnet Mode</p>
                <p className="text-xs text-gray-400">Live network</p>
              </div>
              <div
                onClick={() => { setNetwork("mainnet"); setShowDevMenu(false); setIsOpen(false) }}
                className={`w-11 h-6 flex items-center bg-gray-600 rounded-full p-1 cursor-pointer transition duration-300 ${network === "mainnet" ? "bg-purple-600" : "bg-gray-700"}`}
              >
                <motion.div
                  layout
                  className="w-4 h-4 bg-white rounded-full shadow-md"
                  animate={{ x: network === "mainnet" ? 20 : 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SettingsMenu;


