class EnvironmentVariablesCheck {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.requiredVars = [
      {
        name: 'CODEBOX_REGION',
        helpText: 'the AWS region you wish to deploy to.',
      },
      {
        name: 'CODEBOX_ADMINS',
        helpText: 'a comma seperated list of GitHub usernames.',
      },
      {
        name: 'CODEBOX_REGISTRY',
        helpText: 'the npm registry to proxy through to e.g. https://registry.npmjs.org/.',
      },
      {
        name: 'CODEBOX_BUCKET',
        helpText: 'the S3 bucket use for storage of your private packages.',
      },
      {
        name: 'CODEBOX_GITHUB_URL',
        helpText: 'the GitHub / GitHub Enterprise API url, ensure this the root API url and not the website.',
      },
      {
        name: 'CODEBOX_GITHUB_CLIENT_ID',
        helpText: 'the client id for your GitHub / GitHub Enterprise OAuth application.',
      },
      {
        name: 'CODEBOX_GITHUB_SECRET',
        helpText: 'the secret for your GitHub / GitHub Enterprise OAuth application.',
      },
    ];

    this.hooks = {
      'before:deploy:initialize': this.beforeDeploy.bind(this),
    };
  }

  beforeDeploy() {
    let hasErrors = false;

    this.requiredVars.forEach((v) => {
      if (!process.env[v.name]) {
        hasErrors = true;
        this.serverless.cli.log(`Missing ${v.name} ${v.helpText}`);
      }
    });

    if (hasErrors) {
      throw new Error('Required environment variables missing, please see details above.');
    }
  }
}

module.exports = EnvironmentVariablesCheck;
