import npm from '../../adapters/npm';
import S3 from '../../adapters/s3';
import lib from './lib';

export default async (event, _, callback) => {
  try {
    const storage = new S3({
      region: process.env.region,
      bucket: process.env.bucketCache,
    });

    lib(
      event, {
        registry: process.env.registry,
        storage,
        npm,
      },
      callback,
    );
  } catch (err) {
    console.log(err);
    callback(err);
  }
};
