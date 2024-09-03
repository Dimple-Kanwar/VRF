import AWS from 'aws-sdk';
AWS.config.update({region: 'ap-south-1'});
const cloudwatchLogs = new AWS.CloudWatchLogs({
    accessKeyId: 'AKIA356SJZIG4BWKTPY5',
    secretAccessKey: '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'});

async function createLogGroupAndStream(logGroupName: string, logStreamName: string) {
  try {
    // Create Log Group
    await cloudwatchLogs.createLogGroup({ logGroupName }).promise();
    console.log(`Log group ${logGroupName} created.`);

    // Create Log Stream
    await cloudwatchLogs.createLogStream({ logGroupName, logStreamName }).promise();
    console.log(`Log stream ${logStreamName} created.`);
  } catch (error) {
    console.error('Error creating log group or stream:', error);
  }
}

const logGroupName = 'MyLogGroup';
const logStreamName = 'MyLogStream1';

createLogGroupAndStream(logGroupName, logStreamName);
