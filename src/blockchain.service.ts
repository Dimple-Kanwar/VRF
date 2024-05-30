
import { setRandomnessInput, verifyRandomness } from './interfaces';
import { getJobManagerContract, getVFRContract } from "./helpers/utils";


export const verify = async(args: verifyRandomness) => {
  const vrfContract = await getVFRContract();
  // Send the transaction
  const tx = await vrfContract.verify(args);
  // Currently the transaction has been sent to the mempool,
  // but has not yet been included. So, we...

  // ...wait for the transaction to be included.
  await tx.wait();
  return tx;
}

export const executeJob = async (jobId: any, data: setRandomnessInput, attestation: any) => {
  const jobManagerContract = await getJobManagerContract();
  console.log("jobManagerContract: ", jobManagerContract)
  const tx = await jobManagerContract.executeJob(jobId, data, attestation);
  console.log("tx: ", tx);
  return tx;
}