
import { ethers, toBeArray, Wallet } from 'ethers';
import { readFileSync } from 'fs';
import { abi } from "./jobManager.json";
import "dotenv/config";
import {berachain} from "./constants.json";
import { gasKey,rewardsAddress} from "../app/config.json"
const abiCoder = ethers.AbiCoder.defaultAbiCoder();

// Get provider details
export const getProviderDetails = async () => {
    const provider = new ethers.JsonRpcProvider(berachain.rpcUrl);
    const signer = new ethers.Wallet(gasKey, provider);
    // Return signer and provider
    return { signer, provider };
};

// attestation i.e enclave signature

const getAttestation = async (data:string, jobId:any) => {
    // read attestation private key from a file
    const attestation_private_key = readFileSync("/app/secp.sec", { encoding: "hex" });
    // const attestation_private_key = "0x9fda92bd4fb11108438a426ec845debfd9f4e88c6aa3fcad69ca3f4560ba2a22";
    const input = 8943840;
    // encode data, input and jobId to get it signed with the attestation private key
    const encodedData = abiCoder.encode(["bytes", "bytes", "uint256", "address"], [
        toBeArray(data),
        toBeArray(input),
        jobId,
        rewardsAddress]);
    console.log("encodedData: ", encodedData);
    const wallet = new Wallet(attestation_private_key);
    
    // sign the encodedData with attestation private key
    const hash = ethers.solidityPackedKeccak256(['bytes'], [toBeArray(encodedData)])
    console.log("hash: ", hash);

    const attestation = await wallet.signMessage(hash);
    console.log("attestation: ", attestation);
   
    return attestation;
}

export const generateRandomness = async (jobId: any) => {
    const { signer } = await getProviderDetails();
    const randomNum = Math.random() * 1E18;
    console.log("randomNum: ", randomNum);
    const tmp = toBeArray(randomNum.toString());
    const hashedRandomNum = ethers.solidityPackedKeccak256(['bytes'], [tmp])
    console.log("hashedRandomNum: ", hashedRandomNum);
    const hashedRandomNum1 = ethers.solidityPackedKeccak256(['bytes'], [toBeArray(hashedRandomNum)])
    const signature = await signer.signMessage(toBeArray(hashedRandomNum1))
    console.log("signature: ", signature);
    const data = abiCoder.encode(["bytes", "bytes", "address"], [hashedRandomNum, signature, signer.address]);
    console.log("data: ", data);
    
    // execute set randomNum in blockchain via job manager
    const tx = await executeJob(jobId, data, signer);
    console.log("tx: ", tx);
    return tx;
}

const executeJob = async (jobId: any, data: any, signer: ethers.ContractRunner) => {
    const attestation = await getAttestation(data, jobId);
    const jobManagerContract = new ethers.Contract(berachain.jobManagerContractAddress, abi, signer);
    const tx = await jobManagerContract.executeJob(jobId, data, rewardsAddress, attestation);
    return tx;
}

//steps

// enclave start

// server start that accepts jobId & hardcoded path to attestation private key 
// store jobId in a file in any format
// get job details from job manager
// schedule
// executeJob