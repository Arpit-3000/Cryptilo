import React, { useState, useEffect } from "react";
import axios from "axios";
import { getDatabase, ref, get } from "firebase/database";
import { useLocation, useNavigate } from "react-router-dom";
import { Connection, PublicKey } from "@solana/web3.js";

const ALCHEMY_URL = import.meta.env.VITE_SOLANA_ALCHEMY_MAINNET;

const SolanaDetails = () => {
    const loc = useLocation();
    const navigate = useNavigate(); 

    const username = loc.state?.username || localStorage.getItem("username");
    const walletIndexRaw = loc.state?.selectedWalletIndex || localStorage.getItem("selectedWalletIndex");
    const walletIndex = walletIndexRaw !== null ? parseInt(walletIndexRaw) : null;

    const [address, setAddress] = useState(null);
    const [price, setPrice] = useState(null);
    const [change24, setChange24] = useState(null);
    const [txns, setTxns] = useState([]);

    // 🔑 Fetch wallet public key
    useEffect(() => {
        if (!username || walletIndex === null) return;
        const fetchKey = async () => {
            const db = getDatabase();
            const snap = await get(ref(db, `users/${username}/wallets/${walletIndex}`));
            if (snap.exists()) setAddress(snap.val().publicKey);
        };
        fetchKey();
    }, [username, walletIndex]);

    // 📈 Realtime price updates
    useEffect(() => {
        const fetchPrice = async () => {
            try {
                const res = await axios.get("https://api.coinbase.com/v2/prices/SOL-USD/spot");
                const amount = parseFloat(res.data.data.amount);
                setPrice(amount.toFixed(2));
            } catch (err) {
                console.error("Error fetching price:", err);
            }
        };

        fetchPrice();
        const id = setInterval(fetchPrice, 60000);
        return () => clearInterval(id);
    }, []);

    // 📦 Transactions
    useEffect(() => {
        if (!address) return;
        const conn = new Connection(ALCHEMY_URL);
        const fetchTxns = async () => {
            const sigs = await conn.getSignaturesForAddress(new PublicKey(address), { limit: 10 });
            const details = await Promise.all(sigs.map(async s => {
                const info = await conn.getTransaction(s.signature, { commitment: "confirmed" });
                const msg = info?.transaction?.message;
                return {
                    signature: s.signature,
                    slot: s.slot,
                    time: s.blockTime,
                    fee: (info?.meta?.fee / 1e9).toFixed(6),
                    instructions: msg?.instructions.length,
                    signer: msg?.accountKeys[0]?.toBase58(),
                    program: msg?.instructions[0]?.programId?.toBase58()
                };
            }));
            setTxns(details);
        };
        fetchTxns();
    }, [address]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0F051D] to-[#12012F] text-white px-4 py-8 md:px-10 transition-all duration-500 ease-in-out">

            {/* ⬅ Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="mb-8 flex items-center gap-2 text-purple-400 text-base font-medium transition duration-300 hover:text-purple-300 hover:scale-105"
            >
                <span className="text-xl">&larr;</span> Back
            </button>

            {/* 💰 Price Section */}
            <div className="flex flex-col items-center justify-center mb-12 text-center animate-fadeInUp">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-purple-200 mb-2 transition-all hover:scale-105 duration-300">
                    Solana (SOL)
                </h2>
                <div className="text-5xl font-bold text-purple-100 mb-1">
                    ${price || "..."}
                </div>
                <div className={`mt-2 px-4 py-1 rounded-full text-sm font-medium transition ${change24 >= 0 ? "bg-green-700" : "bg-red-700"
                    }`}>
                    {change24 >= 0 && "+"}{change24}% (24h)
                </div>
            </div>

            {/* 🔁 Transaction Table */}
            <div className="bg-[#1E1C29] rounded-xl shadow-lg overflow-x-auto mb-12 animate-fadeInSlow">
                <table className="min-w-full text-sm text-left">
                    <thead className="bg-purple-900 text-purple-200">
                        <tr>
                            {["Signature", "Slot", "Time", "Instr.", "Fee", "Signer", "Program", "Explorer"].map(h => (
                                <th key={h} className="px-4 py-3 whitespace-nowrap">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-800">
                        {txns.length > 0 ? txns.map(tx => (
                            <tr key={tx.signature} className="hover:bg-[#292541] transition duration-300">
                                <td className="px-4 py-2 truncate max-w-[160px]">{tx.signature}</td>
                                <td className="px-4 py-2">{tx.slot}</td>
                                <td className="px-4 py-2">{tx.time ? new Date(tx.time * 1000).toLocaleString() : "Pending"}</td>
                                <td className="px-4 py-2">{tx.instructions}</td>
                                <td className="px-4 py-2">{tx.fee}</td>
                                <td className="px-4 py-2 truncate max-w-[140px]">{tx.signer}</td>
                                <td className="px-4 py-2 truncate max-w-[140px]">{tx.program}</td>
                                <td className="px-4 py-2">
                                    <a
                                        href={`https://solscan.io/tx/${tx.signature}?cluster=devnet`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-purple-300 hover:underline"
                                    >
                                        View
                                    </a>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="8" className="text-center py-4 text-gray-400">No transactions found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* 📖 About Solana */}
            <div className="bg-[#1E1C29] p-6 rounded-xl shadow-xl animate-fadeInUp">
                <h2 className="text-2xl font-bold text-purple-300 mb-4">About Solana</h2>
                <p className="text-gray-300 text-sm leading-relaxed mb-5">
                    Solana is a high-performance blockchain supporting builders creating crypto apps that scale today. <br />
                    With lightning-fast throughput and ultra-low fees, Solana powers the future of DeFi, NFTs, and Web3 apps.
                </p>
                <div className="flex flex-wrap gap-3">
                    <a href="https://solana.com" target="_blank" rel="noreferrer" className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md text-sm transition">🌐 Website</a>
                    <a href="https://docs.solana.com" target="_blank" rel="noreferrer" className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md text-sm transition">📘 Docs</a>
                    <a href="https://twitter.com/solana" target="_blank" rel="noreferrer" className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md text-sm transition">🐦 Twitter</a>
                    <a href="https://t.me/solana" target="_blank" rel="noreferrer" className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md text-sm transition">💬 Telegram</a>
                </div>
            </div>

        </div>

    );
};

export default SolanaDetails;
