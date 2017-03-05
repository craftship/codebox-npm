import url from 'url';
import GitHub from 'github';

const generatePolicy = ({
  effect,
  methodArn,
  token,
  isAdmin,
}) => {
  const methodParts = methodArn.split(':');
  const region = methodParts[3];
  const accountArn = methodParts[4];
  const apiId = methodParts[5].split('/')[0];
  const stage = methodParts[5].split('/')[1];

  const authResponse = {};
  authResponse.principalId = token;

  const policyDocument = {};
  policyDocument.Version = '2012-10-17';
  policyDocument.Statement = [];

  const statementOne = {};
  statementOne.Action = 'execute-api:Invoke';
  statementOne.Effect = effect;
  statementOne.Resource = `arn:aws:execute-api:${region}:${accountArn}:${apiId}/${stage}/GET/registry*`;
  policyDocument.Statement[0] = statementOne;

  const statementTwo = {};
  statementTwo.Action = 'execute-api:Invoke';
  statementTwo.Effect = isAdmin ? 'Allow' : 'Deny';
  statementTwo.Resource = `arn:aws:execute-api:${region}:${accountArn}:${apiId}/${stage}/PUT/registry*`;
  policyDocument.Statement[1] = statementTwo;

  const statementThree = {};
  statementThree.Action = 'execute-api:Invoke';
  statementThree.Effect = isAdmin ? 'Allow' : 'Deny';
  statementThree.Resource = `arn:aws:execute-api:${region}:${accountArn}:${apiId}/${stage}/DELETE/registry*`;
  policyDocument.Statement[2] = statementThree;

  authResponse.policyDocument = policyDocument;

  return authResponse;
};

export default async ({ methodArn, authorizationToken }, context, callback) => {
  const tokenParts = authorizationToken.split('Bearer ');

  if (tokenParts.length <= 1) {
    return callback(null, generatePolicy({
      token: authorizationToken,
      effect: 'Deny',
      methodArn,
      isAdmin: false,
    }));
  }

  const token = tokenParts[1];

  const parsedUrl = url.parse(process.env.githubUrl);
  const github = new GitHub({
    host: parsedUrl.host,
    protocol: 'https',
    pathPrefix: parsedUrl.path,
  });

  github.authenticate({
    type: 'basic',
    username: process.env.githubClientId,
    password: process.env.githubSecret,
  });

  try {
    const {
      user,
      updated_at,
      created_at,
    } = await github.authorization.check({
      client_id: process.env.githubClientId,
      access_token: token,
    });

    let isAdmin = false;
    let effect = 'Allow';
    let restrictedOrgs = [];

    if (process.env.restrictedOrgs) {
      restrictedOrgs = process.env.restrictedOrgs.split(',');
    }

    if (restrictedOrgs.length) {
      try {
        github.authenticate({
          type: 'token',
          token,
        });

        const orgs = await github.users.getOrgMemberships({
          state: 'active',
        });

        const usersOrgs = orgs.filter(org => restrictedOrgs.indexOf(org.organization.login) > -1);
        effect = usersOrgs.length ? 'Allow' : 'Deny';
      } catch (githubError) {
        return callback(null, generatePolicy({
          token: tokenParts[1],
          effect: 'Deny',
          methodArn,
          isAdmin: false,
        }));
      }
    }

    if (process.env.admins) {
      isAdmin = process.env.admins.split(',').indexOf(user.login) > -1;
    }

    const policy = generatePolicy({
      effect,
      methodArn,
      token,
      isAdmin,
    });

    policy.context = {
      username: user.login,
      avatar: user.avatar_url,
      updatedAt: updated_at,
      createdAt: created_at,
    };

    return callback(null, policy);
  } catch (error) {
    return callback(null, generatePolicy({
      token: tokenParts[1],
      effect: 'Deny',
      methodArn,
      isAdmin: false,
    }));
  }
};
