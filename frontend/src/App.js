import React, { useState } from "react";
import { Web3Provider } from "./contexts/Web3Context";
import OrganizationRegistration from "./components/OrganizationRegistration";
import AdminDocumentUpload from "./components/AdminDocumentUpload";
import UserDocumentVerification from "./components/UserDocumentVerification";
import {
  Upload,
  FileText,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  Wallet,
} from "lucide-react";

const DocumentVerificationApp = () => {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("organization");

  const API_BASE_URL = "http://localhost:3001";

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "application/pdf",
        "image/tiff",
        "image/bmp",
      ];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError("Please select a valid image or PDF file");
        return;
      }

      // Validate file size (16MB limit)
      if (selectedFile.size > 16 * 1024 * 1024) {
        setError("File size must be less than 16MB");
        return;
      }

      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("document", file);

      const response = await fetch(`${API_BASE_URL}/upload-and-register`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.message || "Processing failed");
      }
    } catch (err) {
      setError("Network error: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyDocument = async (documentHash) => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/verify-document`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ documentHash }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Document verified successfully!");
      } else {
        setError(data.message || "Verification failed");
      }
    } catch (err) {
      setError("Network error: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleString();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <Web3Provider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              DocGuard - Document Verification System
            </h1>
            <p className="text-gray-600">
              Secure document verification using blockchain technology
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="bg-white dark:bg-zinc-900 rounded-lg p-1 shadow-md">
              <button
                onClick={() => setActiveTab("organization")}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  activeTab === "organization"
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 hover:text-blue-500"
                }`}
              >
                <Wallet className="inline-block w-4 h-4 mr-2" />
                Organization
              </button>
              <button
                onClick={() => setActiveTab("upload")}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  activeTab === "upload"
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 hover:text-blue-500"
                }`}
              >
                <Upload className="inline-block w-4 h-4 mr-2" />
                Upload Document
              </button>
              <button
                onClick={() => setActiveTab("user-verify")}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  activeTab === "user-verify"
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 hover:text-blue-500"
                }`}
              >
                <Shield className="inline-block w-4 h-4 mr-2" />
                Verify Document
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {activeTab === "organization" && <OrganizationRegistration />}
            {activeTab === "upload" && <AdminDocumentUpload />}
            {activeTab === "user-verify" && <UserDocumentVerification />}
          </div>
        </div>
      </div>
    </Web3Provider>
  );
};

export default DocumentVerificationApp;
