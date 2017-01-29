class ContentHandling {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.provider = this.serverless.getProvider('aws');

    this.hooks = {
      'after:deploy:deploy': this.afterDeploy.bind(this),
    };
  }

  afterDeploy() {
    const apiName = this.provider.naming.getApiGatewayName();
    const funcs = this.serverless.service.functions;
    const apigateway = new this.provider.sdk.APIGateway({
      region: this.options.region,
    });
    const integrationResponse = {
      statusCode: '200',
    };

    apigateway.getRestApis().promise()
    .then((apis) => {
      integrationResponse.restApiId = apis.items.find(api => api.name === apiName).id;
    }).then(() => {
      Object.keys(funcs).forEach((fKey) => {
        funcs[fKey].events.forEach((e) => {
          if (e.http && e.http.contentHandling) {
            integrationResponse.httpMethod = e.http.method.toUpperCase();
            integrationResponse.contentHandling = e.http.contentHandling;

            apigateway.getResources({
              restApiId: integrationResponse.restApiId,
            }).promise()
            .then((resources) => {
              integrationResponse.resourceId = resources.items.find(r => r.path === `/${e.http.path}`).id;
              return apigateway.putIntegrationResponse(integrationResponse).promise();
            })
            .then((result) => {
              if (result.statusCode === '200') {
                return apigateway.createDeployment({
                  stageName: this.options.stage,
                  restApiId: integrationResponse.restApiId,
                }).promise();
              }

              throw new Error(`Could not set ${integrationResponse.contentHandling} for ${e.http.path}, method ${integrationResponse.httpMethod}`);
            })
            .then(() => {
              this.serverless.cli.log('Setup for AWS API Gateway content handling complete.');
            })
            .catch((err) => {
              this.serverless.cli.log(err.message);
            });
          }
        });
      });
    });
  }
}

module.exports = ContentHandling;
