class RemoveStorageBucket {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.provider = this.serverless.getProvider('aws');

    this.hooks = {
      'before:remove:remove': this.beforeRemove.bind(this),
    };
  }

  beforeRemove() {
    const s3 = new this.provider.sdk.S3({});

    const bucket = this.serverless.service.resources
    .Resources
    .PackageStorage
    .Properties
    .BucketName;

    s3
    .deleteBucket({
      Bucket: bucket,
    }).promise()
    .then(() => {
      this.serverless.cli.log('AWS Package Storage Removed');
    })
    .catch(err => this.serverless.cli.log(`Could not remove AWS package storage: ${err.message}`));
  }
}

module.exports = RemoveStorageBucket;
