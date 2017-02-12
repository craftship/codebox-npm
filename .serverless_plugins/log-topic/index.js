class LogTopic {
  constructor(serverless) {
    this.serverless = serverless;

    this.topicName = `${this.serverless.service.service}-${this.serverless.processedInput.options.stage}-log`;
    this.provider = this.serverless.getProvider('aws');
    this.sns = new this.provider.sdk.SNS({
      signatureVersion: 'v4',
      region: process.env.YITH_REGION,
    });

    this.hooks = {
      'before:deploy:compileFunctions': this.beforeDeploy.bind(this),
    };
  }

  beforeDeploy() {
    return new Promise((resolve, reject) => {
      return this.sns
      .createTopic({
        Name: this.topicName,
      }).promise()
      .then((result) => {
        this.serverless.service.provider.environment.logTopic = result.TopicArn;
        this.serverless.cli.log(`AWS Logging SNS Topic Created ${result.TopicArn}`);
        resolve();
      })
      .catch((err) => {
        this.serverless.cli.log(`Could not create AWS Logging SNS Topic: ${err.message}`);
        reject(err);
      });
    });
  }
}

module.exports = LogTopic;
