import { ethers, toBeArray } from "ethers";
import { berachain } from "./constants.json";
import { abi } from "./jobManager.json";
import { getProviderDetails } from ".";
const abiCoder = ethers.AbiCoder.defaultAbiCoder();

const getJobManagerContract = async () => {
    const { signer } = await getProviderDetails();
    const jobManagerContract = new ethers.Contract(berachain.jobManagerContractAddress, abi, signer);
    return { signer, jobManagerContract }
}
const whitelistEnclaveImage = async (image: any) => {
    const { jobManagerContract } = await getJobManagerContract();
    const tx = await jobManagerContract.whitelistEnclaveImage(image);
    console.log("tx: ", tx);
    return tx;
}

const whitelistEnclaveKey = async (enclavePubKey: string, imageId: string) => {
    const { jobManagerContract } = await getJobManagerContract();
    const tx = await jobManagerContract.whitelistEnclaveKey(enclavePubKey, imageId);
    return tx;
}

const image = {
    "PCR0": ethers.toUtf8Bytes("bfac31c5ef90640e22ea93bdb57a2dd050d690a0e0610b01bf8e75d0a9334adc2d0d2f9c20585f2f6eca7b8fc0e11101"),
    "PCR1": ethers.toUtf8Bytes("5d3938eb05288e20a981038b1861062ff4174884968a39aee5982b312894e60561883576cc7381d1a7d05b809936bd16"),
    "PCR2": ethers.toUtf8Bytes("66836f4240e79a69a4f340b855489d0c5d22e7000f8f437b76a31251c95242265ace859e9f49be368e9c462217e8d3eb")
};
console.log("image: ", image);
whitelistEnclaveImage(image);
