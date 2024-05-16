import { ethers } from "ethers";
import {abi, bytecode} from "../artifacts/src/contracts/VRF.sol/VRF.json"
import { getProviderDetails } from "src/helpers/utils";
// scripts/deploy.js
async function main () {
    const provider = new ethers.JsonRpcProvider(process.env.PROVIDER_URL);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
    // We get the contract to deploy
    const VRF = new ethers.ContractFactory(abi,bytecode,signer);
    console.log('Deploying VRF...');
    const vrf = await VRF.deploy();
    await vrf.deploymentTransaction()
    console.log('VRF deployed to:', vrf.target);
  }
  
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });