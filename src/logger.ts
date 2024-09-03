import AWS from 'aws-sdk';

AWS.config.update({region: 'ap-south-1'});
const cloudwatchLogs = new AWS.CloudWatchLogs({
  accessKeyId: 'AKIA356SJZIG4BWKTPY5',
  secretAccessKey: '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'
});

export  const sendLogMessage = async(message: string) => {
  try {

    const logGroupName = 'MyLogGroup';
    const logStreamName = 'MyLogStream1';
    
    // Fetch the sequence token (if needed)
    let sequenceToken;
    const streams = await cloudwatchLogs.describeLogStreams({
      logGroupName,
      logStreamNamePrefix: logStreamName
    }).promise();
    
    if (streams.logStreams!.length > 0) {
      sequenceToken = streams.logStreams![0].uploadSequenceToken;
    }

    // Send log message
    await cloudwatchLogs.putLogEvents({
      logGroupName,
      logStreamName,
      logEvents: [
        {
          message,
          timestamp: Date.now()
        }
      ],
      sequenceToken // Optional: Only needed if there’s an existing sequence token
    }).promise();
    // console.log('Log message sent.');
  } catch (error) {
    console.error('Error sending log message:', error);
  }
}