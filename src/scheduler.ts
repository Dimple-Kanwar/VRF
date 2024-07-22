import schedule from 'node-schedule';
import { generateRandomness } from '.';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync("./app/config.json", {encoding: "utf8"}));
const frequency = config.frequency;
const jobId = config.jobId;

schedule.scheduleJob(frequency, async() => {
    // run the job here
    await generateRandomness(jobId);
});

//graceful job shut down when a system interrupt occurs
process.on('SIGINT', function () { 
    schedule.gracefulShutdown()
    .then(() => process.exit(0))
});
