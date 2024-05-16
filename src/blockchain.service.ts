
import { setRandomnessInput, verifyRandomness } from './interfaces';
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

import { readFile } from 'fs/promises';
const abi_path = "./artifacts/src/contracts/VRF.sol/VRF.json";
import { getProviderDetails } from "./helpers/utils";
import { Contract } from 'ethers';


export const verify = async(args: verifyRandomness) => {
  const contract = await _getContract();
  // Send the transaction
  const tx = await contract.verify(args);
  // Currently the transaction has been sent to the mempool,
  // but has not yet been included. So, we...

  // ...wait for the transaction to be included.
  await tx.wait();
  return tx;
}

export const setRandomness = async (args: setRandomnessInput) => {
  const contract = await _getContract();
    const tx = await contract.setRandomWords(args);
    console.log("tx: ", tx);
    return tx;
}

const _getContract = async() => {
  // Get signer and provider
  const { signer, provider } = await getProviderDetails();
  const abi =  await readFile(abi_path, {encoding: "ascii"});
  const contract = new Contract(
    process.env.CONTRACT_ADDRESS,
    abi,
    provider
  );
  return contract;
}