import url from 'url';
import GitHub from '@octokit/rest';

export default async ({ body }, context, callback) => {
  const {
    name,
    password,
  } = JSON.parse(body);

  const scopes = ['user:email'];

  if (process.env.restrictedOrgs) {
    scopes.push('read:org');
  }

  const nameParts = name.split('.');
  const username = nameParts[0];
  const otp = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

  const parsedUrl = url.parse(process.env.githubUrl);
  const github = new GitHub({
    host: parsedUrl.host,
    protocol: 'https',
    pathPrefix: parsedUrl.path,
  });

  github.authenticate({
    type: 'basic',
    username,
    password,
  });

  let auth = {};
  try {
    auth = await github.authorization.getOrCreateAuthorizationForApp({
      scopes,
      client_id: process.env.githubClientId,
      client_secret: process.env.githubSecret,
      note: 'codebox private npm registry',
      headers: {
        'X-GitHub-OTP': otp,
      },
    });

    if (!auth.token.length) {
      await github.authorization.delete({
        id: auth.id,
        headers: {
          'X-GitHub-OTP': otp,
        },
      });

      auth = await github.authorization.create({
        scopes,
        client_id: process.env.githubClientId,
        client_secret: process.env.githubSecret,
        note: 'codebox private npm registry',
        headers: {
          'X-GitHub-OTP': otp,
        },
      });
    }

    return callback(null, {
      statusCode: 201,
      body: JSON.stringify({
        ok: true,
        token: auth.token,
      }),
    });
  } catch (error) {
    return callback(null, {
      statusCode: 403,
      body: JSON.stringify({
        ok: false,
        error: error.message,
      }),
    });
  }
};
