[![Serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)
[![CircleCI Status](https://circleci.com/gh/craftship/yith.svg?style=shield)](https://circleci.com/gh/craftship/yith)
[![Coverage Status](https://coveralls.io/repos/github/craftship/yith/badge.svg?branch=master&cb=1)](https://coveralls.io/github/craftship/yith?branch=master)

<img src="https://s3-eu-west-1.amazonaws.com/learn.craftship.io/yith_logo.png" height="150"/>

## Overview
Yith is a serverless npm registry to allow companies that wish to keep their intellectual property. It allows sharing of npm modules within a company but additionally allows access to all of the modules on public npm. One other major difference is that it replaces `npm login` authentication to be via github / github enterprise.  Users are always required to be authenticated when using yith as their npm registry.

It is currently compatible with the latest version of the npm cli.

## Local Deployment

The quickest way to deploy your own npm registry from you local machine is to follow the following guide.

### Prerequisites
* A GitHub / GitHub Enterprise application is registered (e.g. [for GitHub](https://github.com/settings/developers)), you will need the `Client ID` and `Secret`.
* You have `AWS` environment credentials setup with enough access to deploy Serverless resources on your local machine, you can follow the standard guide from Amazon [here](http://docs.aws.amazon.com/sdk-for-java/v1/developer-guide/setup-credentials.html).
* Latest version of Serverless installed globally (`npm install serverless -g` or `yarn global add serverless`).

#### Steps
* `serverless install --url https://github.com/craftship/yith/tree/0.8.4 --name my-npm-registry` - pick whichever name you prefer for your registry
* `cd my-npm-registry`
* `npm install`
* Setup your environment variables:
```
export YITH_REGION="eu-west-1" # Set the AWS region you wish your registry to be deployed to
export YITH_ADMINS="" # Comma seperated list of github usernames (e.g. "jon,kadi"), these users will be the only ones able to publish
export YITH_REGISTRY="https://registry.npmjs.org/" # The NPM mirror you wish to proxy through to
export YITH_BUCKET="my-npm-registry-storage" # The name of the bucket in which you wish to store your packages
export YITH_GITHUB_URL="https://api.github.com/" # The GitHub / GitHub Enterprise **api** url
export YITH_GITHUB_CLIENT_ID="client_id" # The client id for your GitHub application
export YITH_GITHUB_SECRET="secret" # The secret for your GitHub application
```
* `serverless deploy --stage prod` (pick which ever stage you wish)
* `npm set registry <url>` - `<url>` being the base url shown in the terminal after deployment completes, such as:
`https://abcd12345.execute-api.eu-west-1.amazonaws.com/dev/registry/`

## Using it in your Repositories
The easiest way to ensure developers are using the correct private registry url is to setup a `.npmrc` file.  This contains default settings that npm will pick up on and will ensure the registry is set per repository.

This is especially great for repositories you wish developers to allow publishing and keep private.  Here is an example `.npmrc` file:


```
registry=https://ab1cd3ef4.execute-api.eu-west-1.amazonaws.com/prod/registry
```

If a user is doing any `npm` operation for the first time in the repository then they will need to `npm login`.

## `npm login` Usage
Once you are using the private registry you are required to always be authenticated with npm. This ensures not just anyone can request private packages that are not to be shared with the outside world.

To login you can use the `npm login` cli command, if you have 2FA enabled you will need to (when prompted) enter the username in the format of your GitHub username.otp e.g. `jonsharratt.123456`. Once logged in it will store a long life token that will be used going forward.

You are now able to use npm commands as normal.

## Admins / Publishing Packages
`npm publish` works as it normally does via the npm CLI.  By default all users that authenticate have read only access.  If you wish to allow publish rights then you need to set the `YITH_ADMINS` environment variable to a comma separated list of GitHub usernames such as `jonsharratt,kadikraman` and re-deploy.

## Setup with your CI
We recommend creating a GitHub user that can represent your team as a service account.  Once created you can then use that account to `npm login` to the private registry.

You then need to get the generated token and login url (note the login url is not the same as the registry url).  Do this by running `cat ~/.npmrc`.  As an example you should see an entry that looks like the following:

```
//ab12cd34ef5.execute-api.eu-west-1.amazonaws.com/prod/:_authToken=dsfdsf678sdf78678768dsfsduihsd8798897989
```

In your CI tool you can then set the following environment variables (e.g. using the example above):
```
NPM_REGISTRY_LOGIN_URL=//ab12cd34ef5.execute-api.eu-west-1.amazonaws.com/prod/
NPM_AUTH_TOKEN=dsfdsf678sdf78678768dsfsduihsd8798897989
```

To allow your CI to access to the npm registry you should have a `.npmrc` file in the root of your repository, if not, as mentioned above we recommend doing this.

Then as a pre build step before any `npm install` / package installs run the following to inject the authentication url into your `.npmrc` file.

```
echo "$NPM_REGISTRY_LOGIN_URL:_authToken=$NPM_AUTH_TOKEN" >> .npmrc
```

**Note:**
You can then reuse this build step for all of your repositories using your private npm registry.

## Logging
Upon deploying yith will create a new SNS Topic specifically for logging.  The console will log the SNS topic ARN you can use to create your own loggers using [Serverless](https://serverless.com/). Deploy your log functions into the same account and you can log with whatever tool you wish.  We hope to use this to drive a live web interface plotting npm usage within your company.

An example of using slack to log activity and errors can be found here:

[https://github.com/craftship/yith-log-slack](https://github.com/craftship/yith-log-slack)

## Other Resources

[Blog](https://craftship.io/open/source/serverless/private/npm/registry/yith/2016/09/26/serverless-yith.html)

[FAQ](https://github.com/craftship/yith/wiki/FAQ)
