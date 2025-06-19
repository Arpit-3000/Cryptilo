import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from "react-router-dom";
import { derivePath } from "ed25519-hd-key";
import { Keypair } from "@solana/web3.js";
import nacl from "tweetnacl"
import { rtdb } from "../utils/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { Settings } from 'lucide-react';
import { motion } from "framer-motion";
import bs58 from "bs58";


const Wallet = () => {
    const location = useLocation();
    const seedBase58 = location.state?.seedBase58;
    const seed = bs58.decode(seedBase58);

    console.log(seed);

    const [username, setUsername] = useState("User");
    const [publicKey, setPublicKey] = useState("");
    const [walletBalance, setWalletBalance] = useState("0.00");
    const [wallets, setWallets] = useState([{ name: "Main Wallet" }]);
    const [selectedWalletIndex, setSelectedWalletIndex] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [newWalletName, setNewWalletName] = useState("");


    const solanaAlchemy = "https://solana-mainnet.g.alchemy.com/v2/fJpASw5K4NIUlSgCQfDHMG89HKsrmMZM";



    useEffect(() => {
        const path = `m/44'/501'/${selectedWalletIndex}'/0'`;
        const derivedSeed = derivePath(path, seed.toString("hex")).key;
        const secret = nacl.sign.keyPair.fromSeed(derivedSeed).secretKey;
        const keypair = Keypair.fromSecretKey(secret);
        const pubKey = keypair.publicKey.toBase58();
        setPublicKey(pubKey);



        const fetchWalletData = async () => {

            const docRef = doc(rtdb, "users");
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setUsername(docSnap.data().username || "User");
            }

            const connection = new Connection(ALCHEMY_RPC_URL, "confirmed");
            const balance = await connection.getBalance(keypair.publicKey);
            const sol = balance / LAMPORTS_PER_SOL;
            const usd = (sol * 145).toFixed(2);
            setWalletBalance(usd);
        };

        fetchWalletData();

    }, [selectedWalletIndex]);


    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-950 text-white px-8 py-6">

            {/* Testnet Banner */}
            <div className="bg-yellow-400 text-black font-medium text-center py-2 rounded-lg mb-8">
                You are currently in Testnet Mode
            </div>
            {/* Top Section */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <p className="text-sm text-purple-300 font-mono">@{username.toLowerCase()}</p>
                    <h1 className="text-2xl font-bold">{username}</h1>
                </div>
                <button className="hover:scale-110 transition">
                    <Settings className="w-6 h-6 text-white" />
                </button>
            </div>



            {/* Grid Layout for Main Content */}
            <div className="grid grid-cols-12 gap-8">
                {/* Left Sidebar - Modern Wallet Switcher */}
                <div className="col-span-3 hidden lg:block">
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 shadow-lg space-y-4">
                        <p className="text-purple-300 text-center text-sm font-semibold mb-2">Your Wallets</p>

                        {/* Wallet List */}
                        <div className="flex flex-col gap-2">
                            {wallets.map((wallet, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedWalletIndex(index)}
                                    className={`w-full px-4 py-2 rounded-lg text-left transition-all duration-200 font-semibold
            ${selectedWalletIndex === index
                                            ? "bg-purple-700 text-white shadow-md"
                                            : "bg-purple-900 text-purple-300 hover:bg-purple-800"
                                        }`}
                                >
                                    {wallet.name}
                                </button>
                            ))}
                        </div>

                    </div>
                </div>




                {/* Center Wallet Info */}
                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="col-span-12 lg:col-span-6"
                >
                    <div className="text-center mb-6">
                        <h2 className="text-5xl font-extrabold text-green-400">${walletBalance}</h2>
                        <p className="text-gray-400 mt-1">Wallet Balance (USD)</p>
                    </div>

                    {/* Public Key */}
                    <div className="bg-white/10 p-4 rounded-xl border border-white/10 shadow-md break-all mb-6">
                        <p className="text-sm text-gray-400">Public Key:</p>
                        <p className="font-mono text-purple-200 text-xs sm:text-sm mt-1">{publicKey}</p>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {["Receive", "Send", "Swap", "Buy"].map((action, i) => (
                            <button
                                key={i}
                                className="bg-purple-700 hover:bg-purple-600 py-3 rounded-xl text-sm font-semibold transition"
                            >
                                {action}
                            </button>
                        ))}
                    </div>

                    {/* New Wallet */}
                    <button
                        className="w-full bg-pink-600 hover:bg-pink-500 py-3 rounded-xl text-white font-semibold transition"
                        onClick={() => {
                            setShowModal(true);
                        }}
                    >
                        ➕ New Wallet
                    </button>
                </motion.div>

                {/* Right Token Info */}
                <div className="col-span-3 hidden xl:block">
                    <div className="bg-white/10 p-4 rounded-xl shadow-inner">
                        <div className="flex gap-6 mb-4 border-b border-purple-700 pb-2">
                            <button className="text-purple-400 border-b-2 border-purple-400">Tokens</button>
                            <button className="text-gray-400 hover:text-white">Collectibles</button>
                        </div>
                        <div className="text-sm">
                            <p className="text-gray-400">Solana</p>
                            <p className="text-white text-lg font-medium">{walletBalance}</p>
                        </div>
                    </div>
                </div>
            </div>
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-zinc-900 text-white rounded-xl p-6 w-[90%] max-w-md shadow-2xl space-y-4 border border-purple-700">
                        <h2 className="text-lg font-bold text-purple-400">Name your new wallet</h2>
                        <input
                            type="text"
                            value={newWalletName}
                            onChange={(e) => setNewWalletName(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg bg-purple-950 text-white placeholder-gray-400 border border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="e.g. Trading Wallet"
                        />
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (newWalletName.trim()) {
                                        setWallets([...wallets, { name: newWalletName.trim() }]);
                                        setSelectedWalletIndex(wallets.length);
                                        setNewWalletName("");
                                        setShowModal(false);
                                    }
                                }}
                                className="px-4 py-2 bg-purple-700 hover:bg-purple-600 rounded-lg text-sm font-medium"
                            >
                                Add Wallet
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>


    );
};

export default Wallet
