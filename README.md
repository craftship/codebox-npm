# yith
#### Serverless private npm registry, proxy.

[Blog About Yith](https://craftship.io/open/source/serverless/private/npm/registry/yith/2016/09/26/serverless-yith.html)

### Overview
Yith is a simple npm registry to allow companies that wish to
keep their intellectual property.  It allows sharing of npm modules
within a company but additionally allows access to all of the
modules on npm.  It replaces npm authentication to be via github / github
enterprise.

It is compatiable with the latest version of the `npm` cli.

#### Deploy your own Registry

## Prerequisites
* AWS credentials setup with relevant rights to create resource for deployment of Serverless.
* Latest version of serverless installed globally (`npm install serverless -g`).

## Steps
1. `serverless install --url https://github.com/craftship/yith-next --name my-npm-registry`
2. `cd my-npm-registry`
3. `npm install`
4. Setup your environment variables:
```
export YITH_ADMINS="" # Comma seperated list of github usernames (e.g. "jon,kadi"), these users will be the only ones able to publish
export YITH_REGISTRY="https://registry.npmjs.org/" # The NPM mirror you wish to proxy through to
export YITH_BUCKET="my-npm-registry-storage" # The name of the bucket in which you wish to store your packages
export YITH_GITHUB_URL="https://api.github.com/" # The GitHub / GitHub Entperise **api** url
export YITH_GITHUB_CLIENT_ID="client_id" # The client id for your GitHub application (e.g. [](https://github.com/settings/developers))
export YITH_GITHUB_SECRET="secret" # The secret for your GitHub application
```
5. `serverless deploy --stage prod` (pick which ever stage you prefer)
6. `npm set registry <url>` - url being the one shown in the terminal after deployment completes, such as:
`https://abcd12345.execute-api.eu-west-1.amazonaws.com/dev/registry/`

**Thats it!**

### NPM CLI Compatible Features
* `npm login` - via github / github enterprise (if 2FA enabled format username for npm login via cli as `username.otp` e.g. `craftship.123456`)
* `npm publish` - Stores all packages within S3 (Never publishes to real npm), `--tag` is supported
* `npm dist-tags` - Only allows amendment of dist-tags in your private registry, `ls` will go to S3 if package not in private registry
* `npm install` - Looks in S3 first, if it does not exist grabs from real npm
* `npm install@version`- Looks in S3 first, if it does not exist grabs from real npm
* `npm info` - Looks in S3 first, if it does not exist grabs from real npm
* Scoped packages are supported.
