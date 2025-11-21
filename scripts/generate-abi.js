const fs = require('fs');
const path = require('path');

async function main() {
  // Read the contract artifact
  const artifactPath = path.join(__dirname, '../artifacts/contracts/DocumentVerification.sol/DocumentVerification.json');
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

  // Create the abis directory if it doesn't exist
  const abiDir = path.join(__dirname, '../subgraph/abis');
  if (!fs.existsSync(abiDir)) {
    fs.mkdirSync(abiDir, { recursive: true });
  }

  // Write the ABI to a file
  const abiPath = path.join(abiDir, 'DocumentVerification.json');
  fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));

  console.log('ABI file generated successfully at:', abiPath);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 