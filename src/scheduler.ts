import schedule from 'node-schedule';
import { executeJob, generateRandomness, getProviderDetails } from '.';
import { readFileSync } from 'fs';
import { berachain } from "./constants.json";
import { Wallet } from 'ethers';
import path from 'path';
const config = JSON.parse(readFileSync("/app/config.json", { encoding: "utf8" }));
const frequency = config.frequency;
const jobId = config.jobId;

schedule.scheduleJob(frequency, async () => {
  // run the job here
  const { signer } = await getProviderDetails(config.gasKey);
  const userWallet = new Wallet(config.userKey);
  const { data } = await generateRandomness(userWallet);
  const execute_tx = await executeJob(jobId, data, signer, berachain.jobManagerContractAddress);
  console.log("execute_tx: ", execute_tx)
});

//graceful job shut down when a system interrupt occurs
process.on('SIGINT', function () {
  schedule.gracefulShutdown()
    .then(() => process.exit(0))
});
