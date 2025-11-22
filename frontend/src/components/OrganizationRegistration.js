"use client";

import { useState } from "react";
import { useAccount, useChainId } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  Building2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useWriteContract } from 'wagmi';
import DocumentVerificationArtifact from '../abis/DocumentVerification.json';

const CONTRACT_ADDRESS = "0x3A632ee2c3F3B8BaFb85acD06427a2E3728d7F69";
const ARBITRUM_SEPOLIA_CHAIN_ID = 421614;

const OrganizationRegistration = () => {
  const { address, isConnected } = useAccount();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationError, setRegistrationError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const chainId = useChainId();

  const { writeContract, data, isPending, isSuccess, error } = useWriteContract();

  console.log("Wagmi network:", chainId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isConnected) return;
    setRegistrationError(null);
    setSuccessMessage(null);
    setIsRegistering(true);
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: DocumentVerificationArtifact.abi,
      functionName: 'registerOrganization',
      args: [name, description],
      chainId: ARBITRUM_SEPOLIA_CHAIN_ID,
    });
    setIsRegistering(false);
  };

  if (!isConnected) {
    return (
      <div className="bg-gradient-to-br from-background to-muted/20 border border-border/50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Connect Wallet to Register Organization
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Connect your Web3 wallet to start registering your organization on the blockchain
          </p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  if (chainId !== ARBITRUM_SEPOLIA_CHAIN_ID) {
    return (
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-6 rounded-lg mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <AlertCircle className="w-5 h-5 text-yellow-500" />
          <span className="font-semibold">Wrong Network</span>
        </div>
        <p>Please switch your wallet to <b>Arbitrum Sepolia</b> (chainId 421614) to register an organization.</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-background to-muted/20 border border-border/50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-8">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Register Organization
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="name"
            className="flex items-center space-x-2 text-sm font-medium text-foreground mb-3"
          >
            <Building2 className="w-4 h-4 text-blue-500" />
            <span>Organization Name</span>
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-300"
            placeholder="Enter organization name"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="flex items-center space-x-2 text-sm font-medium text-foreground mb-3"
          >
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span>Description</span>
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-300 resize-none"
            placeholder="Enter organization description"
          />
        </div>

        <button
          type="submit"
          disabled={isRegistering || isPending || !name.trim() || !description.trim()}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100 shadow-lg hover:shadow-xl disabled:shadow-none flex items-center justify-center"
        >
          {(isRegistering || isPending) ? (
            <>
              <Loader2 className="animate-spin mr-2 h-5 w-5" />
              Registering...
            </>
          ) : (
            <>
              <Building2 className="w-5 h-5 mr-2" />
              Register Organization
            </>
          )}
        </button>

        {registrationError && (
          <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 border border-red-200 dark:border-red-800 rounded-lg animate-fade-in">
            <div className="flex items-center space-x-2 text-red-700 dark:text-red-300">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium">{registrationError || (error && error.message)}</span>
            </div>
          </div>
        )}

        {(successMessage || isSuccess) && (
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-lg animate-fade-in">
            <div className="flex items-center space-x-2 text-green-700 dark:text-green-300">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium">{successMessage || 'Organization registration transaction sent!'}</span>
            </div>
          </div>
        )}
      </form>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default OrganizationRegistration;
