# DocGuard - Blockchain Document Verification System

A decentralized document verification platform built on Arbitrum Sepolia (L2) that allows organizations to register and verify documents using blockchain technology and OCR processing.

## 🎯 Problem

Document verification in today's world faces several critical challenges:

- **Fraud and Forgery**: Physical documents can be easily forged or tampered with
- **Centralized Trust**: Reliance on centralized authorities creates single points of failure
- **Inefficient Verification**: Manual verification processes are time-consuming and costly
- **Lack of Transparency**: Users cannot independently verify document authenticity
- **Data Privacy Concerns**: Centralized databases pose security and privacy risks

## 💡 Solution

DocGuard leverages blockchain technology to create a decentralized, transparent, and secure document verification system:

- **Blockchain Immutability**: Document hashes stored on-chain cannot be altered, ensuring permanent verification records
- **Decentralized Trust**: No single authority controls the system - verification is trustless and transparent
- **OCR Integration**: Automatic text extraction from documents (images/PDFs) for seamless processing
- **Public Verification**: Anyone can verify documents against registered organizations without registration
- **Cost-Effective**: Built on Arbitrum Sepolia L2 for low transaction costs
- **Real-time Indexing**: Subgraph provides fast query access to blockchain data

## 🎬 Demo Steps

### Step 1: Connect Your Wallet

1. Visit the DocGuard application
2. Click "Connect Wallet" in the top right corner
3. Select your preferred wallet (MetaMask, WalletConnect, etc.)
4. Ensure you're connected to **Arbitrum Sepolia** testnet
5. Approve the connection request

### Step 2: Register an Organization (Admin)

1. Navigate to the "Admin" section
2. Click "Register Organization"
3. Fill in the organization details:
   - Organization Name
   - Description
4. Click "Register" and confirm the transaction in your wallet
5. Wait for transaction confirmation
6. Your organization is now registered on-chain!

### Step 3: Upload and Register a Document (Admin)

1. In the Admin section, go to "Upload Document"
2. Select a document file (image or PDF) - for demo purposes, you can use any document
3. The system will:
   - Process the document through OCR service
   - Extract text and generate a unique hash
   - Display extracted information
4. Click "Register Document"
5. Confirm the transaction in your wallet
6. The document hash is now permanently stored on the blockchain

### Step 4: Verify a Document (User)

1. Navigate to the "Verify Document" section (no login required)
2. Upload the document you want to verify
3. Select the organization to verify against
4. Click "Verify Document"
5. The system will:
   - Generate the document hash
   - Query the blockchain to check if it's registered
   - Display verification results instantly
6. View the verification status:
   - ✅ **Verified**: Document is registered and authentic
   - ❌ **Not Verified**: Document is not found in the system

### Step 5: View Transaction History

1. Click on any contract address link to view on block explorer
2. See all transactions, events, and contract interactions
3. Verify the on-chain data independently

## 🌐 Deployed Addresses & Explorers

### Smart Contract (Arbitrum Sepolia L2)

**Contract Address**: `0x3A632ee2c3F3B8BaFb85acD06427a2E3728d7F69`

**Explorer Link**:

