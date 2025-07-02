import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css'
import { Toaster } from 'react-hot-toast';
import Welcome from './pages/Welcome'
import Register from './pages/Register';
import Wallet from './pages/Wallet';
import ManageWallets from './pages/ManageWallet';
import SolanaDetails from "./pages/SolanaDetails";

function App() {
  

  return (
    <>

       <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#1e1b4b', 
            color: '#fff',
            border: '1px solid #7c3aed',
            fontFamily: 'serif',
          },
        }}
      />
       <Router>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/register" element={<Register />} />
        <Route path="/wallet" element={<Wallet/>}/>
        <Route path="/manage-wallets"element={<ManageWallets/>}/>
        <Route path="solana-details" element={<SolanaDetails/>}/>
      </Routes>
    </Router>
    </>
  )
}

export default App
