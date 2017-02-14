import npm from '../adapters/npm';
import S3 from '../adapters/s3';
import Logger from '../adapters/logger';

export default async ({
  requestContext,
  pathParameters,
}, context, callback) => {
  const { registry, bucket, region, logTopic } = process.env;
  const user = {
    name: requestContext.authorizer.username,
    avatar: requestContext.authorizer.avatar,
  };
  const storage = new S3({ region, bucket });
  const log = new Logger('dist-tags:get', { region, topic: logTopic });

  const name = `${decodeURIComponent(pathParameters.name)}`;

  try {
    const pkgBuffer = await storage.get(`${name}/index.json`);
    const json = JSON.parse(pkgBuffer.toString());
    return callback(null, {
      statusCode: 200,
      body: JSON.stringify(json['dist-tags']),
    });
  } catch (storageError) {
    if (storageError.code === 'NoSuchKey') {
      try {
        const data = await npm.package(registry, name);
        return callback(null, {
          statusCode: 200,
          body: JSON.stringify(data['dist-tags']),
        });
      } catch ({ message }) {
        return callback(null, {
          statusCode: 404,
          body: JSON.stringify({
            ok: false,
            error: message,
          }),
        });
      }
    }

    await log.error(user, storageError);

    return callback(null, {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: storageError.message,
      }),
    });
  }
};
