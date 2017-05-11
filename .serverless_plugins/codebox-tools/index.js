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
          encrypt: {
            usage: 'Re-encrypts all files within package storage.',
            lifecycleEvents: [
              'encrypt',
            ],
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
      'codebox:encrypt:encrypt': () => this.encrypt(),
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
        objectPromises.push(
          new Promise((resolve, reject) => {
            this.s3.getObject({
              Bucket: this.bucket,
              Key: item.Key,
            }).promise().then((obj) => {
              resolve({
                key: item.Key,
                data: obj.Body,
              });
            }).catch(reject);
          }));
      });

      if (data.IsTruncated) {
        return this._getObjectPromises(data.NextContinuationToken);
      }

      return Promise.all(objectPromises);
    });
  }

  encrypt() {
    const putPromises = [];

    this._getObjects()
    .then((items) => {
      items.forEach((item) => {
        putPromises.push(
          this.s3.putObject({
            Bucket: this.bucket,
            Key: item.key,
            Body: item.data,
            ServerSideEncryption: 'AES256',
          }).promise());
      });
    }).then(() => {
      return Promise.all(putPromises)
      .then(() => this.serverless.cli.log('Encrypted all current files for registry'))
      .catch(err => this.serverless.cli.log(`Failed file encryption migration ${err.message}`));
    });
  }

  index() {
    return this._getObjects()
    .then((items) => {
      const fetchPromises = [];

      items.forEach((item) => {
        if (item.Key.indexOf('index.json') === -1) {
          return;
        }

        const json = JSON.parse(item.data.toString());

        const version = json.versions[
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
          'dist-tags': json['dist-tags'],
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
      const lambda = new this.provider.sdk.Lambda({
        signatureVersion: 'v4',
        region: process.env.CODEBOX_REGION,
      });

      const serviceName = this.serverless.config.serverless.service.service;
      const stage = this.options.stage;

      const deployedName = `${serviceName}-${stage}-put`;

      const params = {
        FunctionName: deployedName,
      };

      return lambda
      .getFunctionConfiguration(params)
      .promise()
      .then((config) => {
        const env = config.Environment;
        const currentEndpoint = env.Variables.apiEndpoint;

        if (!currentEndpoint) {
          throw new Error('Please ensure you are on Codebox npm 0.20.0 or higher.');
        }

        let endpoint = currentEndpoint.replace(currentEndpoint.split('/')[2], this.options.host);
        if (this.options.path) {
          endpoint = `${endpoint}${this.options.path}`
        }

        env.Variables = Object.assign({}, env.Variables, {
          apiEndpoint: endpoint,
        });

        const updatedConfig = {
          FunctionName: deployedName,
          Environment: env,
        };

        return lambda
        .updateFunctionConfiguration(updatedConfig)
        .promise();
      });
    })
    .then(() => {
      this.serverless.cli.log(`Domain updated for ${this.options.host}`);
    })
    .catch((err) => {
      console.log(err);
      this.serverless.cli.log(`Domain update failed for ${this.options.host}`);
      this.serverless.cli.log(err.message);
    });
  }
}

module.exports = CodeboxTools;
