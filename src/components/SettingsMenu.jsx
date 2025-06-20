import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getDatabase, ref, get, remove } from "firebase/database";
import SHA256 from "crypto-js/sha256";
import toast from "react-hot-toast";

const SettingsMenu = ({ username, mnemonic }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState("");
  const [showConfirmationPrompt, setShowConfirmationPrompt] = useState(false);
  const menuRef = useRef();
  const navigate = useNavigate();

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
           className="
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
z-50 
border border-purple-700
"
          >
            <button
              onClick={goToManageWallets}
              className="w-full text-left px-4 py-2 hover:bg-purple-700 transition"
            >
              Manage My Accounts
            </button>
            <button
              onClick={() => alert("Settings Coming Soon")}
              className="w-full text-left px-4 py-2 hover:bg-purple-700 transition"
            >
              Preferences
            </button>
            <button
              onClick={() => alert("Settings Coming Soon")}
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
                onClick={() => setShowPasswordPrompt(false)}
                className="bg-gray-600 px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={verifyPassword}
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
                onClick={() => setShowConfirmationPrompt(false)}
                className="bg-gray-600 px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="bg-red-700 hover:bg-red-600 px-4 py-2 rounded-lg"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsMenu;


// AHpwy3FGYaNchDgbtcr2QFL7yYnx4eyf2rn7CPGxkMSj