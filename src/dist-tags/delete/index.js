import S3 from '../../adapters/s3';

export default async ({ path }, context, callback) => {
  const { bucket, region } = process.env;
  const name = `${decodeURIComponent(path.name)}`;
  const storage = new S3({ region, bucket });

  try {
    const body = await storage.get(`${name}/index.json`);
    const json = JSON.parse(body.toString());
    delete json['dist-tags'][path.tag];

    await storage.put(
      `${name}/index.json`,
      JSON.stringify(json),
    );

    return callback(null, {
      ok: true,
      id: path.name,
      'dist-tags': json['dist-tags'],
    });
  } catch (storageError) {
    return callback(null, {
      ok: false,
      error: storageError.message,
    });
  }
};
