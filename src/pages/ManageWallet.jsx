import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getDatabase, ref, get, remove } from 'firebase/database';
import { derivePath } from 'ed25519-hd-key';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import * as bip39 from 'bip39';
import SHA256 from "crypto-js/sha256";

const ManageWallets = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const username = location.state?.username;
    const mnemonic = location.state?.mnemonic;

    const [wallets, setWallets] = useState([]);
    const [selectedWallet, setSelectedWallet] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [password, setPassword] = useState('');
    const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
    const [showRecoveryPhrase, setShowRecoveryPhrase] = useState(false);
    const [recoveryMnemonic, setRecoveryMnemonic] = useState('');

    useEffect(() => {
        const fetchWallets = async () => {
            const db = getDatabase();
            const walletsRef = ref(db, `users/${username}/wallets`);
            const walletsSnap = await get(walletsRef);
            const walletList = [];
            if (walletsSnap.exists()) {
                walletsSnap.forEach((childSnap) => {
                    walletList.push({
                        name: childSnap.val().name,
                        publicKey: childSnap.val().publicKey,
                        index: childSnap.key,
                    });
                });
            }
            setWallets(walletList);
        };
        fetchWallets();
    }, [username]);

    const handleShowPopup = (wallet) => {
        setSelectedWallet(wallet);
        setShowPopup(true);
    };

    const handleRemoveWallet = async () => {
        const db = getDatabase();
        await remove(ref(db, `users/${username}/wallets/${selectedWallet.index}`));
        setWallets(wallets.filter((w) => w.index !== selectedWallet.index));
        setShowPopup(false);
    };

    const handleVerifyPassword = async () => {
  try {
    const db = getDatabase();

    // ✅ Step 1: Get stored password hash
    const passRef = ref(db, `users/${username}/password`);
    const passSnap = await get(passRef);
    const storedHash = passSnap.val();
    const inputHash = SHA256(password).toString();

    if (inputHash !== storedHash) {
      return alert("Incorrect password");
    }

    setRecoveryMnemonic(mnemonic);
    setShowPasswordPrompt(false);
    setShowRecoveryPhrase(true);

  } catch (err) {
    console.error("Error fetching or decoding seed:", err);
    alert("Something went wrong while verifying.");
  }
};


    return (
        <div className="min-h-screen px-4 py-6 bg-gradient-to-br from-purple-900 via-black to-purple-950 text-white">
            <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-center sm:text-left">Manage My Accounts</h1>

            <div className="space-y-4">
                {wallets.map((wallet) => (
                    <div
                        key={wallet.index}
                        className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-xl bg-white/10 border border-purple-700 shadow-md"
                    >
                        <div className="mb-2 sm:mb-0">
                            <p className="font-semibold text-lg">{wallet.name}</p>
                            <p className="text-xs text-purple-300 break-all">{wallet.publicKey}</p>
                        </div>
                        <button
                            onClick={() => handleShowPopup(wallet)}
                            className="bg-purple-700 hover:bg-purple-600 px-4 py-2 rounded-lg text-sm"
                        >
                            Manage
                        </button>
                    </div>
                ))}
            </div>

            {showPopup && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
                    <div className="bg-zinc-900 p-6 rounded-xl w-full max-w-sm space-y-4 border border-purple-700">
                        <h2 className="text-xl font-bold">Wallet Options</h2>
                        <button className="w-full bg-purple-700 hover:bg-purple-800 py-2 rounded">Change Name</button>
                        <button
                            className="w-full bg-purple-700 hover:bg-purple-800  py-2 rounded"
                            onClick={() => setShowPasswordPrompt(true)}
                        >
                            Show Recovery Phrase
                        </button>
                        <button
                            className="w-full bg-purple-700 hover:bg-purple-800 py-2 rounded"
                            onClick={() => alert('Private Key: (secure this!)')}
                        >
                            Show Private Key
                        </button>
                        <button
                            className="w-full bg-purple-700 hover:bg-purple-800 py-2 rounded"
                            onClick={handleRemoveWallet}
                        >
                            Remove Wallet
                        </button>
                        <button
                            onClick={() => setShowPopup(false)}
                            className="w-full bg-gray-600 hover:bg-gray-700 py-2 rounded"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {showPasswordPrompt && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
                    <div className="bg-zinc-900 p-6 rounded-xl w-full max-w-sm border border-purple-700">
                        <h2 className="text-lg font-bold mb-4">Enter your password</h2>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            className="w-full p-2 rounded bg-purple-950 text-white border border-purple-600"
                        />
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setShowPasswordPrompt(false)} className="bg-gray-600 px-4 py-2 rounded">
                                Cancel
                            </button>
                            <button onClick={handleVerifyPassword} className="bg-purple-700 px-4 py-2 rounded">
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showRecoveryPhrase && (
                <div className="fixed inset-0 bg-black/90 text-white z-50 flex items-center justify-center px-4">
                    <div className="bg-zinc-900 p-6 rounded-xl max-w-lg w-full border border-purple-700 space-y-4">
                        <h2 className="text-2xl font-bold text-purple-400">Recovery Phrase</h2>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Please store your recovery phrase securely. It can be used to recover access to your wallet.
                            Do not share it with anyone.
                        </p>
                        <div className="bg-purple-950 p-4 rounded-lg text-purple-300 grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm font-mono">
                            {recoveryMnemonic.split(" ").map((word, index) => (
                                <div key={index} className="bg-purple-900 px-3 py-2 rounded-md border border-purple-600">
                                    {index + 1}. {word}
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={() => {
                                    setShowRecoveryPhrase(false);
                                    setShowPopup(false);
                                     navigate("/wallet", { state: { username,mnemonic } });
                                }}
                                className="bg-purple-700 px-6 py-2 rounded-lg"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageWallets;
