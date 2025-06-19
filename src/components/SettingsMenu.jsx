import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const SettingsMenu = ({ username, seedBase58, mnemonic }) => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const menuRef = useRef();

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

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
        navigate("/manage-wallets", {state:{username,seedBase58,mnemonic}});
        setIsOpen(false);
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
                        className="absolute right-0 mt-2 w-48 bg-zinc-900 text-white rounded-lg shadow-lg z-50 border border-purple-700"
                    >
                        <button
                            onClick={goToManageWallets}
                            className="w-full text-left px-4 py-2 hover:bg-purple-700 rounded-t-lg transition"
                        >
                            Manage My Accounts
                        </button>
                        <button
                            onClick={() => alert("Settings Coming Soon")}
                            className="w-full text-left px-4 py-2 hover:bg-purple-700 rounded-b-lg transition"
                        >
                            Preferences
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SettingsMenu;
