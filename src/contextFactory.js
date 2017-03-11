import npm from './adapters/npm';
import S3 from './adapters/s3';
import Logger from './adapters/logger';

const user = authorizer => ({
  name: authorizer.username,
  avatar: authorizer.avatar,
});

const storage = (region, bucket) =>
  new S3({
    region,
    bucket,
  });

const log = (namespace, region, topic) => {
  if (process.env.clientId && process.env.secret) {
    return new Logger(
      namespace,
      {
        clientId: process.env.clientId,
        secret: process.env.secret,
      },
    );
  }

  return new Logger(
    namespace, {
      region,
      topic,
    });
};

export default (namespace, { authorizer }) => {
  const {
    registry,
    bucket,
    region,
    logTopic,
  } = process.env;

  return {
    registry,
    user: user(authorizer),
    storage: storage(region, bucket),
    log: log(namespace, region, logTopic),
    npm,
  };
};
