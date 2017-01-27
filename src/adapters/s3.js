import AWS from 'aws-sdk'; // eslint-disable-line import/no-extraneous-dependencies

export default class Storage {
  constructor({ region, bucket }) {
    this.S3 = new AWS.S3({
      region,
      params: {
        Bucket: bucket,
      },
    });
  }

  async get(key) {
    const meta = await this.S3.getObject({
      Key: key,
    }).promise();

    return meta.Body;
  }
}
