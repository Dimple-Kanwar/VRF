const { expect } = require("chai")
const { ethers } = require("hardhat")

describe("VRF", function () {
  it("Verify", async function () {
    const accounts = await ethers.getSigners(2)

    const VRF = await ethers.getContractFactory("VRF")
    const contract = await VRF.deploy()
    await contract.deployed()

    // const PRIV_KEY = "0x..."
    // const signer = new ethers.Wallet(PRIV_KEY)
    const signer = accounts[0]
    const randomNum = 1234567890;
    const requestId = 1;

    const hash = await contract.getMessageHash(randomNum)
    const sig = await signer.signMessage(ethers.utils.arrayify(hash))

    const ethHash = await contract.getEthSignedMessageHash(hash)

    console.log("signer          ", signer.address)
    console.log("recovered signer", await contract.recoverSigner(ethHash, sig))

    // Correct signature and message returns true
    expect(
      await contract.verify(requestId, randomNum, sig, signer.address)
    ).to.equal(true)

    // Incorrect message returns false
    expect(
      await contract.verify(requestId, 345, sig, signer.address)
    ).to.equal(false)
  })
})