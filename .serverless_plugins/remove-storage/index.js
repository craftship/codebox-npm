class RemoveStorageBucket {
  constructor(serverless) {
    this.serverless = serverless;
    this.provider = this.serverless.getProvider('aws');

    const profile = this.serverless
    .config
    .serverless
    .service
    .provider
    .profile;

    if (profile) {
      const credentials = new this.provider.sdk.SharedIniFileCredentials({
        profile,
      });

      this.provider.sdk.config.credentials = credentials;
    }

    this.s3 = new this.provider.sdk.S3({
      signatureVersion: 'v4',
    });

    this.bucket = this.serverless.service.resources
      .Resources
      .PackageStorage
      .Properties
      .BucketName;

    this.bucketCache = this.serverless.service.resources
      .Resources
      .PackageCacheStorage
      .Properties
      .BucketName;

    this.hooks = {
      'before:remove:remove': this.beforeRemove.bind(this),
    };
  }

  listAllKeys(bucket, token) {
    const allKeys = [];
    return this.s3.listObjectsV2({
      Bucket: bucket,
      ContinuationToken: token,
    })
    .promise()
    .then((data) => {
      allKeys.push(data.Contents);

      if (data.IsTruncated) {
        return this.listAllKeys(bucket, data.NextContinuationToken);
      }

      return [].concat(...allKeys).map(({ Key }) => ({ Key }));
    });
  }

  beforeRemove() {
    return new Promise((resolve, reject) => {
      this.listAllKeys(this.bucketCache)
      .then((keys) => {
        if (keys.length > 0) {
          return this.s3
          .deleteObjects({
            Bucket: this.bucketCache,
            Delete: {
              Objects: keys,
            },
          }).promise();
        }
      })
      .then(() => {
        return this.s3
          .deleteBucket({
            Bucket: this.bucketCache,
          }).promise()
          .then(() => {
            this.serverless.cli.log('AWS Package Storage Cache Removed');
          });
      })
      .then(() => {
        return this.listAllKeys(this.bucket)
        .then((keys) => {
          if (keys.length > 0) {
            return this.s3
            .deleteObjects({
              Bucket: this.bucket,
              Delete: {
                Objects: keys,
              },
            }).promise();
          }
        })
      })
      .then(() => {
        return this.s3
        .deleteBucket({
          Bucket: this.bucket,
        }).promise()
        .then(() => {
          this.serverless.cli.log('AWS Package Storage Removed');
          resolve();
        });
      })
      .catch((err) => {
        this.serverless.cli.log(`Could not remove AWS package storage: ${err.message}`);
        reject(err);
      });
    });
  }
}

module.exports = RemoveStorageBucket;
