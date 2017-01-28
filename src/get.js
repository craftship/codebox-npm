import npm from './adapters/npm';
import S3 from './adapters/s3';

export default async ({ pathParameters }, context, callback) => {
  const { registry, bucket, region } = process.env;
  const name = `${decodeURIComponent(pathParameters.name)}`;
  const storage = new S3({ region, bucket });

  try {
    const pkgBuffer = await storage.get(`${name}/index.json`);

    return callback(null, {
      statusCode: 200,
      body: pkgBuffer.toString(),
    });
  } catch (storageError) {
    if (storageError.code === 'NoSuchKey') {
      try {
        const data = await npm(registry, name);
        return callback(null, {
          statusCode: 200,
          body: JSON.stringify(data),
        });
      } catch (npmError) {
        return callback(null, {
          statusCode: npmError.status,
          body: JSON.stringify({
            error: npmError.message,
          }),
        });
      }
    }

    return callback(null, {
      statusCode: 500,
      body: JSON.stringify({
        error: storageError.message,
      }),
    });
  }
};
