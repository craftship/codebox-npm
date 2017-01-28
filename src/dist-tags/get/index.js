import npm from '../../adapters/npm';
import S3 from '../../adapters/s3';

export default async ({ pathParameters }, context, callback) => {
  const { registry, bucket, region } = process.env;
  const name = `${decodeURIComponent(pathParameters.name)}`;
  const storage = new S3({ region, bucket });

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
        const data = await npm(registry, name);
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

    return callback(null, {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: storageError.message,
      }),
    });
  }
};
