
import { ethers, getBytes, keccak256, toBeArray, Wallet } from 'ethers';
import { readFileSync } from 'fs';
import path from 'path';
import "dotenv/config";
import {sendLogMessage} from "./logger"
import { berachain } from "./constants.json";
import { gasKey, rewardsAddress } from "./app/config.json";
import { JobManager__factory } from '../typechain-types';
const abiCoder = ethers.AbiCoder.defaultAbiCoder();


// Get provider details
export const getProviderDetails = async (key: string) => {
    const provider = new ethers.JsonRpcProvider(berachain.rpcUrl);
    const signer = new ethers.Wallet(key, provider);
    // Return signer and provider
    return { signer, provider };
};


// attestation i.e enclave signature

export const getAttestation = async (data: string, jobId: any, privateKey: string) => {
    // read attestation private key from a file
    const attestation_private_key = privateKey
    console.log("attestation_private_key: ", attestation_private_key);
    sendLogMessage(`attestation_private_key: ${attestation_private_key}`)
    const input = "0x1234";
    console.log("data: ", data);
    console.log("input: ", input);
    console.log("jobId: ", jobId);
    console.log("rewardsAddress: ", rewardsAddress);
    // encode data, input and jobId to get it signed with the attestation private key
    const encodedData = abiCoder.encode(["bytes", "bytes", "uint256", "address"], [
        data,
        input,
        jobId,
        rewardsAddress]);
    console.log("encodedData: ", encodedData);
    sendLogMessage(`encodedData: ${encodedData}`)
    let hash: Uint8Array | string = keccak256(encodedData);
    console.log("hash: ", hash);
    sendLogMessage(`hash: ${hash}`)
    const wallet = new Wallet(`0x${attestation_private_key}`);
    sendLogMessage(`wallet: ${wallet.address}`)
    console.log("wallet: ", wallet.address);
    const enclaveSign = await wallet.signMessage(getBytes(hash));
    console.log("enclaveSign: ", enclaveSign);
    sendLogMessage(`enclaveSign: ${enclaveSign}`)
    return enclaveSign;
}

export const generateRandomness = async (userWallet: ethers.Wallet) => {
    const randomNum = Math.random() * 1E18;
    console.log("randomNum: ", randomNum);
    sendLogMessage(`randomNum: ${randomNum}`);
    const tmp = toBeArray(randomNum.toString());
    const hashedRandomNum = ethers.solidityPackedKeccak256(['bytes'], [tmp])
    console.log("hashedRandomNum: ", hashedRandomNum);
    sendLogMessage(`hashedRandomNum: ${hashedRandomNum}`);
    const hashedRandomNum1 = ethers.solidityPackedKeccak256(['bytes'], [toBeArray(hashedRandomNum)]);
    console.log("hashedRandomNum1: ", hashedRandomNum1);
    sendLogMessage(`hashedRandomNum1: ${hashedRandomNum1}`);
    // user signs the vrf
    console.log("userWallet: ", userWallet.address);
    const signature = await userWallet.signMessage(toBeArray(hashedRandomNum1))
    console.log("signature: ", signature);
    sendLogMessage(`signature: ${signature}`);
    const data = abiCoder.encode(["bytes", "bytes", "address"], [hashedRandomNum, signature, userWallet.address]);
    console.log("data: ", data);
    sendLogMessage(`data: ${data}`);
    return { data, hashedRandomNum };
}

export const executeJob = async (jobId: any, data: any, agent: ethers.ContractRunner, jobManagerAddress: string) => {
    
    const attestation_private_key = readFileSync(path.join(__dirname, './app/secp.sec')).toString('hex');
    const attestation = await getAttestation(data, jobId, attestation_private_key);
    const jobManagerContract = JobManager__factory.connect(jobManagerAddress, agent);
    return await jobManagerContract.executeJob(jobId, data, rewardsAddress, attestation)
        .then(((response) => {
            sendLogMessage("Job executed successfully.");
            console.log("Job executed successfully.");
            sendLogMessage(`response: ${JSON.stringify(response)}`);
            console.log(`response: ${JSON.stringify(response)}`);
            return response.hash;
        }))
        .catch((err) => {
            sendLogMessage(`Job execution failed. Err: ${JSON.stringify(err)}`);
            sendLogMessage(`Job execution failed. Err: ${err.message}`);
            return err.message;
        });
}
