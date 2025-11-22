"use client";

import { useState, useEffect } from "react";
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  Loader2,
  Upload,
  CheckCircle,
  AlertCircle,
  Building2,
  FileText,
} from "lucide-react";
import { ethers } from "ethers";
import DocumentVerificationArtifact from '../abis/DocumentVerification.json';

const OCR_API_URL = "https://ocr-service-1.onrender.com/ocr";
const CONTRACT_ADDRESS = "0x3A632ee2c3F3B8BaFb85acD06427a2E3728d7F69"; // updated contract address

const AdminDocumentUpload = () => {
  const { address, isConnected } = useAccount();
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [orgs, setOrgs] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setSuccessMessage(null);
    setUploadError(null);
  };

  const handleOrgChange = (e) => {
    setSelectedOrg(e.target.value);
  };

  // Add these drag handlers after the existing handlers
  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setSuccessMessage(null);
      setUploadError(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadError("Please select a file.");
      return;
    }
    if (!address) {
      return;
    }
    if (!selectedOrg) {
      setUploadError("Please select an organization.");
      return;
    }
    setIsProcessing(true);
    setSuccessMessage(null);
    setUploadError(null);
    try {
      // 1. Send file to OCR API
      const formData = new FormData();
      formData.append("file", file);
      const ocrRes = await fetch(OCR_API_URL, {
        method: "POST",
        body: formData,
      });
      const ocrData = await ocrRes.json();
      if (!ocrData.success) throw new Error(ocrData.error || "OCR failed");
      const { hexHash, name, contactNumber, residence, rawText, phash } = ocrData.data;
      // 2. Convert hexHash to bytes32
      const hashBytes32 = ethers.hexlify(
        ethers.getBytes("0x" + hexHash.replace(/^0x/, ""))
      );
      // Debug print
      console.log(
        "Registering document with hash:",
        hashBytes32,
        "hexHash:",
        hexHash,
        "phash:",
        phash
      );
      console.log("Extracted text:", rawText);
      // 3. Create contract instance
      let provider;
      if (window.ethereum) {
        provider = new ethers.BrowserProvider(window.ethereum);
      } else {
        const rpcUrl = process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";
        provider = new ethers.JsonRpcProvider(rpcUrl);
      }
      const contract = new ethers.Contract(CONTRACT_ADDRESS, DocumentVerificationArtifact.abi, provider);
      // 4. Check if document is already registered
      const alreadyRegistered = await contract.documentExists(hashBytes32);
      if (alreadyRegistered) {
        setUploadError("This document has already been registered.");
        setIsProcessing(false);
        return;
      }
      // 5. Register document on-chain (with selected org and phash)
      const signer = await provider.getSigner();
      const contractWithSigner = contract.connect(signer);
      const tx = await contractWithSigner.registerDocument(selectedOrg, hashBytes32, phash);
      await tx.wait();
      setSuccessMessage("Document hash registered on-chain!");
      setFile(null);

      // Debug: Check if document is indexed in the subgraph
      try {
        const SUBGRAPH_URL = "https://api.studio.thegraph.com/query/111188/doc-guard-sg/0.7.0";
        const query = `query GetOrganizationDocuments($orgId: Bytes!) { organization(id: $orgId) { documents { documentHash } } }`;
        const variables = { orgId: selectedOrg };
        const res = await fetch(SUBGRAPH_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, variables }),
        });
        const data = await res.json();
        const hashes = (data.data.organization?.documents || []).map(doc => doc.documentHash);
        console.log("Subgraph document hashes after registration:", hashes);
        if (!hashes.includes(hashBytes32)) {
          setUploadError("Document not yet indexed in the subgraph. Please wait a few seconds and refresh.");
        }
      } catch (subgraphErr) {
        console.error("Error querying subgraph after registration:", subgraphErr);
      }
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    const fetchOrgs = async () => {
      setUploadError(null);
      setOrgs([]);
      setSelectedOrg("");
      if (!address) {
        setUploadError("Please connect your wallet to view your organizations.");
        return;
      }
      try {
        let provider;
        if (window.ethereum) {
          provider = new ethers.BrowserProvider(window.ethereum);
        } else {
          const rpcUrl = process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";
          provider = new ethers.JsonRpcProvider(rpcUrl);
        }
        const network = await provider.getNetwork();
        console.log("Connected network:", network);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, DocumentVerificationArtifact.abi, provider);
        const orgIds = await contract.getAdminOrganizations(address);
        console.log("Fetched orgIds:", orgIds);
        const orgDetails = await Promise.all(
          orgIds.map(async (orgId) => {
            const details = await contract.getOrganizationDetails(orgId);
            console.log("Org details for", orgId, details);
            return {
              orgId,
              name: details[0],
              description: details[1],
              admin: details[2],
              isActive: details[3],
              createdAt: details[4],
            };
          })
        );
        setOrgs(orgDetails);
        if (orgDetails.length > 0) setSelectedOrg(orgDetails[0].orgId);
      } catch (err) {
        console.error("Error fetching organizations:", err);
        setUploadError("Failed to fetch organizations. Make sure you are connected to the correct network and have registered organizations.");
      }
    };
    fetchOrgs();
  }, [address]);

  return (
    <div className="bg-gradient-to-br from-background to-muted/20 border border-border/50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-8">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
          <Upload className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-2xl font-semibold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          Admin: Upload Document
        </h2>
      </div>

      {/* Organization Dropdown */}
      {orgs.length > 0 && orgs.filter(org => org.isActive).length === 0 ? (
        <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center space-x-2 text-yellow-700 dark:text-yellow-400">
            <AlertCircle className="w-5 h-5" />
            <span>
              You have registered organizations, but none are currently active. Please activate an organization to upload documents.
            </span>
          </div>
        </div>
      ) : orgs.filter(org => org.isActive).length > 0 ? (
        <div className="mb-6">
          <label
            htmlFor="org-select"
            className="flex items-center space-x-2 text-sm font-medium text-foreground mb-3"
          >
            <Building2 className="w-4 h-4 text-blue-500" />
            <span>Select Organization</span>
          </label>
          <select
            id="org-select"
            value={selectedOrg}
            onChange={handleOrgChange}
            className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-blue-300"
          >
            {orgs.filter(org => org.isActive).map((org) => (
              <option key={org.orgId} value={org.orgId}>
                {org.name} ({org.orgId.slice(0, 8)}...)
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>
              No organizations found. Please register an organization first.
            </span>
          </div>
        </div>
      )}

      {/* File Upload Section */}
      <div className="mb-6">
        <label className="flex items-center space-x-2 text-sm font-medium text-foreground mb-3">
          <FileText className="w-4 h-4 text-green-500" />
          <span>Upload Document</span>
        </label>
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 cursor-pointer group ${
            dragActive
              ? "border-green-500 bg-gradient-to-br from-green-50/60 to-blue-50/40 dark:from-green-900/20 dark:to-blue-900/10 scale-105"
              : file
              ? "border-green-400 bg-gradient-to-br from-green-50/40 to-blue-50/20 dark:from-green-900/10 dark:to-blue-900/5"
              : "border-blue-400 bg-gradient-to-br from-blue-50/40 to-green-50/20 dark:from-blue-900/10 dark:to-green-900/5 hover:border-blue-500 hover:bg-gradient-to-br hover:from-blue-50/60 hover:to-green-50/40"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => document.getElementById("file-input").click()}
        >
          <div className="flex flex-col items-center justify-center text-center">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-300 ${
                file
                  ? "bg-gradient-to-r from-green-500 to-blue-500 scale-110"
                  : "bg-gradient-to-r from-blue-500 to-green-500 group-hover:scale-110"
              }`}
            >
              <Upload className="w-8 h-8 text-white" />
            </div>
            {file ? (
              <div className="space-y-2">
                <p className="text-green-700 dark:text-green-200 font-semibold text-lg">
                  {file.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Ready to upload</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-blue-700 dark:text-blue-200 font-semibold text-lg group-hover:text-blue-800 transition-colors duration-200">
                  Drag & Drop your document here
                </p>
                <p className="text-muted-foreground">
                  or click to select a file
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-3">
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                    PDF
                  </span>
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">
                    DOC
                  </span>
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full">
                    DOCX
                  </span>
                  <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs rounded-full">
                    JPG
                  </span>
                  <span className="px-2 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 text-xs rounded-full">
                    PNG
                  </span>
                </div>
              </div>
            )}
          </div>
          <input
            id="file-input"
            type="file"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />
        </div>
      </div>

      <button
        onClick={handleUpload}
        disabled={isProcessing || !file || !selectedOrg}
        className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100 shadow-lg hover:shadow-xl disabled:shadow-none flex items-center justify-center"
      >
        {isProcessing ? (
          <>
            <Loader2 className="animate-spin mr-2 h-5 w-5" />
            Processing...
          </>
        ) : (
          <>
            <Upload className="w-5 h-5 mr-2" />
            Upload & Register
          </>
        )}
      </button>

      {successMessage && (
        <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-lg animate-fade-in">
          <div className="flex items-center space-x-2 text-green-700 dark:text-green-300">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      {uploadError && (
        <div className="mt-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 border border-red-200 dark:border-red-800 rounded-lg animate-fade-in">
          <div className="flex items-center space-x-2 text-red-700 dark:text-red-300">
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium">{uploadError}</span>
          </div>
        </div>
      )}

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

export default AdminDocumentUpload;
