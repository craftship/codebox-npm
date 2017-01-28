import npm from '../../adapters/npm';
import S3 from '../../adapters/s3';

export default async ({ path }, context, callback) => {
  const { registry, bucket, region } = process.env;
  const name = `${decodeURIComponent(path.name)}`;
  const storage = new S3({ region, bucket });

  try {
    const pkgBuffer = await storage.get(`${name}/index.json`);
    const json = JSON.parse(pkgBuffer.toString());
    return callback(null, json['dist-tags']);
  } catch (storageError) {
    if (storageError.code === 'NoSuchKey') {
      try {
        const data = await npm(registry, name);
        return callback(null, data['dist-tags']);
      } catch ({ message }) {
        return callback(null, {
          ok: false,
          error: message,
        });
      }
    }

    return callback(null, {
      ok: false,
      error: storageError.message,
    });
  }
};
