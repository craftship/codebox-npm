import npm from '../../adapters/npm';
import S3 from '../../adapters/s3';
import lib from './lib';

export default async (event, _, callback) => {
  if (process.env.cacheEnabled !== 'true') {
    return callback(null, {
      status: 'CACHE_DISABLED',
    });
  }

  try {
    const storage = new S3({
      region: process.env.region,
      bucket: process.env.bucketCache,
    });

    return lib(
      event, {
        registry: process.env.registry,
        storage,
        npm,
      },
      callback,
    );
  } catch (err) {
    return callback(err);
  }
};
