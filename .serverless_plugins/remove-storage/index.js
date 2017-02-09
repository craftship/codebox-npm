class RemoveStorageBucket {
  constructor(serverless) {
    this.serverless = serverless;
    this.provider = this.serverless.getProvider('aws');

    this.hooks = {
      'before:remove:remove': this.beforeRemove.bind(this),
    };
  }

  beforeRemove() {
    return new Promise((resolve, reject) => {
      const s3 = new this.provider.sdk.S3({});

      const bucket = this.serverless.service.resources
      .Resources
      .PackageStorage
      .Properties
      .BucketName;

      return s3
      .deleteBucket({
        Bucket: bucket,
      }).promise()
      .then(() => {
        this.serverless.cli.log('AWS Package Storage Removed');
        resolve();
      })
      .catch((err) => {
        this.serverless.cli.log(`Could not remove AWS package storage: ${err.message}`);
        reject(err);
      });
    });
  }
}

module.exports = RemoveStorageBucket;
