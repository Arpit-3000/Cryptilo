import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getDatabase, ref, get } from "firebase/database";
import bs58 from "bs58";
import CryptoJS from "crypto-js";
import toast from "react-hot-toast";

const SendTransaction = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { username, password } = location.state || {};

    const [recipient, setRecipient] = useState("");
    const [amount, setAmount] = useState("");
    const [balance, setBalance] = useState(0);
    const [sending, setSending] = useState(false);
    const [wallet, setWallet] = useState(null);

    const solanaAlchemy = "https://solana-devnet.g.alchemy.com/v2/fJpASw5K4NIUlSgCQfDHMG89HKsrmMZM";

    useEffect(() => {
        const fetchWallet = async () => {
            const db = getDatabase();
            const walletRef = ref(db, `users/${username}/wallets/0`);
            const snap = await get(walletRef);
            if (snap.exists()) {
                const { privateKey, publicKey } = snap.val();
                const decrypted = CryptoJS.AES.decrypt(privateKey, password).toString(CryptoJS.enc.Utf8);
                const keypair = Keypair.fromSecretKey(bs58.decode(decrypted));
                setWallet({ keypair, publicKey });
                const conn = new Connection(solanaAlchemy, "confirmed");
                const bal = await conn.getBalance(keypair.publicKey);
                setBalance(bal / LAMPORTS_PER_SOL);
            }
        };
        fetchWallet();
    }, [username, password]);

    const handleMax = () => {
        setAmount(balance.toFixed(4));
    };

    const handleSend = async () => {
        if (!wallet || !recipient || !amount) {
            toast.error("All fields are required.");
            return;
        }

        try {
            setSending(true);
            const conn = new Connection(solanaAlchemy, "confirmed");
            const tx = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: wallet.keypair.publicKey,
                    toPubkey: new PublicKey(recipient),
                    lamports: parseFloat(amount) * LAMPORTS_PER_SOL,
                })
            );
            const signature = await sendAndConfirmTransaction(conn, tx, [wallet.keypair]);
            toast.success(`✅ Sent! Tx: ${signature}`);
            navigate(-1);
        } catch (err) {
            console.error(err);
            toast.error("❌ Transaction failed");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="min-h-screen flex justify-center items-center px-4 bg-gradient-to-br from-purple-900 via-black to-purple-950">
            <div className="bg-zinc-900 border border-purple-700 p-6 w-full max-w-md rounded-xl text-white shadow-2xl">
                <h2 className="text-center text-2xl font-semibold mb-4">Send SOL</h2>
                <div className="space-y-4">
                    <input
                        type="text"
                        placeholder="Recipient's Solana address"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        className="w-full px-4 py-2 bg-purple-950 border border-purple-600 rounded-lg text-sm placeholder-gray-400"
                    />
                    <div className="relative">
                        <input
                            type="number"
                            placeholder="Amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full px-4 py-2 bg-purple-950 border border-purple-600 rounded-lg text-sm placeholder-gray-400"
                        />
                        <button
                            className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-purple-700 text-xs rounded"
                            onClick={handleMax}
                        >
                            Max
                        </button>
                    </div>
                    <p className="text-sm text-gray-400">
                        Available: {balance.toFixed(4)} SOL (~${(balance * 145).toFixed(2)})
                    </p>
                    <button
                        onClick={handleSend}
                        disabled={sending}
                        className={`w-full py-2 rounded-lg font-semibold transition ${
                            sending
                                ? "bg-gray-600 cursor-not-allowed"
                                : "bg-purple-700 hover:bg-purple-600"
                        }`}
                    >
                        {sending ? "Sending..." : "Next"}
                    </button>
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full mt-2 text-sm text-gray-400 hover:text-white underline"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SendTransaction;
