import { useState, useEffect, useMemo } from 'react';
import { href, Navigate, useLocation, useNavigate } from "react-router-dom";
import SolanaLogo from "../assets/SolanaLogo.png";
import { derivePath } from "ed25519-hd-key";
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import nacl from "tweetnacl";
import { getDatabase, ref, set, get } from "firebase/database";
import SettingsMenu from '../components/SettingsMenu';
import * as bip39 from "bip39";
import bs58 from "bs58"
import CryptoJS from "crypto-js";
import toast from 'react-hot-toast';
import { QRCodeCanvas } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import { useNetwork } from "../context/NetworkContext";


const Wallet = () => {
    const location = useLocation();

    const username = location.state?.username;
    const mnemonic = location.state?.mnemonic;
    const password = location.state?.password;


    const seed = useMemo(() => bip39.mnemonicToSeedSync(mnemonic), [mnemonic]);
    const navigate = useNavigate();



    const [enteredPassword, setEnteredPassword] = useState("");
    const [walletBalance, setWalletBalance] = useState("0.00");
    const [wallets, setWallets] = useState([{ name: null }]);
    const [selectedWalletIndex, setSelectedWalletIndex] = useState(0);
    const [showWalletPopup, setShowWalletPopup] = useState(false);
    const [newWalletName, setNewWalletName] = useState("");
    const [isBalanceLoading, setIsBalanceLoading] = useState(false);
    const [showReceiveModal, setShowReceiveModal] = useState(false);

    //SEND TRANSACTION MODAL
    const [showSendModal, setShowSendModal] = useState(false);
    const [recipientAddress, setRecipientAddress] = useState("");
    const [sendAmount, setSendAmount] = useState("");
    const [sendingSol, setSendingSol] = useState(false);

    //Developer Settings
    const { network, solanaAlchemy } = useNetwork();


    const verifyPasswordAndAddWallet = async () => {
        if (!newWalletName.trim() || !enteredPassword) {
            toast.error("⚠️ Please fill both the fields.");
            return;
        }

        const db = getDatabase();
        const passRef = ref(db, `users/${username}/password`);
        const passSnap = await get(passRef);

        if (!passSnap.exists()) {
            toast.error("Password not found in database");
            return;
        }

        const storedHash = passSnap.val();
        const enteredHash = CryptoJS.SHA256(enteredPassword).toString();

        if (enteredHash !== storedHash) {
            toast.error("Incorrect Password")
            return;
        }

        const path = `m/44'/501'/${wallets.length}'/0'`;
        const derivedSeed = derivePath(path, seed.toString("hex")).key;
        const secret = nacl.sign.keyPair.fromSeed(derivedSeed).secretKey;
        const keypair = Keypair.fromSecretKey(secret);
        const newPubKey = keypair.publicKey.toBase58();
        const privateKeyBase58 = bs58.encode(keypair.secretKey);
        const encryptedPrivateKey = CryptoJS.AES.encrypt(privateKeyBase58, enteredPassword).toString();

        await set(ref(db, `users/${username}/wallets/${wallets.length}`), {
            name: newWalletName,
            publicKey: newPubKey,
            createdAt: new Date().toISOString(),
        });
        localStorage.setItem(`privateKey_${username}_${wallets.length}`, encryptedPrivateKey);
        toast.success("\u{1FA99} New wallet created")
        setWallets([...wallets, { name: newWalletName, publicKey: newPubKey }]);
        setSelectedWalletIndex(wallets.length);
        setShowWalletPopup(false);
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
                const privateKeyBase58 = bs58.encode(keypair.secretKey);
                const encryptedPrivateKey = CryptoJS.AES.encrypt(privateKeyBase58, password).toString();
                localStorage.removeItem('password');

                await set(ref(db, `users/${username}/wallets/0`), {
                    name: username + "'s Wallet",
                    publicKey: pubKey,
                    createdAt: new Date().toISOString(),
                });
                localStorage.setItem(`privateKey_${username}_0`, encryptedPrivateKey);
                setWallets([{ name: username, publicKey: pubKey }]);
            }
        };

        initWallet();
    }, [username, seed]);

    const fetchWalletBalance = async () => {
        const selectedWallet = wallets[selectedWalletIndex];
        if (!selectedWallet || !selectedWallet.publicKey) return;

        try {
            setIsBalanceLoading(true);
            const connection = new Connection(solanaAlchemy, "confirmed");
            const balance = await connection.getBalance(new PublicKey(selectedWallet.publicKey));
            const sol = balance / LAMPORTS_PER_SOL;
            const usd = sol * 145;
            setWalletBalance(usd.toFixed(6));
        } catch (error) {
            console.error("Error fetching wallet balance:", error);
            setWalletBalance("0.00");
        } finally {
            setIsBalanceLoading(false);
        }
    };

    useEffect(() => {
        fetchWalletBalance();
    }, [selectedWalletIndex, wallets.length,network]);


    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-950 text-white px-4 sm:px-6 py-6">
            {network === "devnet" && (
                <div className="bg-yellow-400 text-black font-medium text-center py-2 rounded-lg mb-6 sm:mb-8">
                    You are currently in Testnet Mode
                </div>
            )}
            {network === "mainnet" && (
                <div className="bg-green-400 text-black font-medium text-center py-2 rounded-lg mb-6 sm:mb-8">
                    You are currently in Mainnet Mode
                </div>
            )}



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


                    <div className="bg-white/10 p-4 rounded-xl border border-white/10 shadow-md mb-6">
                        <p className="text-sm text-gray-400">Public Key:</p>
                        <div className="flex items-center justify-between mt-1 gap-2 break-all">
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                    navigator.clipboard.writeText(wallets[selectedWalletIndex]?.publicKey || "");
                                    toast.success("📋 Public key copied!");
                                }}
                                className="text-purple-200  text-xs sm:text-sm">
                                {wallets[selectedWalletIndex]?.publicKey || "No public key available"}

                            </motion.button>
                        </div>
                    </div>


                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                        {["Receive", "Send", "Swap", "Buy"].map((action, i) => (
                            <button
                                key={i}
                                className="bg-purple-700 hover:bg-purple-600 py-3 rounded-xl text-sm font-semibold transition"
                                onClick={() => {
                                    if (action === "Receive") setShowReceiveModal(true);
                                    if (action === "Buy") window.open("https://www.binance.com/en/buy-sell-crypto", "_blank");
                                    if (action === "Send") setShowSendModal(true);
                                    if (action === "Swap") toast.success("Coming Soon!");
                                }}
                            >
                                {action}
                            </button>
                        ))}
                    </div>

                    <button
                        className="w-full bg-pink-600 hover:bg-pink-500 py-3 rounded-xl text-white font-semibold transition"
                        onClick={() => {
                            setNewWalletName("");
                            setEnteredPassword("");
                            setShowWalletPopup(true);
                        }}
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
                        <div className="text-m flex items-center space-x-2">
                            <img src={SolanaLogo} alt="Solana" className="w-6 h-6" />
                            <button className="text-gray-400 font-medium text-m"
                                onClick={() => {
                                    localStorage.setItem("username", username);
                                    localStorage.setItem("selectedWalletIndex", selectedWalletIndex);
                                    navigate("/solana-details", {
                                        state: { username, selectedWalletIndex }
                                    });
                                }}>Solana</button>
                            <p className="text-white text-sm font-medium">{walletBalance / 145}</p>
                        </div>
                    </div>
                </div>
            </div>


            {/*Create Wallet Popup*/}
            {showWalletPopup && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-zinc-900 text-white rounded-xl p-6 w-[90%] max-w-md shadow-2xl space-y-4 border border-purple-700">
                        <h2 className="text-lg font-bold text-purple-400">Create New Wallet</h2>

                        <input
                            type="text"
                            value={newWalletName}
                            onChange={(e) => setNewWalletName(e.target.value)}
                            placeholder="Enter wallet name"
                            className="w-full px-4 py-2 rounded-lg bg-purple-950 text-white placeholder-gray-400 border border-purple-600 focus:outline-none"
                        />

                        <input
                            type="password"
                            value={enteredPassword}
                            onChange={(e) => setEnteredPassword(e.target.value)}
                            placeholder="Enter your registered password"
                            className="w-full px-4 py-2 rounded-lg bg-purple-950 text-white placeholder-gray-400 border border-purple-600 focus:outline-none"
                        />

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => setShowWalletPopup(false)}
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={verifyPasswordAndAddWallet}
                                className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-medium"
                            >
                                Create Wallet
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/*Receive Transaction*/}
            <AnimatePresence>
                {showReceiveModal && (
                    <motion.div
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-2 sm:px-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-zinc-900 text-white rounded-2xl p-4 sm:p-6 w-full max-w-md shadow-2xl border border-purple-700 flex flex-col items-center space-y-5 max-h-[90vh] overflow-y-auto"
                            initial={{ y: 40, scale: 0.95, opacity: 0 }}
                            animate={{ y: 0, scale: 1, opacity: 1 }}
                            exit={{ y: 40, scale: 0.95, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                            <h2 className="text-xl font-bold text-purple-300 text-center">Receive Address</h2>

                            <div className="bg-white p-3 rounded-xl shadow-md">
                                <QRCodeCanvas
                                    value={wallets[selectedWalletIndex]?.publicKey || ""}
                                    size={140}
                                    bgColor="#ffffff"
                                    fgColor="#000000"
                                    level="H"
                                    includeMargin={true}
                                />
                            </div>

                            <div className="w-full text-center space-y-1">
                                <p className="text-sm text-gray-400">Your Solana Address</p>
                                <div className="bg-purple-950 px-3 py-2 rounded-md border border-purple-600 text-sm break-all text-purple-200">
                                    {wallets[selectedWalletIndex]?.publicKey || "Unavailable"}
                                </div>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        navigator.clipboard.writeText(wallets[selectedWalletIndex]?.publicKey || "");
                                        toast.success("Copied to clipboard");
                                    }}
                                    className="mt-2 w-full flex items-center justify-center gap-1 text-sm text-white bg-purple-700 hover:bg-purple-800 px-4 py-2 rounded-md font-medium transition-all"
                                >
                                    <span>📋</span> Copy
                                </motion.button>
                            </div>

                            <p className="text-xs text-gray-500 mt-1 text-center">
                                This address can only be used to receive Solana tokens.
                            </p>

                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setShowReceiveModal(false)}
                                className="w-full mt-2 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg text-sm transition-all"
                            >
                                Close
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/*Send Transaction*/}
            <AnimatePresence>
                {showSendModal && (
                    <motion.div
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-zinc-900 text-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-purple-700 space-y-5"
                            initial={{ y: 40, scale: 0.95, opacity: 0 }}
                            animate={{ y: 0, scale: 1, opacity: 1 }}
                            exit={{ y: 40, scale: 0.95, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                            <h2 className="text-xl font-bold text-purple-300 text-center">Send SOL</h2>

                            <input
                                type="text"
                                placeholder="Recipient's Solana address"
                                value={recipientAddress}
                                onChange={(e) => setRecipientAddress(e.target.value)}
                                className="w-full px-4 py-2 bg-purple-950 text-white placeholder-gray-400 border border-purple-600 rounded-lg focus:outline-none text-sm"
                            />

                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Amount in SOL"
                                    value={sendAmount}
                                    onChange={(e) => setSendAmount(e.target.value)}
                                    className="w-full py-2 px-4 pr-20 bg-purple-950 text-white placeholder-gray-400 border border-purple-600 rounded-lg focus:outline-none text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setSendAmount((walletBalance / 145).toFixed(10))}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-700 hover:bg-purple-600 text-xs font-medium px-2 py-1 -mt-3 rounded-md"
                                >
                                    Max
                                </button>
                                <p className="text-purple-400 text-xs text-right mt-2">
                                    Available: {(walletBalance / 145).toFixed(10)} SOL
                                </p>
                            </div>

                            <input
                                type="password"
                                placeholder="Enter your password"
                                value={enteredPassword}
                                onChange={(e) => setEnteredPassword(e.target.value)}
                                className="w-full px-4 py-2 bg-purple-950 text-white placeholder-gray-400 border border-purple-600 rounded-lg focus:outline-none text-sm"
                            />

                            {parseFloat(sendAmount || "0") > walletBalance / 145 && (
                                <p className="text-red-500 text-xs mt-1 font-medium">⚠️ Insufficient balance</p>
                            )}

                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                disabled={
                                    sendingSol ||
                                    !recipientAddress ||
                                    !sendAmount ||
                                    !enteredPassword ||
                                    parseFloat(sendAmount) > walletBalance / 145
                                }
                                onClick={async () => {
                                    try {
                                        setSendingSol(true);

                                        const db = getDatabase();
                                        const passwordSnap = await get(ref(db, `users/${username}/password`));
                                        if (!passwordSnap.exists()) {
                                            toast.error("Password not found.");
                                            return;
                                        }

                                        const hashedPassword = passwordSnap.val();
                                        const enteredHash = CryptoJS.SHA256(enteredPassword).toString();
                                        if (enteredHash !== hashedPassword) {
                                            toast.error("❌ Incorrect Password");
                                            return;
                                        }

                                        const walletSnap = await get(ref(db, `users/${username}/wallets/${selectedWalletIndex}`));
                                        if (!walletSnap.exists()) throw new Error("Wallet not found");

                                        const { privateKey } = walletSnap.val();
                                        const decrypted = CryptoJS.AES.decrypt(privateKey, enteredPassword).toString(CryptoJS.enc.Utf8);
                                        const keypair = Keypair.fromSecretKey(bs58.decode(decrypted));

                                        const connection = new Connection(solanaAlchemy, "confirmed");


                                        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("finalized");

                                        const tx = new Transaction({
                                            feePayer: keypair.publicKey,
                                            recentBlockhash: blockhash,
                                        }).add(
                                            SystemProgram.transfer({
                                                fromPubkey: keypair.publicKey,
                                                toPubkey: new PublicKey(recipientAddress),
                                                lamports: parseFloat(sendAmount) * LAMPORTS_PER_SOL,
                                            })
                                        );

                                        // Estimate fee
                                        const messageV0 = tx.compileMessage();
                                        const feeInLamports = await connection.getFeeForMessage(messageV0);
                                        const feeInSOL = feeInLamports.value / LAMPORTS_PER_SOL;

                                        // If amount < fee, block the transaction
                                        if (parseFloat(sendAmount) < feeInSOL) {
                                            toast.error(`⚠️ Amount too low! Must be greater than network fee of ${feeInSOL.toFixed(6)} SOL`);
                                            setSendingSol(false);
                                            return;
                                        }

                                        tx.sign(keypair);
                                        const sig = await connection.sendRawTransaction
                                        (tx.serialize(), {
                                            skipPreflight: true,
                                        });
                                        await fetchWalletBalance();
                                       
                                        toast.success(<div className="max-w-[300px] break-words text-sm">
                                            ✅ Transaction Successful! Sign:{" "}
                                            <span title={sig} className="underline cursor-pointer">
                                                {sig.slice(0, 10)}...
                                            </span>
                                        </div>);
                                         



                                        setShowSendModal(false);
                                        setRecipientAddress("");
                                        setSendAmount("");
                                        setEnteredPassword("");
                                    } catch (err) {
                                        console.error(err);
                                        toast.error("❌ Transaction failed");
                                    } finally {
                                        setSendingSol(false);
                                    }
                                }}
                                className={`w-full py-2 rounded-lg font-semibold transition ${sendingSol ? "bg-gray-600" : "bg-purple-700 hover:bg-purple-600"}`}
                            >
                                {sendingSol ? "Sending..." : "Confirm Transaction"}
                            </motion.button>

                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={() => {
                                    setShowSendModal(false);
                                    setRecipientAddress("");
                                    setSendAmount("");
                                    setEnteredPassword("");
                                }}
                                className="w-full bg-gray-700 hover:bg-gray-600 py-2 rounded-lg text-sm transition-all"
                            >
                                Cancel
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>



        </div>
    );
};

export default Wallet;


