import AWS from 'aws-sdk'; // eslint-disable-line import/no-extraneous-dependencies

export default class Storage {
  constructor({ region, bucket }) {
    this.S3 = new AWS.S3({
      signatureVersion: 'v4',
      region,
      params: {
        Bucket: bucket,
      },
    });
  }

  async put(key, data, encoding) {
    return this.S3.putObject({
      Key: key,
      Body: encoding === 'base64' ? new Buffer(data, 'base64') : data,
      ServerSideEncryption: 'AES256',
    }).promise();
  }

  async get(key) {
    const meta = await this.S3.getObject({
      Key: key,
    }).promise();

    return meta.Body;
  }
}
