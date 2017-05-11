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
    }).promise();
  }

  async get(key) {
    const meta = await this.S3.getObject({
      Key: key,
    }).promise();

    return meta.Body;
  }

  async listAllKeys(token = null, keys = []) {
    const data = await this.S3.listObjectsV2({
      ContinuationToken: token,
    })
    .promise();

    keys.push(data.Contents);

    if (data.IsTruncated) {
      return this.listAllKeys(data.NextContinuationToken, keys);
    }

    return [].concat(...keys).map(({ Key }) => Key);
  }
}

