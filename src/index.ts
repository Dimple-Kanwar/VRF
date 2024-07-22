
import { ethers, keccak256, toBeArray, Wallet } from 'ethers';
import { readFileSync } from 'fs';
import { abi } from "./jobManager.json";
import "dotenv/config";
import {berachain} from "./constants.json";
import { gasKey,rewardsAddress, userKey} from "./app/config.json";
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
    const attestation_private_key = readFileSync("/app/secp.sec", { encoding: "utf-8" });
    // const attestation_private_key = "fe06d9507142d660d2a5b0ad6bc7be8560ddbf869ea7ddf779a8cba21dca5ed0";
    const input = "0x1234";
    // encode data, input and jobId to get it signed with the attestation private key
    const encodedData = abiCoder.encode(["bytes", "bytes", "uint256", "address"], [
        data,
        input,
        jobId,
        rewardsAddress]);
    console.log("encodedData: ", encodedData);
    const wallet = new Wallet(attestation_private_key);
    let hash = keccak256(encodedData);
    console.log("hash: ", hash);
    console.log("wallet: ", wallet);

    const bytes = Buffer.from("\x19Ethereum Signed Message:\n32", 'utf-8');
    console.log("2:",bytes.toString('hex'));
    // sign the encodedData with attestation private key
    hash = ethers.solidityPackedKeccak256(['bytes', "bytes"], [bytes, hash])
    console.log("hash2: ", hash);

    const attestation = await wallet.signMessage(toBeArray(hash));
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
    const hashedRandomNum1 = ethers.solidityPackedKeccak256(['bytes'], [toBeArray(hashedRandomNum)]);
    // user signs the vrf
    const userWallet = new Wallet(userKey);
    const signature = await userWallet.signMessage(toBeArray(hashedRandomNum1))
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
