import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { BytesLike, ContractTransactionResponse, Typed } from "ethers";
import { VRF } from "../typechain-types";
import { generateRandomness } from "../src";

describe("VRF Contract", function () {

    let owner: any, admin: any, agent: any, userAccount: any, rewardsAddress: any;
    let vrfAddress: string;
    let VRF: VRF & { deploymentTransaction(): ContractTransactionResponse; };
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();
    const requestId = 123;
    const index = 1;
    let randomWords: BytesLike | Typed;
    this.beforeAll(async () => {
        [owner, admin, agent, userAccount, rewardsAddress] = await hre.ethers.getSigners();
        // deploy VRF contract
        let VRFContractFactory = await hre.ethers.getContractFactory("VRF");
        VRF = await VRFContractFactory.deploy(owner.address);
        vrfAddress = await VRF.getAddress();

        return { vrfAddress }
    });


    it("VRF init", async function () {
        const data = abiCoder.encode(
            ["address"],
            [userAccount.address],
        );
        
        const init_Transaction = await VRF.connect(owner).init(requestId, index, data);
        const receipt = await init_Transaction.wait();
        console.log("VRF Init Tx Receipt", receipt?.hash);
    });

    it("job not fulfilled", async function () {
        const res = await VRF.getRequestStatus(requestId);
        expect(res[0]).to.eql(false);
        expect(res[1]).to.eql('0x');
    });

    it("setRandomWords", async function () {
        const {data, hashedRandomNum} = await generateRandomness(userAccount);
        randomWords = hashedRandomNum;
        const setRandomWords_Transaction = await VRF.connect(owner).setRandomWords(requestId, index, data);
        const receipt = await setRandomWords_Transaction.wait();
        console.log("Image Key Whitelist Tx Receipt", receipt?.hash);
        
    });

    it("job fulfilled", async function () {
        const res = await VRF.getRequestStatus(requestId);
        expect(res[0]).to.eql(true);
        expect(res[1]).to.eql(randomWords);
    });

    it("verify", async function () {
        const isVerified = await VRF.connect(owner).verify(requestId, randomWords, userAccount.address);
        expect(isVerified).true;
    });
});