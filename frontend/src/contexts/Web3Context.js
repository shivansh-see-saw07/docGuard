"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import { InjectedConnector } from "@web3-react/injected-connector";
import DocumentVerificationArtifact from "../abis/DocumentVerification.json";
const DocumentVerificationABI = DocumentVerificationArtifact.abi;

// Contract address - replace with your deployed contract address
const CONTRACT_ADDRESS = "0x21C8904c42322693872D455c3414312DEEAFDA67";

// Supported networks
const SUPPORTED_CHAIN_IDS = [421614]; // Arbitrum Sepolia

// Create injected connector
export const injected = new InjectedConnector({
  supportedChainIds: SUPPORTED_CHAIN_IDS,
});

const Web3Context = createContext();

const ARBITRUM_SEPOLIA_CHAIN_ID = 421614;
const ARBITRUM_SEPOLIA_PARAMS = {
  chainId: "0x6706e6", // 421614 in hex
  chainName: "Arbitrum Sepolia",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["https://sepolia-rollup.arbitrum.io/rpc"],
  blockExplorerUrls: ["https://sepolia.arbiscan.io"],
};

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [networkError, setNetworkError] = useState(null);

  const checkNetwork = async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== ARBITRUM_SEPOLIA_CHAIN_ID) {
        setNetworkError(
          "Please switch to Arbitrum Sepolia network in MetaMask."
        );
        return false;
      } else {
        setNetworkError(null);
        return true;
      }
    }
    return false;
  };

  const switchToArbitrumSepolia = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: ARBITRUM_SEPOLIA_PARAMS.chainId }],
        });
        setNetworkError(null);
      } catch (switchError) {
        // If the chain is not added, add it
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [ARBITRUM_SEPOLIA_PARAMS],
            });
            setNetworkError(null);
          } catch (addError) {
            setNetworkError("Failed to add Arbitrum Sepolia network.");
          }
        } else {
          setNetworkError("Failed to switch network.");
        }
      }
    }
  };

  const connect = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      // Check network before connecting
      const ok = await checkNetwork();
      if (!ok) return;
      await injected.activate();
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const account = await signer.getAddress();
      const network = await provider.getNetwork();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        DocumentVerificationABI,
        signer
      );
      setProvider(provider);
      setContract(contract);
      setAccount(account);
      setChainId(Number(network.chainId));
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      setError(error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      await injected.deactivate();
      setAccount(null);
      setChainId(null);
      setProvider(null);
      setContract(null);
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      setError(error.message);
    }
  };

  // Register organization function
  const registerOrganization = async (name, description) => {
    try {
      if (!contract) throw new Error("Contract not initialized");
      const tx = await contract.registerOrganization(name, description);
      const receipt = await tx.wait();
      // Parse logs for OrganizationRegistered event
      let orgId = null;
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed.name === "OrganizationRegistered") {
            orgId = parsed.args[0];
            break;
          }
        } catch (e) {
          // Not the right event, skip
        }
      }
      if (!orgId) {
        throw new Error(
          "OrganizationRegistered event not found in transaction receipt."
        );
      }
      return orgId;
    } catch (error) {
      console.error("Error registering organization:", error);
      throw error;
    }
  };

  // Get organization details
  const getOrganization = async (orgId) => {
    try {
      if (!contract) throw new Error("Contract not initialized");
      return await contract.getOrganization(orgId);
    } catch (error) {
      console.error("Error getting organization:", error);
      throw error;
    }
  };

  // Check if organization is registered
  const isOrganizationRegistered = async (orgId) => {
    try {
      if (!contract) throw new Error("Contract not initialized");
      return await contract.isOrganizationRegistered(orgId);
    } catch (error) {
      console.error("Error checking organization:", error);
      throw error;
    }
  };

  // Check if a document hash is already registered
  const isDocumentRegistered = async (hashBytes32) => {
    try {
      if (!contract) throw new Error("Contract not initialized");
      return await contract.documentExists(hashBytes32);
    } catch (error) {
      console.error("Error checking document existence:", error);
      throw error;
    }
  };

  // Fetch all organization IDs for the current admin
  const getAdminOrganizations = async () => {
    try {
      if (!contract || !account)
        throw new Error("Contract or account not initialized");
      return await contract.getAdminOrganizations(account);
    } catch (error) {
      console.error("Error fetching admin organizations:", error);
      throw error;
    }
  };

  // Fetch organization details for a given org ID
  const getOrganizationDetails = async (orgId) => {
    try {
      if (!contract) throw new Error("Contract not initialized");
      return await contract.getOrganizationDetails(orgId);
    } catch (error) {
      console.error("Error fetching organization details:", error);
      throw error;
    }
  };

  // Register document function
  const registerDocument = async (organizationId, documentHash) => {
    try {
      if (!contract) throw new Error("Contract not initialized");
      const tx = await contract.registerDocument(organizationId, documentHash);
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error("Error registering document:", error);
      throw error;
    }
  };

  useEffect(() => {
    // Check if already connected
    const checkConnection = async () => {
      if (window.ethereum) {
        await checkNetwork();
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          connect();
        }
      }
    };
    checkConnection();
    // Listen for network changes
    if (window.ethereum) {
      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    }
    // Cleanup
    return () => {
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener("chainChanged", () => {
          window.location.reload();
        });
      }
    };
  }, []);

  return (
    <Web3Context.Provider
      value={{
        account,
        chainId,
        provider,
        contract,
        isConnecting,
        error,
        connect,
        disconnect,
        registerOrganization,
        getOrganization,
        isOrganizationRegistered,
        isDocumentRegistered,
        getAdminOrganizations,
        getOrganizationDetails,
        networkError,
        switchToArbitrumSepolia,
        registerDocument,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
};
