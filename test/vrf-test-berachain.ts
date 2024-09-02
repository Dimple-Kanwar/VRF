import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { executeJob, generateRandomness } from "../src";
import { readFileSync } from 'fs';
import { BytesLike, Wallet } from "ethers";
import { rewardsAddress } from "../src/app/config.json";
import { JobManager, JobManager__factory, Token, Token__factory, VRF, VRF__factory } from "../typechain-types";
import { berachain } from "../src/constants.json";

describe("VRF Berachain", function () {

  let owner: Wallet, admin: Wallet, agent: Wallet, userAccount: Wallet;
  let vrfAddress: string;
  let jobManagerAddress: string;
  let tokenAddress: string;
  let verifierAddress: string;
  let JobManagerContract: JobManager;
  let VRF: VRF;
  let tokenContract: Token;
  let enclave: Wallet;
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();

  const pcrs: [BytesLike,BytesLike,BytesLike]= [
    "0x" + "00".repeat(47) + "65",
    "0x" + "00".repeat(47) + "36",
    "0x" + "00".repeat(47) + "93",
  ];

  const getImageId = (pcrs: [BytesLike, BytesLike, BytesLike]): BytesLike =>{
    let encoded = ethers.solidityPacked(["bytes", "bytes", "bytes"], [pcrs[0], pcrs[1], pcrs[2]]);
    let digest = ethers.keccak256(encoded);
    return digest;
  }

  this.beforeAll(async () => {
    const provider = new hre.ethers.JsonRpcProvider(berachain.rpcUrl);
    owner = new Wallet(`${process.env.DEPLOYER_KEY}`,provider);
    admin = new Wallet(`${process.env.ADMIN_KEY}`,provider);
    agent = new Wallet(`${process.env.AGENT_KEY}`,provider);
    userAccount = new Wallet(`${process.env.USER_KEY}`);

    console.log({ owner: owner.address, admin: admin.address, agent:agent.address, userAccount:userAccount.address, rewardsAddress });
   
    // deploy Token contract
    tokenContract = Token__factory.connect(berachain.tokenAddress)

    // deploy JobManager contract
    JobManagerContract = JobManager__factory.connect(berachain.jobManagerContractAddress, agent);

    vrfAddress = berachain.vrfContractAddress;
    console.log({ vrfAddress });
    VRF = VRF__factory.connect(vrfAddress, agent);
    const attestation_private_key = readFileSync("/home/boss/Work/Decimal/VRF/src/app/secp.sec").toString('hex');
    enclave = new Wallet(`0x${attestation_private_key}`);
    return { JobManagerContract, vrfAddress }
  });


  it("Whitelist an image", async function () {
    const whitelist_EnclaveImage_Transaction = await JobManagerContract.connect(admin).whitelistEnclaveImage({PCR0: pcrs[0], PCR1: pcrs[1], PCR2: pcrs[2]});
    const receipt = await whitelist_EnclaveImage_Transaction.wait();
    console.log("Image Whitelist Tx Receipt", receipt!.hash);
    const listed_enclaveImage = await JobManagerContract.getWhitelistedImage(getImageId(pcrs));
    console.log({listed_enclaveImage});
    expect(listed_enclaveImage).to.eql([pcrs[0], pcrs[1],pcrs[2]]);
  });

  it("Whitelist a key", async function () {
    const enclavePubKey = readFileSync("/home/boss/Work/Decimal/VRF/src/app/secp.pub").toString('hex');
    console.log({enclavePubKey})
    console.log("enclavePubKey.length: ",enclavePubKey.length)
    const address = enclave.address;
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
    const ethAmount = ethers.parseEther("1");
    console.log({ethAmount})
    const tokenApproval_Transaction = await tokenContract.connect(owner).approve(berachain.jobManagerContractAddress, ethAmount);
    
    console.log({tokenApproval_Transaction_hash: tokenApproval_Transaction.hash});
    // const t = keccak256(toUtf8Bytes("init(uint256,uint256,bytes)"));
    // console.log({t})
    // let initializerFunction=abiCoder.encode(["bytes4"],[t]);
    // console.log({initializerFunction})
    // let validationFunction=abiCoder.encode(["bytes4"],["setRandomWords(uint256,uint256,bytes)"]);
    // console.log({validationFunction})
    const job_create_transaction = await JobManagerContract.connect(owner).createJob(
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
    expect(jobId).to.equal(1);
  });

  it.only("job not fulfilled", async function () {
    const jobId = await JobManagerContract.jobCount();
    console.log({jobId});
    const res = await VRF.getRequestStatus(jobId);
    console.log({res});
    expect(res[0]).to.eql(false);
    expect(res[1]).to.eql('0x');
});


});