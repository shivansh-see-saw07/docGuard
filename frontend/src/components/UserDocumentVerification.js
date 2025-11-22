"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Building2,
  FileText,
  Upload,
  Loader2,
  Shield,
  X,
} from "lucide-react";
import { ethers } from "ethers";
import DocumentVerificationArtifact from '../abis/DocumentVerification.json';
import { useAccount } from 'wagmi';

const SUBGRAPH_URL =
  "https://api.studio.thegraph.com/query/111188/doc-guard-sg/0.7.0";
const OCR_API_URL = "https://ocr-service-1.onrender.com/ocr";
const CONTRACT_ADDRESS = "0x3A632ee2c3F3B8BaFb85acD06427a2E3728d7F69";

function arrayBufferToHex(buffer) {
  return Array.prototype.map
    .call(new Uint8Array(buffer), (x) => ("00" + x.toString(16)).slice(-2))
    .join("");
}

const UserDocumentVerification = () => {
  const { isConnected } = useAccount();
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [file, setFile] = useState(null);
  const [fileHash, setFileHash] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [ocrText, setOcrText] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [phash, setPhash] = useState("");

  // Fetch organizations from contract
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        let provider;
        if (window.ethereum) {
          provider = new ethers.BrowserProvider(window.ethereum);
        } else {
          const rpcUrl = process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";
          provider = new ethers.JsonRpcProvider(rpcUrl);
        }
        const contract = new ethers.Contract(CONTRACT_ADDRESS, DocumentVerificationArtifact.abi, provider);
        const orgIds = await contract.getAllOrganizationIds();
        const orgDetails = await Promise.all(
          orgIds.map(async (orgId) => {
            const details = await contract.getOrganizationDetails(orgId);
            return {
              id: orgId,
              name: details[0],
              description: details[1],
              admin: details[2],
              isActive: details[3],
              createdAt: details[4],
            };
          })
        );
        setOrganizations(orgDetails);
      } catch (err) {
        setError("Failed to fetch organizations from contract");
      }
    };
    fetchOrganizations();
  }, []);

  // Handle file selection and OCR/hash generation
  const handleFileChange = async (selectedFile) => {
    setFile(null);
    setFileHash("");
    setResult(null);
    setError(null);
    setOcrText("");
    setPhash("");
    if (!selectedFile) return;
    setFile(selectedFile);
    setIsOcrProcessing(true);
    // Send file to OCR service
    const formData = new FormData();
    formData.append("file", selectedFile);
    try {
      const res = await fetch(OCR_API_URL, {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log("OCR Response:", data); // Debug log
      
      if (data.success) {
        let hash = data.data.hexHash || "";
        if (hash && !hash.startsWith("0x")) {
          hash = "0x" + hash;
        }
        setFileHash(hash);
        setOcrText(data.data.rawText || "");
        setPhash(data.data.phash || "");
        console.log("OCR successful - Hash:", hash, "Text:", data.data.rawText); // Debug log
      } else {
        setError("OCR failed: " + (data.error || "Unknown error"));
        console.error("OCR failed:", data.error); // Debug log
      }
    } catch (err) {
      console.error("OCR request failed:", err); // Debug log
      setError("Failed to contact OCR service: " + err.message);
    } finally {
      setIsOcrProcessing(false);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  // Drag and drop handlers
  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
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

  // Hamming distance function for hex strings
  function hammingDistance(a, b) {
    if (!a || !b || a.length !== b.length) return 999;
    let dist = 0;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) dist++;
    }
    return dist;
  }

  // Handle verification
  const handleVerify = async () => {
    if (!selectedOrg || !fileHash || !phash) {
      setError("Please select an organization and upload a file.");
      return;
    }
    setIsVerifying(true);
    setResult(null);
    setError(null);
    // Query subgraph for org's document hashes, deleted status, and phash
    const query = `query GetOrganizationDocuments($orgId: Bytes!, $docHash: Bytes!) {
      organization(id: $orgId) {
        documents(where: { documentHash: $docHash }) {
          documentHash
          deleted
          phash
        }
      }
    }`;
    const variables = { orgId: selectedOrg, docHash: fileHash };
    try {
      const res = await fetch(SUBGRAPH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables }),
      });
      const data = await res.json();
      const docs = data.data.organization?.documents || [];
      if (docs.length > 0) {
        if (docs[0].deleted) {
          setResult("deleted");
        } else {
          // Compare p-hash using Hamming distance
          const storedPhash = docs[0].phash;
          const dist = hammingDistance(phash, storedPhash);
          console.log("[DEBUG] Comparing p-hash:", { uploadedPhash: phash, storedPhash, hammingDistance: dist });
          if (dist < 10) {
            setResult("verified");
          } else {
            setResult("tampered");
          }
        }
      } else {
        setResult("not_verified");
      }
    } catch (err) {
      setError("Verification failed.");
    } finally {
      setIsVerifying(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setFileHash("");
    setResult(null);
    setError(null);
    setOcrText("");
    setPhash("");
  };

  return (
    <div className="bg-gradient-to-br from-background to-muted/20 border border-border/50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-8">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-2xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Verify Your Document
        </h2>
      </div>

      {/* Organization Selection */}
      <div className="mb-6">
        <label
          htmlFor="org-select"
          className="flex items-center space-x-2 text-sm font-medium text-foreground mb-3"
        >
          <Building2 className="w-4 h-4 text-purple-500" />
          <span>Select Organization</span>
        </label>
        <p className="text-sm text-muted-foreground mb-3">
          Choose any registered organization to verify your document against their records.
        </p>
        <select
          id="org-select"
          value={selectedOrg}
          onChange={(e) => setSelectedOrg(e.target.value)}
          className="w-full px-4 py-3 border border-border rounded-lg bg-background focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 hover:border-purple-300"
        >
          <option value="">-- Select Organization --</option>
          {organizations.filter(org => org.isActive).map((org) => (
            <option key={org.id} value={org.id} title={org.description || ""}>
              {org.name} {org.description ? `- ${org.description.substring(0, 50)}${org.description.length > 50 ? '...' : ''}` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* File Upload Area */}
      <div className="mb-6">
        <label className="flex items-center space-x-2 text-sm font-medium text-foreground mb-3">
          <FileText className="w-4 h-4 text-pink-500" />
          <span>Upload Document to Verify</span>
        </label>

        <div
          className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 cursor-pointer group ${
            dragActive
              ? "border-purple-500 bg-gradient-to-br from-purple-50/60 to-pink-50/40 dark:from-purple-900/20 dark:to-pink-900/10 scale-105"
              : file
              ? "border-purple-400 bg-gradient-to-br from-purple-50/40 to-pink-50/20 dark:from-purple-900/10 dark:to-pink-900/5"
              : "border-purple-400 bg-gradient-to-br from-purple-50/40 to-pink-50/20 dark:from-purple-900/10 dark:to-pink-900/5 hover:border-purple-500 hover:bg-gradient-to-br hover:from-purple-50/60 hover:to-pink-50/40"
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
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 scale-110"
                  : "bg-gradient-to-r from-purple-500 to-pink-500 group-hover:scale-110"
              }`}
            >
              <Upload className="w-8 h-8 text-white" />
            </div>

            {file ? (
              <div className="space-y-2">
                <p className="text-purple-700 dark:text-purple-200 font-semibold text-lg">
                  {file.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <div className="flex items-center justify-center space-x-2">
                  {isOcrProcessing ? (
                    <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm font-medium">
                        Processing OCR...
                      </span>
                    </div>
                  ) : fileHash ? (
                    <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Ready to verify
                      </span>
                    </div>
                  ) : null}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile();
                  }}
                  className="mt-2 text-red-500 hover:text-red-700 text-sm flex items-center space-x-1 mx-auto"
                >
                  <X className="w-4 h-4" />
                  <span>Remove file</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-purple-700 dark:text-purple-200 font-semibold text-lg group-hover:text-purple-800 transition-colors duration-200">
                  Drag & Drop your document here
                </p>
                <p className="text-muted-foreground">
                  or click to select a file
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-3">
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full">
                    PDF
                  </span>
                  <span className="px-2 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 text-xs rounded-full">
                    DOC
                  </span>
                  <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs rounded-full">
                    DOCX
                  </span>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                    JPG
                  </span>
                  <span className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 text-xs rounded-full">
                    PNG
                  </span>
                </div>
              </div>
            )}
          </div>

          <input
            id="file-input"
            type="file"
            onChange={handleFileInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />
        </div>

        {/* File Details */}
        {/*
        {fileHash && (
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">Document Hash:</span>
              </div>
              <p className="text-xs font-mono bg-white dark:bg-gray-800 p-2 rounded border break-all">
                {fileHash}
              </p>
            </div>
          </div>
        )}
        */}
      </div>

      {/* Verify Button */}
      <button
        onClick={handleVerify}
        disabled={isVerifying || isOcrProcessing || !selectedOrg || !fileHash}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100 shadow-lg hover:shadow-xl disabled:shadow-none flex items-center justify-center"
      >
        {isVerifying ? (
          <>
            <Loader2 className="animate-spin mr-2 h-5 w-5" />
            Verifying Document...
          </>
        ) : (
          <>
            <Shield className="w-5 h-5 mr-2" />
            Verify Document
          </>
        )}
      </button>

      {/* Results */}
      {result === "verified" && (
        <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-lg animate-fade-in">
          <div className="flex items-center space-x-2 text-green-700 dark:text-green-300">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">Document is VERIFIED ✅</span>
          </div>
          <p className="text-sm text-green-600 dark:text-green-400 mt-2">
            This document has been successfully verified against the blockchain
            records.
          </p>
        </div>
      )}

      {result === "not_verified" && (
        <div className="mt-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 border border-red-200 dark:border-red-800 rounded-lg animate-fade-in">
          <div className="flex items-center space-x-2 text-red-700 dark:text-red-300">
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">
              Document is NOT VERIFIED ❌
            </span>
          </div>
          <p className="text-sm text-red-600 dark:text-red-400 mt-2">
            This document could not be verified against the blockchain records.
          </p>
        </div>
      )}

      {result === "deleted" && (
        <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg animate-fade-in">
          <div className="flex items-center space-x-2 text-yellow-700 dark:text-yellow-300">
            <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">This document was deleted from this organization.</span>
          </div>
          <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
            The document hash exists but has been flagged as deleted by the organization admin.
          </p>
        </div>
      )}

      {result === "tampered" && (
        <div className="mt-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 border border-red-200 dark:border-red-800 rounded-lg animate-fade-in">
          <div className="flex items-center space-x-2 text-red-700 dark:text-red-300">
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">
              Document is TAMPERED ❌
            </span>
          </div>
          <p className="text-sm text-red-600 dark:text-red-400 mt-2">
            The document's visual fingerprint does not match the original. It may have been altered.
          </p>
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 border border-red-200 dark:border-red-800 rounded-lg animate-fade-in">
          <div className="flex items-center space-x-2 text-red-700 dark:text-red-300">
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium">{error}</span>
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

export default UserDocumentVerification;
