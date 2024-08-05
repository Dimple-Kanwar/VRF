
import { ethers, keccak256, recoverAddress, toBeArray, Wallet } from 'ethers';
import { readFileSync } from 'fs';
import { abi } from "./jobManager.json";
import "dotenv/config";
// import {sendLogMessage} from "./logger"
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
    const attestation_private_key1 = readFileSync("/home/boss/Work/Decimal/VRF/src/app/secp.sec", {encoding: 'hex'});
    console.log("attestation_private_key: ", attestation_private_key);
    console.log("attestation_private_key1: ", attestation_private_key1);
    //sendLogMessage(`attestation_private_key: ${attestation_private_key.toString('hex')}`)
    //sendLogMessage(`attestation_private_key1: ${attestation_private_key1}`)
    // const attestation_private_key = "fe06d9507142d660d2a5b0ad6bc7be8560ddbf869ea7ddf779a8cba21dca5ed0";
    const input = "0x1234";
    // encode data, input and jobId to get it signed with the attestation private key
    const encodedData = abiCoder.encode(["bytes", "bytes", "uint256", "address"], [
        data,
        input,
        jobId,
        rewardsAddress]);
        console.log("encodedData: ", encodedData);
    //sendLogMessage(`encodedData: ${encodedData}`)
    const wallet = new Wallet(`0x${attestation_private_key}`);
    //sendLogMessage(`wallet: ${JSON.stringify(wallet)}`)

    let hash = keccak256(encodedData);
    //sendLogMessage(`hash: ${hash}`)
    console.log("hash: ", hash);
    // const bytes = Buffer.from("\x19Ethereum Signed Message:\n32", 'utf-8');
    // console.log("bytesToHex: ", bytes.toString('hex'));
    //sendLogMessage(`bytesToHex: ${bytes.toString('hex')}`)
    // sign the encodedData with attestation private key
    // hash = ethers.solidityPackedKeccak256(['bytes', "bytes"], [bytes, hash])
    // console.log("hash2: ", hash);
    //sendLogMessage(`hash2: ${hash}`)

    const key = EC.keyFromPrivate(`0x${attestation_private_key}`);
    const signature = key.sign(hash,{canonical: true});
    const signatureHex = signature.toDER('hex');
    const attestation = `0x${signatureHex}`;
    // const attestation1 = await wallet.signMessage(hash);
    const isVerified = key.verify(hash, signatureHex)
    console.log("isVerified: ",isVerified)
    const recoveredAddress = EC.recoverPubKey(hash,signature, signature.recoveryParam!, "hex");
    console.log("wallet address: ",wallet.address)
    console.log("recoveredAddress: ",recoveredAddress.__proto__)
    console.log("recoveredAddress: ",recoveredAddress.toJSON())
    // console.log("attestation: ",attestation)
    // console.log("attestation1: ",attestation1)
    // sendLogMessage(`attestation: ${attestation}`)
    return attestation;
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
    // execute set randomNum in blockchain via job manager
    // const tx = await executeJob(jobId, data, signer);
    // //sendLogMessage(`tx: ${tx}`)
    // return tx;
    return data;
}

const executeJob = async (jobId: any, data: any, signer: ethers.ContractRunner) => {
    const attestation = await getAttestation(data, jobId);
    const jobManagerContract = new ethers.Contract(berachain.jobManagerContractAddress, abi, signer);
    const tx = await jobManagerContract.executeJob(jobId, data, rewardsAddress, attestation)
    .then(((response) => {
        // //sendLogMessage("Job executed successfully.");
        // //sendLogMessage(`response: ${response}`);
        return response;
    }))
    .catch((err)=> {
        // //sendLogMessage("Job execution failed.");
        // //sendLogMessage(err.message);
        console.log({err})
        // //sendLogMessage(JSON.stringify(err));
        return;
    });
    return tx;
}
