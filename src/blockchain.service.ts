
import { setRandomnessInput, verifyRandomness } from './interfaces';
import { abi } from "./artifacts/src/contracts/VRF.sol/VRF.json";
// console.log("abi: ",abi);
import { getProviderDetails } from "./helpers/utils";
import { Contract, ContractFactory, ethers } from 'ethers';


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

export const setRandomness = async (randomNum: number,requestId: string,signature:string,signer:string) => {
  const contract = await _getContract();
  console.log("contract: ", contract)
    const tx = await contract.setRandomWords(randomNum,requestId,signature,signer);
    console.log("tx: ", tx);
    return tx;
}

const _getContract = async() => {
  // Get signer and provider
  const { signer, provider } = await getProviderDetails();

  const contract = new Contract(
    process.env.CONTRACT_ADDRESS,
    abi,
    signer
  );
  contract.connect(signer);
  return contract;
}