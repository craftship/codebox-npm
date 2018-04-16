[![Serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)
[![CircleCI Status](https://circleci.com/gh/craftship/codebox-npm.svg?style=shield)](https://circleci.com/gh/craftship/codebox-npm)
[![Coverage Status](https://coveralls.io/repos/github/craftship/codebox-npm/badge.svg?branch=master&cb=1)](https://coveralls.io/github/craftship/codebox-npm?branch=master)

<img src="https://s3-eu-west-1.amazonaws.com/learn.craftship.io/codebox_logo.png" height="150"/>

## Overview
Codebox npm is a serverless npm registry to allow companies that wish to keep their intellectual property. It allows sharing of npm modules within a company but additionally allows access to all of the modules on public npm. One other major difference is that it replaces `npm login` authentication to be via github / github enterprise.  Users are always required to be authenticated when using codebox as their npm registry.

It is currently compatible with the latest version of the npm & yarn cli.

## Local Deployment

The quickest way to deploy your own npm registry from your local machine is to follow the following guide.

### Prerequisites
* A GitHub / GitHub Enterprise application is registered (e.g. [for GitHub](https://github.com/settings/developers)), you will need the `Client ID` and `Secret`.
* You have `AWS` environment credentials setup with enough access to deploy Serverless resources on your local machine, you can follow the standard guide from Amazon [here](http://docs.aws.amazon.com/sdk-for-java/v1/developer-guide/setup-credentials.html).
* Latest version of Serverless installed globally (`npm install serverless -g` or `yarn global add serverless`).

#### Steps
* `serverless install --url https://github.com/craftship/codebox-npm/tree/0.21.2 --name my-npm-registry` - pick whichever name you prefer for your registry
* `cd my-npm-registry`
* `npm install`
* Setup your environment variables:
```
export CODEBOX_REGION="eu-west-1" # Set the AWS region you wish your registry to be deployed to
export CODEBOX_ADMINS="" # Comma seperated list of github usernames (e.g. "jon,kadi"), these users will be the only ones able to publish
export CODEBOX_REGISTRY="https://registry.npmjs.org/" # The NPM mirror you wish to proxy through to
export CODEBOX_BUCKET="my-npm-registry-storage" # The name of the bucket in which you wish to store your packages
export CODEBOX_GITHUB_URL="https://api.github.com/" # The GitHub / GitHub Enterprise **api** url
export CODEBOX_GITHUB_CLIENT_ID="client_id" # The client id for your GitHub application
export CODEBOX_GITHUB_SECRET="secret" # The secret for your GitHub application
export CODEBOX_RESTRICTED_ORGS="" # OPTIONAL: Comma seperated list of github organisations to only allow access to users in that org (e.g. "craftship,myorg").  Useful if using public GitHub for authentication, as by default all authenticated users would have access.
```
* `serverless deploy --stage prod` (pick which ever stage you wish)
* `npm set registry <url>` - `<url>` being the base url shown in the terminal after deployment completes, such as:
`https://abcd12345.execute-api.eu-west-1.amazonaws.com/dev/registry/`

## Using it in your Repositories
The easiest way to ensure developers are using the correct private registry url is to setup a `.npmrc` file.  This contains default settings that npm will pick up on and will ensure the registry is set per repository.

This is especially great for repositories you wish developers to allow publishing and keep private.  Here is an example `.npmrc` file:


```
registry=https://ab1cd3ef4.execute-api.eu-west-1.amazonaws.com/prod/registry
always-auth=true
```

If a user is doing any `npm` operation for the first time in the repository then they will need to `npm login`.  `always-auth=true` allows yarn to be supported in your project.

## `npm login` Usage
Once you are using the private registry you are required to always be authenticated with npm. This ensures not just anyone can request private packages that are not to be shared with the outside world.

To login you can use the `npm login` cli command, if you have 2FA enabled you will need to (when prompted) enter the username in the format of your GitHub username.otp e.g. `jonsharratt.123456`. Once logged in it will store a long life token that will be used going forward.

You are now able to use npm commands as normal.

## `yarn login` Usage
The best way to setup yarn authentication is to do an initial `npm login` so it can support a 2FA login if you have it enabled.

Once done ensure you have a project based `.npmrc` config setup a per the "Using it in your Repositories" guide above.  The `always-auth=true` option ensures yarn will work with your `codebox-npm` registry.

Yarn does not require an explicit `yarn login` as in this scenario it uses your `.npmrc` config instead.

## Admins / Publishing Packages
`npm publish` works as it normally does via the npm CLI.  By default all users that authenticate have read only access.  If you wish to allow publish rights then you need to set the `CODEBOX_ADMINS` environment variable to a comma separated list of GitHub usernames such as `jonsharratt,kadikraman` and re-deploy.

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

## Custom Domain
If you are happy with Codebox on the AWS domain and wish to move it to a custom domain, instructions can be found on the AWS website [here](http://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-custom-domains.html).

Once you have your custom domain setup you will need to ensure packages already published are migrated by running the following command (supply only the host of your custom domain):

`serverless codebox domain --stage yourstage --host custom-domain.com`

## Other Resources

[Blog (Previously named Yith)](https://craftship.io/open/source/serverless/private/npm/registry/yith/2016/09/26/serverless-yith.html)

[FAQ](https://github.com/craftship/codebox-npm/wiki/FAQ)
