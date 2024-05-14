
import { setRandomnessInput, verifyRandomness } from './interfaces';
import { abi } from "./artifacts/src/contracts/VRF.sol/VRF.json";
import { getProviderDetails } from "./helpers/utils";
import { Contract } from 'ethers';

export const verify = async(args: verifyRandomness) => {
    // Get signer and provider
  const { signer, provider } = await getProviderDetails();
    const contract = new Contract(
        process.env.CONTRACT_ADDRESS,
        abi,
        provider
      );
    // Send the transaction
    const tx = await contract.verify(args);
    // Currently the transaction has been sent to the mempool,
    // but has not yet been included. So, we...

    // ...wait for the transaction to be included.
    await tx.wait();
    return tx;
}

export const setRandomness = async (args: setRandomnessInput) => {
  // Get signer and provider
  const { signer, provider } = await getProviderDetails();
  const contract = new Contract(
    process.env.CONTRACT_ADDRESS,
    abi,
    provider
  );
    const tx = await contract.setRandomWords(args);
    console.log("tx: ", tx);
    return tx;
}