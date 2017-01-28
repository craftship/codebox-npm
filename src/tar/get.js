import npm from '../adapters/npm';
import S3 from '../adapters/s3';

export default async ({ pathParameters }, context, callback) => {
  const { registry, bucket, region } = process.env;
  const name = `${decodeURIComponent(pathParameters.name)}`;
  const tarName = `${decodeURIComponent(pathParameters.tar)}`;
  const storage = new S3({ region, bucket });

  try {
    const fileName = tarName.replace(`${name}-`, '');
    const pkgBuffer = await storage.get(`${name}/${fileName}`);

    return callback(null, {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/x-tar',
      },
      body: pkgBuffer.toString('base64'),
      isBase64Encoded: true,
    });
  } catch (storageError) {
    if (storageError.code === 'NoSuchKey') {
      try {
        const npmPkgBuffer = await npm.tar(registry, `${pathParameters.name}/-/${pathParameters.tar}`);
        return callback(null, {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/x-tar',
          },
          body: npmPkgBuffer.toString('base64'),
          isBase64Encoded: true,
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
