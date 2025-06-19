import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css'
import Welcome from './pages/Welcome'
import Register from './pages/Register';
import Wallet from './pages/Wallet';
import ManageWallets from './pages/ManageWallet';

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
       <Router>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/register" element={<Register />} />
        <Route path="/wallet" element={<Wallet/>}/>
        <Route path="/manage-wallets"element={<ManageWallets/>}/>
      </Routes>
    </Router>
    </>
  )
}

export default App
