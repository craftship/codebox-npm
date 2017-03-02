class CodeboxTools {
  constructor(serverless, options) {
    this.options = options;
    this.serverless = serverless;
    this.provider = this.serverless.getProvider('aws');
    this.s3 = new this.provider.sdk.S3({
      signatureVersion: 'v4',
    });

    this.bucket = this.serverless.service.resources
      .Resources
      .PackageStorage
      .Properties
      .BucketName;

    this.commands = {
      codebox: {
        usage: 'Useful tools provided by Codebox',
        commands: {
          domain: {
            usage: 'Update packages and migrate to a new domain.',
            lifecycleEvents: [
              'migrate',
            ],
            options: {
              host: {
                usage: 'New host only e.g. example.com',
                shortcut: 'h',
                required: true,
              },
            },
          },
        },
      },
    };

    this.hooks = {
      'codebox:domain:migrate': () => this.migrate(),
    };
  }

  migrate(token) {
    return this.s3.listObjectsV2({
      Bucket: this.bucket,
      ContinuationToken: token,
    })
    .promise()
    .then((data) => {
      const objectPromises = [];

      data.Contents.forEach((item) => {
        if (item.Key.indexOf('index.json') > -1) {
          objectPromises.push(
            new Promise((resolve, reject) => {
              this.s3.getObject({
                Bucket: this.bucket,
                Key: item.Key,
              }).promise().then((obj) => {
                resolve({
                  key: item.Key,
                  json: JSON.parse(obj.Body.toString()),
                });
              }).catch(reject);
            }));
        }
      });

      if (data.IsTruncated) {
        return this.migrate(data.NextContinuationToken);
      }

      return Promise.all(objectPromises);
    }).then((items) => {
      const putPromises = [];

      items.forEach((item) => {
        const newItem = Object.assign({}, item);

        Object.keys(item.json.versions).forEach((name) => {
          const version = item.json.versions[name];

          if (version.dist && version.dist.tarball) {
            const currentHost = version.dist.tarball.split('/')[2];
            const currentProtocol = version.dist.tarball.split('/')[0];

            version.dist.tarball = version.dist.tarball
              .replace(currentHost, this.options.host)
              .replace(currentProtocol, 'https:');

            newItem.json.versions[name] = version;
          }
        });

        putPromises.push(
          this.s3.putObject({
            Bucket: this.bucket,
            Key: newItem.key,
            Body: JSON.stringify(newItem.json),
          }).promise());
      });

      return Promise.all(putPromises);
    })
    .then(() => {
      this.serverless.cli.log(`Domain updated for ${this.options.host}`);
    })
    .catch((err) => {
      this.serverless.cli.log(`Domain update failed for ${this.options.host}`);
      this.serverless.cli.log(err.message);
    });
  }
}

module.exports = CodeboxTools;
