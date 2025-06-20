import { useState, useEffect, useMemo } from 'react';
import { useLocation } from "react-router-dom";
import { derivePath } from "ed25519-hd-key";
import { Keypair, Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import { getDatabase, ref, set, get } from "firebase/database";
import SettingsMenu from '../components/SettingsMenu';
import { motion } from "framer-motion";
import * as bip39 from "bip39";


const Wallet = () => {
    const location = useLocation();

    const username = location.state?.username;
    const mnemonic = location.state?.mnemonic;

    const seed = useMemo(() => bip39.mnemonicToSeedSync(mnemonic), [mnemonic]);



    const [walletBalance, setWalletBalance] = useState("0.00");
    const [wallets, setWallets] = useState([{ name: null }]);
    const [selectedWalletIndex, setSelectedWalletIndex] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [newWalletName, setNewWalletName] = useState("");
    const [userNameLabel, setUserNameLabel] = useState("User");
    const [isBalanceLoading, setIsBalanceLoading] = useState(false);

    const solanaAlchemy = "https://solana-devnet.g.alchemy.com/v2/fJpASw5K4NIUlSgCQfDHMG89HKsrmMZM";

    const handleAddWallet = async () => {
        if (!newWalletName.trim()) return;

        const path = `m/44'/501'/${wallets.length}'/0'`;
        const derivedSeed = derivePath(path, seed.toString("hex")).key;
        const secret = nacl.sign.keyPair.fromSeed(derivedSeed).secretKey;
        const keypair = Keypair.fromSecretKey(secret);
        const newPubKey = keypair.publicKey.toBase58();

        const db = getDatabase();
        const userRef = ref(db, `users/${username}/wallets/${wallets.length}`);

        await set(userRef, {
            name: newWalletName.trim(),
            publicKey: newPubKey,
            createdAt: new Date().toISOString(),
        });

        setWallets([...wallets, { name: newWalletName.trim(), publicKey: newPubKey }]);
        setSelectedWalletIndex(wallets.length);
        setNewWalletName("");
        setShowModal(false);
    };

    useEffect(() => {
        const initWallet = async () => {
            if (!username || !seed) return;

            const db = getDatabase();
            const walletsRef = ref(db, `users/${username}/wallets`);
            const walletsSnap = await get(walletsRef);
            const loadedWallets = [];

            if (walletsSnap.exists()) {
                walletsSnap.forEach((childSnap) => {
                    loadedWallets.push({
                        name: childSnap.val().name,
                        publicKey: childSnap.val().publicKey,
                    });
                });
                setWallets(loadedWallets);
            } else {
                const path = `m/44'/501'/0'/0'`;
                const derivedSeed = derivePath(path, seed.toString("hex")).key;
                const secret = nacl.sign.keyPair.fromSeed(derivedSeed).secretKey;
                const keypair = Keypair.fromSecretKey(secret);
                const pubKey = keypair.publicKey.toBase58();

                await set(ref(db, `users/${username}/wallets/0`), {
                    name: username + "'s Wallet",
                    publicKey: pubKey,
                    createdAt: new Date().toISOString(),
                });

                setWallets([{ name: username, publicKey: pubKey }]);
            }
        };

        initWallet();
    }, [username, seed]);

    useEffect(() => {
        const fetchWalletBalance = async () => {
            const selectedWallet = wallets[selectedWalletIndex];
            if (!selectedWallet || !selectedWallet.publicKey) return;

            try {
                setIsBalanceLoading(true);
                const connection = new Connection(solanaAlchemy, "confirmed");
                const balance = await connection.getBalance(new PublicKey(selectedWallet.publicKey));
                const sol = balance / LAMPORTS_PER_SOL;
                const usd = (sol * 145)
                setWalletBalance(usd);
            } catch (error) {
                console.error("Error fetching wallet balance:", error);
                setWalletBalance("0.00");
            } finally {
                setIsBalanceLoading(false);
            }
        };

        fetchWalletBalance();
    }, [selectedWalletIndex, wallets.length]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-950 text-white px-4 sm:px-6 py-6">
            <div className="bg-yellow-400 text-black font-medium text-center py-2 rounded-lg mb-6 sm:mb-8">
                You are currently in Testnet Mode
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-3 mb-6 sm:mb-8">
                <div>
                    <p className="text-sm text-purple-300 font-mono">@{username?.toLowerCase()}</p>
                    <h1 className="text-4xl sm:text-5xl font-bold text-white">Hey {username}✌️</h1>
                </div>
                <SettingsMenu username={username} mnemonic={mnemonic} />
            </div>

            <div className="grid grid-cols-12 gap-4 sm:gap-6">
                <div className="col-span-12 lg:col-span-3 order-2 lg:order-1">
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 shadow-lg space-y-4">
                        <p className="text-purple-300 text-center text-sm font-semibold mb-2">Your Wallets</p>
                        <div className="flex flex-col gap-2 overflow-x-auto">
                            {wallets.map((wallet, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedWalletIndex(index)}
                                    className={`w-full px-4 py-2 rounded-lg text-left transition-all duration-200 font-semibold ${selectedWalletIndex === index
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

                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="col-span-12 lg:col-span-6 order-1 lg:order-2"
                >
                    <div className="text-center mb-6">
                        {isBalanceLoading ? (
                            <p className="text-gray-300 text-xl sm:text-2xl font-medium">Fetching balance...</p>
                        ) : (
                            <h2 className="text-4xl sm:text-5xl font-extrabold text-green-400">${walletBalance}</h2>
                        )}
                        <p className="text-gray-400 mt-1">Wallet Balance (USD)</p>
                    </div>


                    <div className="bg-white/10 p-4 rounded-xl border border-white/10 shadow-md break-all mb-6">
                        <p className="text-sm text-gray-400">Public Key:</p>
                        <p className="font-mono text-purple-200 text-xs sm:text-sm mt-1">
                            {wallets[selectedWalletIndex]?.publicKey || "No public key available"}
                        </p>

                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                        {["Receive", "Send", "Swap", "Buy"].map((action, i) => (
                            <button
                                key={i}
                                className="bg-purple-700 hover:bg-purple-600 py-3 rounded-xl text-sm font-semibold transition"
                            >
                                {action}
                            </button>
                        ))}
                    </div>

                    <button
                        className="w-full bg-pink-600 hover:bg-pink-500 py-3 rounded-xl text-white font-semibold transition"
                        onClick={() => setShowModal(true)}
                    >
                        ➕ New Wallet
                    </button>
                </motion.div>

                <div className="col-span-12 xl:col-span-3 order-3">
                    <div className="bg-white/10 p-4 rounded-xl shadow-inner">
                        <div className="flex gap-6 mb-4 border-b border-purple-700 pb-2">
                            <button className="text-purple-400 border-b-2 border-purple-400">Tokens</button>
                            <button className="text-gray-400 hover:text-white">Collectibles</button>
                        </div>
                        <div className="text-sm">
                            <p className="text-gray-400">Solana</p>
                            <p className="text-white text-lg font-medium">{walletBalance / 145}</p>
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
                                onClick={handleAddWallet}
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

export default Wallet;
