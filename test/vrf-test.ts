import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { generateRandomness, getAttestation } from "../src";
import { readFileSync } from 'fs';

describe("VRF", function () {

  let owner: { address: any; }, admin: { address: any; }, agent: { address: any; }, userAccount: { address: any; },  rewardsAddress: { address: any; };
  let vrfAddress: string;
  let jobManagerAddress: string;
  let tokenAddress: string;
  let verifierAddress: string;
  let JobManagerContract: any;
  let VRF:any;
  let tokenContract:any;
  const enclaveImage = {
    PCR0: '0x9f26130732b85af2d7238f745ccccfa8a3a7c89d25152c1810b233e29e2b493313736ff40dd611f6ee83047a8dfa4c3a',
    PCR1: '0xbcdf05fefccaa8e55bf2c8d6dee9e79bbff31e34bf28a99aa19e6b29c37ee80b214a414b7607236edf26fcb78654e63f',
    PCR2: '0xf78f844bb47a9cb98dd351909f03722d1a21994d095125d34b4ba41929a2c43d2b88f7f68a6f6ce8fbb638b5cb682c3b'
  }
  const enclaveImageId = "0x4b2c229e829abeb6d950c0839add9ff6aaaa48e440443526f797a92542dd1dfa";
  
  this.beforeAll(async () => {
    [owner, admin, agent, userAccount, rewardsAddress] = await hre.ethers.getSigners();
    console.log({ owner, admin, agent, userAccount, rewardsAddress });


    // deploy MockVerifier contract
    let verifierContractFactory = await hre.ethers.getContractFactory('MockAttestationVerifier');
    const verifierContract = await verifierContractFactory.deploy();
    verifierAddress = await verifierContract.getAddress();
    console.log({ verifierAddress });

    // deploy Token contract
    let tokenContractFactory = await hre.ethers.getContractFactory('Token');
    tokenContract = await tokenContractFactory.deploy();
    tokenAddress = await tokenContract.getAddress();
    console.log({ tokenAddress });

    // deploy JobManager contract
    const JobManagerContractFactory = await hre.ethers.getContractFactory("JobManager");
    JobManagerContract = await JobManagerContractFactory.deploy(tokenAddress, verifierAddress, admin.address, 100000);
    // console.log({ JobManagerContract });
    jobManagerAddress = await JobManagerContract.getAddress();
    console.log({ jobManagerAddress });

    // deploy VRF contract
    let VRFContractFactory = await hre.ethers.getContractFactory("VRF");
    VRF = await VRFContractFactory.deploy(jobManagerAddress);
    // console.log({ VRF });
    vrfAddress = await VRF.getAddress();
    console.log({ vrfAddress });
    
    return { JobManagerContract, vrfAddress }
  });


  it("Whitelist an image", async function () {
    const whitelist_EnclaveImage_Transaction = await JobManagerContract.connect(admin).whitelistEnclaveImage(enclaveImage);
    const receipt = await whitelist_EnclaveImage_Transaction.wait();
    console.log("Image Whitelist Tx Receipt", receipt.hash);
    const listed_enclaveImage = await JobManagerContract.getWhitelistedImage(enclaveImageId);
    console.log({listed_enclaveImage});
    expect(listed_enclaveImage).to.eql([enclaveImage.PCR0, enclaveImage.PCR1,enclaveImage.PCR2]);
  });

  it("Whitelist a key", async function () {
    const enclavePubKey = readFileSync("/home/boss/Work/Decimal/VRF/src/app/secp.pub").toString('hex');
    // const enclavePubKey = "0x3d98e322f6bf15fa4ec2d92f19879cda1ce67e050e93a1761702783c1c8242d29c048fe1ddf002ba9275bd7beaa102ed03e392912a5d2a4c0db9805131fbee03";
    const whitelist_EnclaveKey_Transaction = await JobManagerContract.connect(admin).whitelistEnclaveKey(`0x${enclavePubKey}`, enclaveImageId);
    const receipt = await whitelist_EnclaveKey_Transaction.wait();
    console.log("Image Key Whitelist Tx Receipt", receipt?.hash);
  });


  it("create a job", async function () {
    const abiCoder = new ethers.AbiCoder();
    const input_bytes = "0x1234";
    const paymentPerSecond = "1000";
    const maxBaseFee = "2000";
    const maxPriorityFee = "3000";
    const gasRefundAmount = "400000";
    const amount = "5000";

    const tokenApproval_Transaction = await tokenContract.approve(jobManagerAddress,5000000);
    console.log({tokenApproval_Transaction})
    const job_create_transaction = await JobManagerContract.createJob(
      [
        {
          validationAddress: vrfAddress,
          validationFunction: "0x16c0edd3",
          initializerFunction: "0x1d31888f",
          initializerData: abiCoder.encode(
            ["address"],
            [userAccount.address],
          ),
        },
      ],
      "optional ig",
      enclaveImage,
      input_bytes,
      paymentPerSecond,
      maxBaseFee,
      maxPriorityFee,
      gasRefundAmount,
      amount,
      { value: gasRefundAmount },
    );
    console.log({job_create_transaction})
    const receipt = await job_create_transaction.wait();
    console.log("Job Creation Tx Receipt", receipt?.hash);
    const jobId = await JobManagerContract.jobCount();
    console.log({jobId});
    expect(jobId).to.equal(1);
  });

  it("execute the job", async function () {
    const jobId = await JobManagerContract.connect(agent).jobCount();
    const data = await generateRandomness(jobId, agent);
    console.log("data: ", data);
    const attestation = await getAttestation(data, jobId);
    console.log("attestation: ", attestation);
    const job_execution_transaction = await JobManagerContract.connect(agent).executeJob(jobId, data, rewardsAddress.address, attestation);
    console.log("job_execution_transaction: ", job_execution_transaction);
    // await expect(
    //   await nftMarketplace.connect(acc2).resellItem(1, nftAddress, agent, { value: hre.ethers.parseEther("0.02") })
    // ).to.be.revertedWith(
    //   "Value sent should be more than NFT price to accomodate the resell fee."
    // );
  });
});