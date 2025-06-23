import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getDatabase, ref, get, remove, set } from 'firebase/database';
import toast from 'react-hot-toast';
import SHA256 from "crypto-js/sha256";
import CryptoJS from "crypto-js";

const ManageWallets = () => {
    const location = useLocation();
    const username = location.state?.username;
    const mnemonic = location.state?.mnemonic;

    const [wallets, setWallets] = useState([]);
    const [selectedWallet, setSelectedWallet] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [password, setPassword] = useState('');
    const [showPasswordPromptRemove, setShowPasswordPromptRemove] = useState(false);
    const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
    const [showRecoveryPhrase, setShowRecoveryPhrase] = useState(false);
    const [showNewNamePrompt, setShowNewNamePrompt] = useState(false);
    const [newName, setNewName] = useState("");
    const [showConfirmationPrompt, setShowConfirmationPrompt] = useState(false);
    const [recoveryMnemonic, setRecoveryMnemonic] = useState('');
    const [showPrivateKeyPrompt, setShowPrivateKeyPrompt] = useState(false);
    const [decryptedPrivateKey, setDecryptedPrivateKey] = useState('');


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



    //Function to rename Wallet
    const handleChangeName = async () => {

        if (!newName || newName.trim() === "" || newName.trim().toLowerCase() === "null") {
            toast.error("Wallet name cannot be empty or 'null'.");
            return;
        }

        try {
            const db = getDatabase();
            const walletRef = ref(db, `users/${username}/wallets/${selectedWallet.index}`);
            const walletSnap = await get(walletRef);

            if (!walletSnap.exists()) {
                toast.error("Wallet not found.");
                return;
            }

            const wallet = walletSnap.val();
            const updatedWallet = {
                ...wallet,
                name: newName,
            };

            await set(walletRef, updatedWallet);


            setWallets((prev) =>
                prev.map((w) =>
                    w.index === selectedWallet.index ? { ...w, name: newName } : w
                )
            );

            setShowNewNamePrompt(false);
            setNewName('');
            toast.success("Wallet renamed successfully.");
        } catch (error) {
            console.error("Failed to rename wallet:", error);
            toast.error("Something went wrong while renaming.");
        }
    };

    const handleRemoveWallet = async () => {
        if (selectedWallet.index === "0" || selectedWallet.index === 0) {
            toast.error("You cannot delete your primary wallet.", {
                icon: '⚠️',
            });
            setShowPopup(false);
            return;
        }

        try {
            const db = getDatabase();
            await remove(ref(db, `users/${username}/wallets/${selectedWallet.index}`));
            setWallets(wallets.filter((w) => w.index !== selectedWallet.index));
            setShowPopup(false);
            setShowConfirmationPrompt(false);
            setShowPasswordPromptRemove(false);

            toast.success("Wallet removed successfully.", {
                icon: '🗑️',
            });
        } catch (err) {
            console.error(err);
            toast.error("Failed to remove wallet. Please try again.");
        }
    };

    const handleVerifyPasswordRemoveWallet = async () => {
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
    }

    const handleVerifyPassword = async () => { //For recoveryPhrase
        try {
            const db = getDatabase();

            const passRef = ref(db, `users/${username}/password`);
            const passSnap = await get(passRef);
            const storedHash = passSnap.val();
            const inputHash = SHA256(password).toString();

            if (inputHash !== storedHash) {
                toast.error("Incorrect password");
                return;
            }

            //Fetching
            const userRef = ref(db, `users/${username}/mnemonic`);
            const mnemonicSnap = await get(userRef);
            const encryptedMnemonic = mnemonicSnap.val();

            //Decrypting
            const bytes = CryptoJS.AES.decrypt(encryptedMnemonic, password);
            const decryptedMnemonic = bytes.toString(CryptoJS.enc.Utf8);

            if (!decryptedMnemonic) {
                toast.error("Failed to decrypt mnemonic — maybe wrong password?");
                return;
            }


            setRecoveryMnemonic(decryptedMnemonic);
            setShowPasswordPrompt(false);
            setShowRecoveryPhrase(true);

        } catch (err) {
            console.error("Error verifying password:", err);
            toast.error("Something went wrong during decryption.");
        }
    };

    const handleVerifyPrivateKeyPassword = async () => {
        try {
            const db = getDatabase();

            const passRef = ref(db, `users/${username}/password`);
            const passSnap = await get(passRef);
            const storedHash = passSnap.val();
            const inputHash = SHA256(password).toString();

            if (inputHash !== storedHash) {
                toast.error("Incorrect password");
                return;
            }

            const privateKeyRef = ref(db, `users/${username}/wallets/${selectedWallet.index}/privateKey`);
            const privateKeySnap = await get(privateKeyRef);
            const encryptedPrivateKey = privateKeySnap.val();

            const bytes = CryptoJS.AES.decrypt(encryptedPrivateKey, password);
            const decrypted = bytes.toString(CryptoJS.enc.Utf8);

            if (!decrypted) {
                toast.error("Failed to decrypt private key — maybe wrong password?");
                return;
            }

            setDecryptedPrivateKey(decrypted);
            setShowPrivateKeyPrompt(false);
        } catch (err) {
            console.error("Error verifying private key password:", err);
            toast.error("⚠️ Something went wrong during decryption.");
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

            {/*Manage Wallet Popup*/}
            {showPopup && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
                    <div className="bg-zinc-900 p-6 rounded-xl w-full max-w-sm space-y-4 border border-purple-700">
                        <h2 className="text-xl font-bold">Wallet Options</h2>
                        <button className="w-full bg-purple-700 hover:bg-purple-800 py-2 rounded" onClick={() => {
                            setShowNewNamePrompt(true);
                            setShowPopup(false);
                        }}>Rename Wallet</button>
                        <button
                            className="w-full bg-purple-700 hover:bg-purple-800  py-2 rounded"
                            onClick={() => {
                                setShowPasswordPrompt(true);
                                setShowPopup(false);
                            }}
                        >
                            Show Recovery Phrase
                        </button>
                        <button
                            className="w-full bg-purple-700 hover:bg-purple-800 py-2 rounded"
                            onClick={() => {
                                setShowPrivateKeyPrompt(true);
                                setShowPopup(false);
                            }}
                        >
                            Show Private Key
                        </button>
                        <button
                            className="w-full bg-purple-700 hover:bg-purple-800 py-2 rounded"
                            onClick={() => {
                                setShowPasswordPromptRemove(true);
                            }}
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


            {/*Renaming Wallet Prompt*/}
            {showNewNamePrompt && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
                    <div className="bg-zinc-900 p-6 rounded-xl w-full max-w-sm border border-purple-700">
                        <h2 className="text-lg font-bold text-purple-400 mb-4">Enter your New Name</h2>
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Rename"
                            className="w-full p-2 rounded bg-purple-950 text-white border border-purple-600"
                        />
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => {
                                setShowNewNamePrompt(false);
                                setNewName('');

                            }} className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded">
                                Cancel
                            </button>
                            <button onClick={handleChangeName} disabled={!newName.trim()} className="bg-purple-700 hover:bg-purple-800 px-4 py-2 rounded">
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/*Password Prompt Remove*/}
            {showPasswordPromptRemove && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
                    <div className="bg-zinc-900 p-6 rounded-xl w-full max-w-sm space-y-4 border border-purple-700">
                        <h2 className="text-lg font-bold text-purple-400">Enter your registered password</h2>
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
                                    setShowConfirmationPrompt(false);
                                    setPassword("");
                                    setShowPasswordPromptRemove(false);
                                }}
                                className="bg-gray-600 px-4 py-2 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    handleVerifyPasswordRemoveWallet()
                                    setPassword("");
                                }
                                }
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
                                    setShowPasswordPromptRemove(false);
                                }}
                                className="bg-gray-600 px-4 py-2 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    handleRemoveWallet();
                                    setShowConfirmationPrompt(false);
                                    setPassword("");
                                    setShowPasswordPromptRemove(false);
                                }}

                                className="bg-red-700 hover:bg-red-600 px-4 py-2 rounded-lg"
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/*PasswordPrompt (reoveryPhrase*/}
            {showPasswordPrompt && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
                    <div className="bg-zinc-900 p-6 rounded-xl w-full max-w-sm border border-purple-700">
                        <h2 className="text-lg font-bold text-purple-400 mb-4">Enter your registered password</h2>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            className="w-full p-2 rounded bg-purple-950 text-white border border-purple-600"
                        />
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setShowPasswordPrompt(false)} className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded">
                                Cancel
                            </button>
                            <button onClick={() => {
                                handleVerifyPassword();

                            }} className="bg-purple-700 hover:bg-purple-800 px-4 py-2 rounded">
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/*Private Key Password Prompt*/}
            {showPrivateKeyPrompt && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
                    <div className="bg-zinc-900 p-6 rounded-xl w-full max-w-sm border border-purple-700">
                        <h2 className="text-lg font-bold text-purple-400 mb-4">Enter your registered password</h2>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                            className="w-full p-2 rounded bg-purple-950 text-white border border-purple-600"
                        />
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setShowPrivateKeyPrompt(false)} className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded">
                                Cancel
                            </button>
                            <button onClick={handleVerifyPrivateKeyPassword} className="bg-purple-700 hover:bg-purple-800 px-4 py-2 rounded">
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/*RecoveryPhrase View Page*/}
            {showRecoveryPhrase && (
                <div className="fixed inset-0 bg-black/90 text-white z-50 flex items-center justify-center px-4">
                    <div className="bg-zinc-900 p-6 rounded-xl max-w-lg w-full border border-purple-700 space-y-4">
                        <h2 className="text-2xl font-bold text-purple-400">Recovery Phrase</h2>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Please store your recovery phrase securely. It can be used to recover access to your wallet.
                            Do not share it with anyone.
                        </p>
                        <div className=" bg-black p-4 rounded-lg text-purple-300 grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm font-mono">
                            {recoveryMnemonic.split(" ").map((word, index) => (
                                <div
                                    key={index}
                                    className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white py-3 px-4 rounded-lg shadow-sm border border-purple-200 dark:border-purple-600 font-mono text-sm tracking-wide flex items-center"
                                >
                                    <span className="font-semibold text-purple-500 mr-2">{index + 1}.</span>
                                    {word}
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={() => {
                                    setShowRecoveryPhrase(false);
                                    setShowPopup(false);
                                    setPassword("");
                                }}
                                className="bg-purple-700 hover:bg-purple-800 px-6 py-2 rounded-lg"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/*PrivateKey View Page*/}
            {decryptedPrivateKey && (
                <div className="fixed inset-0 bg-black/90 text-white z-50 flex items-center justify-center px-4">
                    <div className="bg-zinc-900 p-6 rounded-xl max-w-lg w-full border border-purple-700 space-y-4">
                        <h2 className="text-2xl font-bold text-purple-400">Private Key</h2>
                        <p className="text-sm text-red-400 leading-relaxed">
                            This is your private key. Do not share it with anyone. It gives full access to your wallet.
                        </p>
                        <div className="bg-purple-950 p-4 rounded-lg text-purple-300 text-xs sm:text-sm font-mono break-all border border-purple-600">
                            {decryptedPrivateKey}
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={() => {
                                    setDecryptedPrivateKey('');
                                    setShowPopup(false);
                                    setPassword("");
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