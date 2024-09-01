import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { generateRandomness, getAttestation } from "../src";
import { readFileSync } from 'fs';
import { AbiCoder, BytesLike, computeAddress, concat, ContractTransactionResponse, getBytes, hashMessage, hexlify, keccak256, recoverAddress, toBeArray, toUtf8Bytes, Wallet } from "ethers";
import { MockEnclave, WalletInfo } from "../src/helpers";
import { PrivateKey } from "eciesjs";
import { Token, VRF } from "../typechain-types";

describe("VRF with MockEnclave", function () {

    let owner: any, admin: any, agent: any, userAccount: any, rewardsAddress: any;
    let vrfAddress: string;
    let jobManagerAddress: string;
    let tokenAddress: string;
    let verifierAddress: string;
    let JobManagerContract: any;
    let VRF: VRF & { deploymentTransaction(): ContractTransactionResponse; };
    let tokenContract: Token & { deploymentTransaction(): ContractTransactionResponse; };
    let wallet: WalletInfo;
    let randomWords: string;
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();
    const pcrs: [BytesLike, BytesLike, BytesLike] = [
        "0x" + "00".repeat(47) + "65",
        "0x" + "00".repeat(47) + "36",
        "0x" + "00".repeat(47) + "93",
    ];

    let enclave: MockEnclave;

    this.beforeAll(async () => {
        [owner, admin, agent, userAccount, rewardsAddress] = await hre.ethers.getSigners();

        // deploy MockVerifier contract
        let verifierContractFactory = await hre.ethers.getContractFactory('MockAttestationVerifier');
        const verifierContract = await verifierContractFactory.deploy();
        verifierAddress = await verifierContract.getAddress();

        // deploy Token contract
        let tokenContractFactory = await hre.ethers.getContractFactory('Token');
        tokenContract = await tokenContractFactory.deploy();
        tokenAddress = await tokenContract.getAddress();

        // deploy JobManager contract
        const JobManagerContractFactory = await hre.ethers.getContractFactory("JobManager");
        JobManagerContract = await JobManagerContractFactory.deploy(tokenAddress, verifierAddress, admin.address, 100000);
        jobManagerAddress = await JobManagerContract.getAddress();

        // deploy VRF contract
        let VRFContractFactory = await hre.ethers.getContractFactory("VRF");
        VRF = await VRFContractFactory.deploy(jobManagerAddress);
        vrfAddress = await VRF.getAddress();

        enclave = new MockEnclave(pcrs);
        wallet = enclave.wallet;
        return { JobManagerContract, vrfAddress }
    });


    it("Whitelist an image", async function () {
        const whitelist_EnclaveImage_Transaction = await JobManagerContract.connect(admin).whitelistEnclaveImage({ PCR0: enclave.pcrs[0], PCR1: enclave.pcrs[1], PCR2: enclave.pcrs[2] });
        const receipt = await whitelist_EnclaveImage_Transaction.wait();
        console.log("Image Whitelist Tx Receipt", receipt.hash);
        const listed_enclaveImage = await JobManagerContract.getWhitelistedImage(enclave.getImageId());
        expect(listed_enclaveImage).to.eql([pcrs[0], pcrs[1], pcrs[2]]);
    });

    it("Whitelist a key", async function () {
        const enclavePubKey = wallet.uncompressedPublicKey;
        const whitelist_EnclaveKey_Transaction = await JobManagerContract.connect(admin).whitelistEnclaveKey(enclavePubKey, enclave.getImageId());
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

        const tokenApproval_Transaction = await tokenContract.approve(jobManagerAddress, 5000000);
        console.log({ tokenApproval_Transaction: tokenApproval_Transaction?.hash })
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
            { PCR0: enclave.pcrs[0], PCR1: enclave.pcrs[1], PCR2: enclave.pcrs[2] },
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
    });

    it("job created", async function () {
        const jobId = await JobManagerContract.jobCount();
        expect(jobId).to.equal(1);
    });

    it("job not fulfilled", async function () {
        const jobId = await JobManagerContract.connect(userAccount).jobCount();
        const res = await VRF.getRequestStatus(jobId);
        expect(res[0]).to.eql(false);
        expect(res[1]).to.eql('0x');
    });

    it("execute the job", async function () {
        const jobId = await JobManagerContract.connect(agent).jobCount();
        const { data, hashedRandomNum } = await generateRandomness(userAccount);
        randomWords = hashedRandomNum;
        const input = "0x1234";
        const encodedData = abiCoder.encode(["bytes", "bytes", "uint256", "address"], [
            data,
            input,
            jobId,
            rewardsAddress.address]);
        let hash = keccak256(encodedData);
        const attestation = await enclave.signMessage(getBytes(hash))
        const job_execution_transaction = await JobManagerContract.connect(agent).executeJob(jobId, data, rewardsAddress.address, attestation);
        console.log("job_execution_transaction: ", job_execution_transaction.hash);
    });

    it("verify", async function () {
        const jobId = await JobManagerContract.connect(agent).jobCount();
        const isVerified = await VRF.connect(owner).verify(jobId, randomWords, userAccount.address);
        expect(isVerified).true;
    });

    it("job fulfilled", async function () {
        const jobId = await JobManagerContract.connect(userAccount).jobCount();
        const res = await VRF.getRequestStatus(jobId);
        expect(res[0]).to.eql(true);
        expect(res[1]).to.eql(randomWords);
    });
});