import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { executeJob, generateRandomness } from "../src";
import { readFileSync } from 'fs';
import { BytesLike, Wallet } from "ethers";

describe("VRF local", function () {

  let owner: any, admin: any, agent: any, userAccount: any,  rewardsAddress: any;
  let vrfAddress: string;
  let jobManagerAddress: string;
  let tokenAddress: string;
  let verifierAddress: string;
  let JobManagerContract: any;
  let VRF:any;
  let tokenContract:any;
  let wallet: Wallet;

  // const pcrs: [BytesLike,BytesLike,BytesLike]= [
  //   "0x" + "00".repeat(47) + "65",
  //   "0x" + "00".repeat(47) + "36",
  //   "0x" + "00".repeat(47) + "93",
  // ];

  const pcrs: [BytesLike,BytesLike,BytesLike]= [
    "0x9fc33e37a9d5e927b08a30c05490bb2ed4f8553181a01a3727032b850f9eb67fb74bb1360d4e903c03a7ddb66a4760e0",
    "0xbcdf05fefccaa8e55bf2c8d6dee9e79bbff31e34bf28a99aa19e6b29c37ee80b214a414b7607236edf26fcb78654e63f",
    "0xf808a498fa88fc7d211356f81f8ffb380f336e94225a2d04e6bb9216dc09ed822bee3f66834dd45b9c3c721504dd9b5f",
  ];

  const getImageId = (pcrs: [BytesLike, BytesLike, BytesLike]): BytesLike =>{
    let encoded = ethers.solidityPacked(["bytes", "bytes", "bytes"], [pcrs[0], pcrs[1], pcrs[2]]);
    let digest = ethers.keccak256(encoded);
    return digest;
  }

  this.beforeAll(async () => {
    [owner, admin, agent, userAccount, rewardsAddress] = await hre.ethers.getSigners();
    console.log({ owner: owner.address, admin: admin.address, agent:agent.address, userAccount:userAccount.address, rewardsAddress:rewardsAddress.address });
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
    const attestation_private_key = readFileSync("/home/boss/Work/Decimal/VRF/src/app/secp.sec").toString('utf8');
    wallet = new Wallet(`0x${attestation_private_key}`);
    return { JobManagerContract, vrfAddress }
  });


  it("Whitelist an image", async function () {
    const whitelist_EnclaveImage_Transaction = await JobManagerContract.connect(admin).whitelistEnclaveImage({PCR0: pcrs[0], PCR1: pcrs[1], PCR2: pcrs[2]});
    const receipt = await whitelist_EnclaveImage_Transaction.wait();
    console.log("Image Whitelist Tx Receipt", receipt.hash);
    const listed_enclaveImage = await JobManagerContract.getWhitelistedImage(getImageId(pcrs));
    console.log({listed_enclaveImage});
    expect(listed_enclaveImage).to.eql([pcrs[0], pcrs[1],pcrs[2]]);
  });

  it("Whitelist a key", async function () {
    const enclavePubKey = readFileSync("/home/boss/Work/Decimal/VRF/src/app/secp.pub").toString('utf8');
    console.log({enclavePubKey})
    console.log("enclavePubKey.length: ",enclavePubKey.length)
    const address = wallet.address;
    console.log({address})
    const whitelist_EnclaveKey_Transaction = await JobManagerContract.connect(admin).whitelistEnclaveKey(`0x${enclavePubKey}`, getImageId(pcrs));
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
    console.log({tokenApproval_Transaction_hash: tokenApproval_Transaction.hash});
    // const t = keccak256(toUtf8Bytes("init(uint256,uint256,bytes)"));
    // console.log({t})
    // let initializerFunction=abiCoder.encode(["bytes4"],[t]);
    // console.log({initializerFunction})
    // let validationFunction=abiCoder.encode(["bytes4"],["setRandomWords(uint256,uint256,bytes)"]);
    // console.log({validationFunction})
    for (let index = 1; index < 3; index++) {
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
        {PCR0: pcrs[0], PCR1: pcrs[1], PCR2: pcrs[2]},
        input_bytes,
        paymentPerSecond,
        maxBaseFee,
        maxPriorityFee,
        gasRefundAmount,
        amount,
        { value: gasRefundAmount },
      );
      const receipt = await job_create_transaction.wait();
      console.log("Job Creation Tx Receipt", receipt?.hash);
      const jobId = await JobManagerContract.jobCount();
      console.log({jobId});
      expect(jobId).to.equal(index);
    }
  });

  it("run scheduler", async function () {
    const jobId = await JobManagerContract.connect(agent).jobCount();
    console.log("jobId: ",jobId)
    console.log("rewardsAddress.address: ",rewardsAddress.address)
    for (let index = 1; index < 3; index++) {
      const {data, hashedRandomNum} = await generateRandomness(userAccount);
      jobManagerAddress = await JobManagerContract.getAddress();
      const tx = await executeJob(index, data, agent, jobManagerAddress);
      console.log("Job Execution Tx hash", tx);
      // const isVerified = await VRF.connect(owner).verify(index, hashedRandomNum, userAccount.address);
      // console.log({isVerified});
      // expect(isVerified).true;
    }
  });

  it("job fulfilled", async function () {
    for (let index = 1; index < 3; index++) {
      const res = await VRF.getRequestStatus(index);
      expect(res[0]).to.eql(true);
    }
  });

  it("Get All request details", async function () {
    for (let index = 1; index < 3; index++) {
      const reqDetails = await VRF.getRequestDetails(index);
      console.log({reqDetails: reqDetails});
    }
  });

});