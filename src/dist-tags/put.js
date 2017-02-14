import S3 from '../adapters/s3';
import Logger from '../adapters/logger';

export default async ({
  requestContext,
  body,
  pathParameters,
}, context, callback) => {
  const { bucket, region, logTopic } = process.env;
  const user = {
    name: requestContext.authorizer.username,
    avatar: requestContext.authorizer.avatar,
  };
  const storage = new S3({ region, bucket });
  const log = new Logger('dist-tags:put', { region, topic: logTopic });

  const name = `${decodeURIComponent(pathParameters.name)}`;

  try {
    const pkgBuffer = await storage.get(`${name}/index.json`);
    const json = JSON.parse(pkgBuffer.toString());
    const version = body.replace(/"/g, '');

    json['dist-tags'][pathParameters.tag] = version;

    await storage.put(
      `${name}/index.json`,
      JSON.stringify(json),
    );

    await log.info(user, {
      name: json.name,
      tag: pathParameters.tag,
      version,
      'dist-tags': json['dist-tags'],
    });

    return callback(null, {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        id: pathParameters.name,
        'dist-tags': json['dist-tags'],
      }),
    });
  } catch (storageError) {
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
