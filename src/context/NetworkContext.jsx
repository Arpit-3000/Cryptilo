import React, { createContext, useContext, useState, useEffect } from "react";

const NetworkContext = createContext();

export const NetworkProvider = ({ children }) => {
const [network, setNetwork] = useState("devnet");

  useEffect(() => {
    const savedNetwork = localStorage.getItem("selectedNetwork");
    if (savedNetwork) setNetwork(savedNetwork);
  }, []);

 
  const setNetworkAndPersist = (newNetwork) => {
    setNetwork(newNetwork);
    localStorage.setItem("selectedNetwork", newNetwork);
    window.location.href = "/wallet";
  };
  const solanaAlchemy = network === "devnet"
    ? import.meta.env.VITE_SOLANA_ALCHEMY_DEVNET
    : import.meta.env.VITE_SOLANA_ALCHEMY_MAINNET;

  return (
    <NetworkContext.Provider value={{ network, setNetwork: setNetworkAndPersist, solanaAlchemy }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => useContext(NetworkContext);
