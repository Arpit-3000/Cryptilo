# 🚀 Cryptilo — Solana Wallet Web App

Cryptiloe is a modern and secure Solana blockchain wallet built using React and Firebase. It enables users to **create wallets**, **send and receive SOL**, and **view transaction history** — all within a sleek, responsive UI.

### 🌐 Live Preview  
🔗 [Try Cryptiloe Live](https://your-deployed-site.vercel.app)  
*(Replace with actual deployed URL)*

---

## ⚙️ Tech Stack

| Layer          | Tech Used                                   |
|----------------|----------------------------------------------|
| Frontend       | React.js, TailwindCSS, Framer Motion         |
| Backend/Auth   | Firebase Realtime Database + Auth            |
| Blockchain     | Solana Web3.js, Alchemy RPC API              |
| Environment    | Node.js, Vite or CRA (React)                 |
| Deployment     | Vercel / Netlify / Firebase Hosting          |

---

## ✨ Features

- 🔐 **Wallet Creation** — Secure generation of new Solana wallets
- 🔑 **Encrypted Private Keys** — Stored securely with AES + password
- 💸 **Send SOL** — Transfer SOL to any Solana address with password verification
- 📥 **Receive SOL** — Easily receive SOL via public address display
- 📊 **Transaction History** — View latest transactions with details like:
  - Signature
  - Slot & Timestamp
  - Fees
  - Instructions & Signers
  - Explorer links
- 💹 **Live SOL Price** — Integrated real-time SOL/USD price from Coinbase API
- 🌗 **Devnet/Mainnet Toggle (optional)** — Easily test or go live
- 📱 **Responsive Design** — Fully mobile-friendly UI

---

## 🧠 How It Works

1. **Create Wallet**: Generates keypair & encrypts private key with user password.
2. **Store Securely**: Stores public key and encrypted secret key in Firebase.
3. **Send SOL**: Decrypts the private key with password to sign and send transaction.
4. **Track Txns**: Fetches recent signatures and details using Alchemy RPC + Solana Web3.js.

