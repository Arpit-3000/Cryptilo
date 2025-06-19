import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as bip39 from "bip39";
import bs58 from "bs58";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, child } from "firebase/database";
import { rtdb } from "../utils/firebaseConfig"
import SHA256 from "crypto-js/sha256";


const db1 = rtdb;

const Register = () => {
  
  const navigate = useNavigate();
  const location = useLocation();
  const mnemonic = location.state?.mnemonic;
  console.log(mnemonic);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!mnemonic) navigate("/");
  }, [mnemonic]);

 const handleRegister = async (mnemonic) => {
  setError("");

  if (!username || !password || !confirmPassword) {
    return setError("All fields are required.");
  }
  if (password !== confirmPassword) {
    return setError("Passwords do not match.");
  }

  const dbRef = ref(db1);
  const snapshot = await get(child(dbRef, `users/${username}`));
  if (snapshot.exists()) {
    return setError("Username already exists.");
  }

  
  

  // Hash password and seedBase58
  const hashedPassword = SHA256(password).toString();
  

  // Store hashed credentials and original base58 seed for local use
  await set(ref(db1, `users/${username}`), {
    password: hashedPassword,
    createdAt: new Date().toISOString(),
  });
  navigate("/wallet", { state: { username,mnemonic } });
};

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-white via-gray-100 to-purple-100 dark:from-black dark:via-gray-900 dark:to-purple-900 px-4 font-sans transition-colors duration-700">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 sm:p-10 shadow-2xl w-full max-w-lg">
        <h2 className="text-3xl font-bold text-purple-700 dark:text-purple-300 text-center mb-6">
          Create Your Wallet
        </h2>
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

        <input
          type="text"
          placeholder="Username"
          className="w-full mb-4 p-3 rounded-lg border border-purple-300 dark:border-purple-600 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full mb-4 p-3 rounded-lg border border-purple-300 dark:border-purple-600 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm Password"
          className="w-full mb-6 p-3 rounded-lg border border-purple-300 dark:border-purple-600 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button
          onClick={()=>{handleRegister(mnemonic)}}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition"
        >
          Register
        </button>
      </div>
    </div>
  );
};

export default Register;
