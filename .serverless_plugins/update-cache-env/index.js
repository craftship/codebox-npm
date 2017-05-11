const util = require('util');

class UpdateCacheEnv {
  constructor(serverless, options) {
    this.options = options;
    this.serverless = serverless;
    this.provider = this.serverless.getProvider('aws');

    this.awsInfo = this.serverless
      .pluginManager
      .plugins
      .find(p => p.constructor.name === 'AwsInfo');

    this.bucketCache = this.serverless
    .service
    .provider
    .environment
    .bucketCache;

    this.registry = this.serverless
    .service
    .provider
    .environment
    .registry;

    this.cacheEnabled = this.serverless
    .service
    .provider
    .environment
    .cacheEnabled;

    this.hooks = {
      'after:deploy:deploy': this.afterDeploy.bind(this),
    };
  }

  afterDeploy() {
    const lambda = new this.provider.sdk.Lambda({
      signatureVersion: 'v4',
      region: this.options.region,
    });

    const cacheFunction = this
    .awsInfo
    .gatheredData
    .info
    .functions
    .find(f => f.name === 'cache');

    if (!cacheFunction) {
      throw new Error('Cache function has not been deployed correctly to AWS.');
    }

    const params = {
      FunctionName: cacheFunction.deployedName,
      Environment: {
        Variables: {
          apiEndpoint: `${this.awsInfo.gatheredData.info.endpoint}/registry`,
          region: this.options.region,
          bucketCache: this.bucketCache,
          registry: this.registry,
          cacheEnabled: this.cacheEnabled,
        }
      },
    };

    lambda
    .updateFunctionConfiguration(params)
    .promise()
    .then(() => {
      this.serverless.cli.log('AWS Cache Environment Ready.');
    }).catch(err => {
      this.serverless.cli.log(err.message);
    });
  }
}

module.exports = UpdateCacheEnv;
