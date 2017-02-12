import AWS from 'aws-sdk'; // eslint-disable-line import/no-extraneous-dependencies

export default class Logger {
  constructor(namespace, { region, topic }) {
    this.namespace = namespace;
    this.topic = topic;

    this.SNS = new AWS.SNS({
      signatureVersion: 'v4',
      region,
    });
  }

  async publish(json) {
    return this.SNS.publish({
      Message: JSON.stringify(json),
      TopicArn: this.topic,
    }).promise();
  }

  async error({ stack, message }) {
    const json = {
      timestamp: new Date(),
      level: 'error',
      namespace: `error:${this.namespace}`,
      body: {
        message,
        stack,
      },
    };

    return this.publish(json);
  }

  async info(message) {
    const json = {
      timestamp: new Date(),
      level: 'info',
      namespace: `info:${this.namespace}`,
      body: message,
    };

    return this.publish(json);
  }
}
