class SetAPIHost {
  constructor(serverless, options) {
    this.options = options;
    this.serverless = serverless;
    this.provider = this.serverless.getProvider('aws');

    this.awsInfo = this.serverless
      .pluginManager
      .plugins
      .find(p => p.constructor.name === 'AwsInfo');

    this.registry = this.serverless
    .service
    .provider
    .environment
    .registry;

    this.hooks = {
      'after:deploy:deploy': this.afterDeploy.bind(this),
    };
  }

  afterDeploy() {
    const lambda = new this.provider.sdk.Lambda({
      signatureVersion: 'v4',
      region: this.options.region,
    });

    const publishFunction = this
    .awsInfo
    .gatheredData
    .info
    .functions
    .find(f => f.name === 'put');

    const params = {
      FunctionName: publishFunction.deployedName,
    };

    lambda
    .getFunctionConfiguration(params)
    .promise()
    .then((config) => {
      const env = config.Environment;

      if (env.Variables.apiEndpoint) {
        // Already set / not a first time deployment.
        return;
      }

      env.Variables = Object.assign({}, env.Variables, {
        apiEndpoint: `${this.awsInfo.gatheredData.info.endpoint}/registry`,
      });

      const updatedConfig = {
        FunctionName: publishFunction.deployedName,
        Environment: env,
      };

      return lambda
      .updateFunctionConfiguration(updatedConfig)
      .promise();
    })
    .catch((err) => {
      this.serverless.cli.log(err.message);
    });
  }
}

module.exports = SetAPIHost;
