import url from 'url';
import GitHub from '@octokit/rest';

export default async ({ pathParameters }, context, callback) => {
  const {
    token,
  } = pathParameters;

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
    await github.authorization.reset({
      client_id: process.env.githubClientId,
      access_token: token,
    });

    return callback(null, {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
      }),
    });
  } catch (err) {
    return callback(null, {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: err.message,
      }),
    });
  }
};
