import React, { createContext, useContext, useState, useEffect } from "react";

const NetworkContext = createContext();

export const NetworkProvider = ({ children }) => {
const [network, setNetwork] = useState("devnet");

  useEffect(() => {
    const savedNetwork = localStorage.getItem("selectedNetwork");
    if (savedNetwork) setNetwork(savedNetwork);
  }, []);

  // 🟣 When network changes, save it to localStorage
  const setNetworkAndPersist = (newNetwork) => {
    setNetwork(newNetwork);
    localStorage.setItem("selectedNetwork", newNetwork);
    window.location.reload();
  };
  const solanaAlchemy = network === "devnet"
    ? "https://solana-devnet.g.alchemy.com/v2/fJpASw5K4NIUlSgCQfDHMG89HKsrmMZM"
    : "https://solana-mainnet.g.alchemy.com/v2/fJpASw5K4NIUlSgCQfDHMG89HKsrmMZM";

  return (
    <NetworkContext.Provider value={{ network, setNetwork: setNetworkAndPersist, solanaAlchemy }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => useContext(NetworkContext);
