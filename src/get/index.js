import npm from '../adapters/npm';
import S3 from '../adapters/s3';

export default async ({ path }, context, callback) => {
  const { registry, bucket, region } = process.env;
  const name = `${decodeURIComponent(path.name)}`;
  const storage = new S3({ region, bucket });

  try {
    const pkgBuffer = await storage.get(`${name}/index.json`);

    return callback(null, JSON.parse(pkgBuffer.toString()));
  } catch (storageError) {
    if (storageError.code === 'NoSuchKey') {
      try {
        const data = await npm(registry, name);
        return callback(null, data);
      } catch (npmError) {
        return callback(npmError);
      }
    }
    return callback(storageError);
  }
};
