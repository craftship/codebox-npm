import npm from './adapters/npm';
import S3 from './adapters/s3';
import Logger from './adapters/logger';

const user = authorizer => ({
  name: authorizer.username,
  avatar: authorizer.avatar,
});

const command = (headers) => {
  if (headers.Referer) {
    const refererParts = headers.Referer.split(' ');
    const name = refererParts[0];

    return {
      name,
      args: refererParts.slice(1),
    };
  }

  return {
    name: 'Unknown',
    args: [],
  };
};

const storage = (region, bucket) =>
  new S3({
    region,
    bucket,
  });

const log = (cmd, namespace, region, topic) => {
  if (process.env.clientId && process.env.secret) {
    return new Logger(
      cmd,
      namespace,
      {
        clientId: process.env.clientId,
        secret: process.env.secret,
      },
    );
  }

  return new Logger(
    cmd,
    namespace, {
      region,
      topic,
    });
};

export default (namespace, { headers, requestContext }) => {
  const {
    registry,
    bucket,
    region,
    logTopic,
    apiEndpoint,
  } = process.env;

  const cmd = command(headers);

  return {
    command: cmd,
    registry,
    apiEndpoint,
    user: user(requestContext.authorizer),
    storage: storage(region, bucket),
    log: log(cmd, namespace, region, logTopic),
    npm,
  };
};