- **Arbiscan (Arbitrum Sepolia)**: [View Contract](https://sepolia.arbiscan.io/address/0x3A632ee2c3F3B8BaFb85acD06427a2E3728d7F69)

**Network Details**:

- **Network**: Arbitrum Sepolia Testnet (L2)
- **Chain ID**: `421614`
- **RPC URL**: `https://sepolia-rollup.arbitrum.io/rpc`
- **Block Explorer**: https://sepolia.arbiscan.io

### Subgraph (The Graph Protocol)

**Subgraph URL**: https://api.studio.thegraph.com/query/111188/doc-guard-sg/version/latest

**GraphQL Playground**: [Open Playground](https://api.studio.thegraph.com/query/111188/doc-guard-sg/version/latest)

**Network**: Arbitrum Sepolia  
**Indexing**: Real-time blockchain event indexing

### OCR Service

**Service URL**: https://ocr-service-1.onrender.com/ocr

**Health Check**: https://ocr-service-1.onrender.com/health

### Frontend Application

**Local Development**: http://localhost:3000  
**Production**: (Configure your deployment URL)

## 🏗️ Architecture

DocGuard consists of four main components:

- **Frontend (Next.js)**: Modern web interface with direct blockchain integration
- **OCR Service (Python)**: Document processing and text extraction
- **Smart Contract (Solidity)**: On-chain document registration and verification
- **Subgraph (GraphQL)**: Indexed blockchain data for efficient querying

### System Flow

1. **Organization Registration**: Admins register organizations on the blockchain
2. **Document Upload**: Admins upload documents which are processed by OCR service
3. **Document Registration**: Document hashes are stored on the blockchain
4. **Document Verification**: Users can verify documents against any registered organization

## 📋 Features

### For Organizations

- **Organization Registration**: Register your organization on the blockchain
- **Document Upload**: Upload documents with automatic OCR processing
- **Document Management**: View and manage all registered documents
- **Admin Controls**: Manage organization settings and permissions

### For Users

- **Document Verification**: Verify documents against any registered organization
- **Real-time Results**: Instant verification results from blockchain
- **Transparent Process**: All verification data is publicly verifiable
- **No Registration Required**: Anyone can verify documents

### Technical Features

- **Blockchain Security**: All data stored on Arbitrum Sepolia
- **OCR Processing**: Automatic text extraction from images and PDFs
- **Real-time Indexing**: Subgraph provides fast query access
- **Responsive Design**: Works on desktop and mobile devices

## 🔧 Configuration

### Environment Variables

#### Frontend (.env.local)

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x3A632ee2c3F3B8BaFb85acD06427a2E3728d7F69
NEXT_PUBLIC_NETWORK_ID=421614
NEXT_PUBLIC_NETWORK_NAME=Arbitrum Sepolia
NEXT_PUBLIC_SUBGRAPH_URL=https://api.studio.thegraph.com/query/111188/doc-guard-sg/version/latest
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_wallet_connect_project_id
```

#### OCR Service

```env
PYTHONUNBUFFERED=1
OCR_API_KEY=your_ocr_api_key  # Optional, uses fallback OCR if not set or ocr.space api has gone down
```

#### Hardhat (Smart Contracts)

```env
PRIVATE_KEY=your_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
SEPOLIA_RPC_URL=your_rpc_url
```

### Smart Contract

- **Network**: Arbitrum Sepolia Testnet (L2)
- **Contract Address**: `0x3A632ee2c3F3B8BaFb85acD06427a2E3728d7F69`
- **RPC URL**: `https://sepolia-rollup.arbitrum.io/rpc` or `https://arb-sepolia.g.alchemy.com/v2/your_api_key`

### Subgraph

- **Studio URL**: https://api.studio.thegraph.com/query/111188/doc-guard-sg/version/latest
- **Network**: Arbitrum Sepolia
- **Indexing**: Real-time blockchain event indexing

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.8+
- MetaMask or compatible Web3 wallet
- Arbitrum Sepolia testnet ETH

### Getting Testnet ETH

To get Arbitrum Sepolia testnet ETH for testing:

1. **Arbitrum Sepolia Faucet**:

   - Visit [Arbitrum Sepolia Faucet](https://faucet.quicknode.com/arbitrum/sepolia)
   - Connect your wallet and request testnet ETH

2. **Alternative Faucets**:

   - [Alchemy Faucet](https://sepoliafaucet.com/)
   - [Chainlink Faucet](https://faucets.chain.link/)

3. **Bridge from Sepolia**:
   - If you have Sepolia ETH, bridge it to Arbitrum Sepolia using the [Arbitrum Bridge](https://bridge.arbitrum.io/)

**Note**: You'll need testnet ETH to pay for gas fees when registering organizations and documents.

### Local Development

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd doc-guard
   ```

2. **Start OCR Service**

   ```bash
   cd ocr-service
   pip install -r requirements.txt
   python app.py
   ```

3. **Start Frontend**

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - OCR Service: http://localhost:8000

### Troubleshooting

**Common Issues**:

1. **Wallet Connection Issues**:

   - Ensure MetaMask is installed and unlocked
   - Switch to Arbitrum Sepolia network manually if auto-switch fails
   - Add Arbitrum Sepolia network manually:
     - Network Name: Arbitrum Sepolia
     - RPC URL: `https://sepolia-rollup.arbitrum.io/rpc`
     - Chain ID: `421614`
     - Currency Symbol: `ETH`
     - Block Explorer: `https://sepolia.arbiscan.io`

2. **OCR Service Not Responding**:

   - Check if the service is running: `http://localhost:8000/health`
   - Verify Python dependencies are installed
   - For production, check Render service status

3. **Transaction Failures**:

   - Ensure you have sufficient Arbitrum Sepolia testnet ETH
   - Check network congestion
   - Verify contract address is correct

4. **Build Errors**:
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check Node.js version (requires 18+)
   - Verify Python version (requires 3.8+)

## 🔗 Quick Links

- **Smart Contract Explorer**: [Arbiscan](https://sepolia.arbiscan.io/address/0x3A632ee2c3F3B8BaFb85acD06427a2E3728d7F69)
- **Subgraph**: [GraphQL Playground](https://api.studio.thegraph.com/query/111188/doc-guard-sg/version/latest)
- **OCR Service**: [Health Check](https://ocr-service-1.onrender.com/health)
- **Network**: [Arbitrum Sepolia Testnet](https://sepolia.arbiscan.io)
- **Testnet Faucet**: [Get Testnet ETH](https://faucet.quicknode.com/arbitrum/sepolia)
- **Demonstration link** : (https://www.loom.com/share/ae07527bac4646eeb0d5908c469c6de6)
- **Images used** : DemoReal - (https://drive.google.com/file/d/1KwH45btl2DglRYHNNE_eht4YyePYsMkF/view?usp=sharing) 
                    DemoFake - (https://drive.google.com/file/d/19qdf2ZXfMy0MzWe_B-lqsNUXu1nor_dF/view?usp=sharing)

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Deployed on [Arbitrum](https://arbitrum.io/) for low-cost transactions
- Built with [OpenZeppelin](https://openzeppelin.com/) for secure smart contract libraries
- Powered by [The Graph](https://thegraph.com/) for blockchain indexing
