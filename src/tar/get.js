import npm from '../adapters/npm';
import S3 from '../adapters/s3';
import Logger from '../adapters/logger';

export default async (event, context, callback) => {
  const { registry, bucket, region, logTopic } = process.env;
  const storage = new S3({ region, bucket });
  const log = new Logger('tar:get', { region, topic: logTopic });

  const name = `${decodeURIComponent(event.name)}`;
  const tarName = `${decodeURIComponent(event.tar)}`;

  try {
    const fileName = tarName.replace(`${name}-`, '');
    const pkgBuffer = await storage.get(`${name}/${fileName}`);

    return callback(null, pkgBuffer.toString('base64'));
  } catch (storageError) {
    if (storageError.code === 'NoSuchKey') {
      try {
        const npmPkgBuffer = await npm.tar(registry, `${event.name}/-/${event.tar}`);
        return callback(null, npmPkgBuffer.toString('base64'));
      } catch (npmError) {
        return callback(npmError);
      }
    }

    await log.error(null, storageError);

    return callback(storageError);
  }
};
