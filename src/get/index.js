import fetch from 'node-fetch';
import S3 from '../adapters/s3';

const npm = async (registry, name) => {
  const response = await fetch(`${registry}${name}`);

  if (!response.ok) {
    throw new Error(`[${response.status}] Could Not Get Package: ${registry}${name}`);
  }

  return response.json();
};

export default async ({ path }, context, callback) => {
  const { registry, bucket, region } = process.env;
  const name = `${decodeURIComponent(path.name)}`;
  const storage = new S3({ region, bucket });

  try {
    const body = await storage.get(`${name}/index.json`);

    return callback(null, JSON.parse(body.toString()));
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
