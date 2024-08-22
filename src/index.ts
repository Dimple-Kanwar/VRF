
import { concat, ethers, keccak256, recoverAddress, toBeArray, toUtf8Bytes, Wallet } from 'ethers';
import { readFileSync } from 'fs';
import { abi } from "./jobManager.json";
import "dotenv/config";
import {sendLogMessage} from "./logger"
import {ec} from "elliptic";
import {berachain} from "./constants.json";
import { gasKey,rewardsAddress, userKey} from "./app/config.json";
const abiCoder = ethers.AbiCoder.defaultAbiCoder();
const EC = new ec("secp256k1");

// Get provider details
export const getProviderDetails = async () => {
    const provider = new ethers.JsonRpcProvider(berachain.rpcUrl);
    const signer = new ethers.Wallet(gasKey, provider);
    // Return signer and provider
    return { signer, provider };
};


// attestation i.e enclave signature

export const getAttestation = async (data:string, jobId:any) => {
    // read attestation private key from a file
    const attestation_private_key = readFileSync("/home/boss/Work/Decimal/VRF/src/app/secp.sec").toString('hex');
    console.log("attestation_private_key: ", attestation_private_key);
    sendLogMessage(`attestation_private_key: ${attestation_private_key}`)
    const input = "0x1234";
    // encode data, input and jobId to get it signed with the attestation private key
    const encodedData = abiCoder.encode(["bytes", "bytes", "uint256", "address"], [
        data,
        input,
        jobId,
        rewardsAddress]);
        console.log("encodedData: ", encodedData);
    sendLogMessage(`encodedData: ${encodedData}`)
    let hash : Uint8Array | string = keccak256(encodedData);
    console.log("hash: ", hash);
    sendLogMessage(`hash: ${hash}`)
    // const MessagePrefix: string = "\x19Ethereum Signed Message:\n32";
    // const en = concat([
    //     toUtf8Bytes(MessagePrefix),
    //     hash
    //   ]);
    //   console.log("en: ", en);
    //   let hash2 = keccak256(en);
    //   console.log("hash2: ", hash2);
    //   sendLogMessage(`hash2: ${hash2}`)
    const wallet = new Wallet(`0x${attestation_private_key}`);
    sendLogMessage(`wallet: ${JSON.stringify(wallet)}`)
    console.log("wallet: ", wallet.address);
    const enclaveSign = await wallet.signMessage(hash);
    console.log("enclaveSign: ", enclaveSign);
    sendLogMessage(`enclaveSign: ${enclaveSign}`)
    const addrs = recoverAddress(hash, enclaveSign);
    console.log("addrs: ", addrs);
    sendLogMessage(`addrs: ${addrs}`)
    return enclaveSign;
}

export const generateRandomness = async (jobId: any, signer: any) => {
    // const { signer } = await getProviderDetails();
    const randomNum = Math.random() * 1E18;
    // //sendLogMessage(`randomNum: ${randomNum}`)
    console.log("randomNum: ",randomNum);
    const tmp = toBeArray(randomNum.toString());
    const hashedRandomNum = ethers.solidityPackedKeccak256(['bytes'], [tmp])
    // //sendLogMessage(`hashedRandomNum: ${hashedRandomNum}`)
    console.log("hashedRandomNum: ",hashedRandomNum);
    const hashedRandomNum1 = ethers.solidityPackedKeccak256(['bytes'], [toBeArray(hashedRandomNum)]);
    console.log("hashedRandomNum1: ",hashedRandomNum1);
    // user signs the vrf
    const userWallet = new Wallet(userKey);
    console.log("userWallet: ",userWallet);
    const signature = await userWallet.signMessage(toBeArray(hashedRandomNum1))
    console.log("signature: ",signature);
    // //sendLogMessage(`signature: ${signature}`)
    const data = abiCoder.encode(["bytes", "bytes", "address"], [hashedRandomNum, signature, signer.address]);
    // //sendLogMessage(`data: ${data}`)
    console.log("data: ",data);
    return data;
}

const executeJob = async (jobId: any, data: any, signer: ethers.ContractRunner) => {
    const attestation = await getAttestation(data, jobId);
    const jobManagerContract = new ethers.Contract(berachain.jobManagerContractAddress, abi, signer);
    const tx = await jobManagerContract.executeJob(jobId, data, rewardsAddress, attestation)
    .then(((response) => {
        sendLogMessage("Job executed successfully.");
        sendLogMessage(`response: ${response}`);
        return response;
    }))
    .catch((err)=> {
        sendLogMessage("Job execution failed.");
        sendLogMessage(err.message);
        console.log({err})
        sendLogMessage(JSON.stringify(err));
        return;
    });
    return tx;
}
