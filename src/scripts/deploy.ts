const { ethers } = require("hardhat")

const deploy = async() => {
    const accounts = await ethers.getSigners(2)
    const VRF = await ethers.getContractFactory("VRF")
    const contract = await VRF.deploy();
    await contract.deployed()
}

deploy();