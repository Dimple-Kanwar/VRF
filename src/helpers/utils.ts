import { ethers } from "ethers";
import dotenv from "dotenv";
import { abi} from "../artifacts/src/contracts/VRF.sol/VRF.json";
dotenv.config();

const networkUrl = process.env.RPC_URL;
const privateKey = process.env.WALLET_PRIVATE_KEY;
const JM_ABI = [
    "function executeJob(uint256 jobId, bytes memory data,bytes memory attestation) external"
  ];
// Get provider details
export const getProviderDetails = async () => {
 const provider = new ethers.JsonRpcProvider(networkUrl);
  const signer = new ethers.Wallet(privateKey!, provider);
 
  // Return signer and provider
  return { signer, provider };
};

export const getJobManagerContract = async() => {
  const { signer, provider } = await getProviderDetails();
  const jobManagerContract = new ethers.Contract(process.env.JOB_MANAGER_CONTRACT_ADDRESS, JM_ABI, signer);
  return jobManagerContract;
}

export const getVFRContract = async() => {
  const { signer, provider } = await getProviderDetails();
  const vrfContract = new ethers.Contract(process.env.VRF_CONTRACT_ADDRESS, abi, signer);
  return vrfContract;
}