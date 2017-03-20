const fetch = require('node-fetch');

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
          index: {
            usage: 'Re-indexes all packages into Codebox Insights, license required.',
            lifecycleEvents: [
              'index',
            ],
            options: {
              clientId: {
                usage: 'Client id for your account.',
                shortcut: 'c',
                required: true,
              },
              secret: {
                usage: 'Secret for your account.',
                shortcut: 's',
                required: true,
              },
            },
          },
        },
      },
    };

    this.hooks = {
      'codebox:domain:migrate': () => this.migrate(),
      'codebox:index:index': () => this.index(),
    };
  }

  _getObjects(token) {
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
        return this._getObjectPromises(data.NextContinuationToken);
      }

      return Promise.all(objectPromises);
    });
  }

  index() {
    return this._getObjects()
    .then((items) => {
      const fetchPromises = [];

      items.forEach((item) => {
        const version = item.json.versions[
          item.json['dist-tags'].latest
        ];

        const logBody = {
          name: version.name,
          description: version.description,
          version: version.version,
          keywords: version.keywords,
          license: version.license,
          contributors: version.contributors,
          dependencies: version.dependencies,
          homepage: version.homepage,
          repository: version.repository,
          'dist-tags': item.json['dist-tags'],
        };

        const reqBody = JSON.stringify({
          timestamp: new Date(),
          namespace: 'info:package:put',
          level: 'info',
          user: {
            name: "Codebox",
            avatar: "https://s3-eu-west-1.amazonaws.com/codebox-assets/logo.png",
          },
          credentials: {
            clientId: this.options.clientId,
            secret: this.options.secret,
          },
          body: logBody,
        });

        fetchPromises.push(fetch('https://log.codebox.sh/v1/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: reqBody,
        }));
      });

      return Promise.all(fetchPromises);
    })
    .then((results) => {
      const failed = results.filter(r => r.status !== 200);

      if (failed.length > 0) {
        this.serverless.cli.log(`Codebox indexing had ${failed.length} failures`);
      }
    })
    .then(() => {
      this.serverless.cli.log('Codebox Insights indexing tool completed');
    })
    .catch((err) => {
      this.serverless.cli.log(`Codebox Insights indexing of data failed for ${this.options.clientId}`);
      this.serverless.cli.log(err.message);
    });
  }

  migrate() {
    return this._getObjects()
    .then((items) => {
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
