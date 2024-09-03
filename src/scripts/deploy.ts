import hre from "hardhat";
import { berachain } from "../constants.json";
import { gasKey } from "/app/config.json";
import { Wallet } from "ethers";

const deployContracts = async () => {
    const provider = new hre.ethers.JsonRpcProvider(berachain.rpcUrl);
    const signer = new hre.ethers.Wallet(gasKey, provider);
    const admin = new Wallet(`${process.env.ADMIN_KEY}`)

    // deploy MockVerifier contract
    let verifierContractFactory = await hre.ethers.getContractFactory('MockAttestationVerifier',signer);
    const verifierContract = await verifierContractFactory.deploy();
    const verifierAddress = await verifierContract.getAddress();
    console.log({ verifierAddress });
    // deploy Token contract
    let tokenContractFactory = await hre.ethers.getContractFactory('Token',signer);
    const tokenContract = await tokenContractFactory.deploy();
    const tokenAddress = await tokenContract.getAddress();
    console.log({ tokenAddress });
    // deploy JobManager contract
    const JobManagerContractFactory = await hre.ethers.getContractFactory("JobManager",signer);
    const JobManagerContract = await JobManagerContractFactory.deploy(tokenAddress, verifierAddress, admin.address, 100000);
    const jobManagerAddress = await JobManagerContract.getAddress();
    console.log({ jobManagerAddress });
    // deploy VRF contract
    let VRFContractFactory = await hre.ethers.getContractFactory("VRF",signer);
    const VRF = await VRFContractFactory.deploy(jobManagerAddress);
    const vrfAddress = await VRF.getAddress();
    console.log({ vrfAddress });
}

deployContracts();