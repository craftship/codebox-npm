import S3 from '../../adapters/s3';

export default async ({ body, pathParameters }, context, callback) => {
  const { bucket, region } = process.env;
  const name = `${decodeURIComponent(pathParameters.name)}`;
  const storage = new S3({ region, bucket });

  try {
    const pkgBuffer = await storage.get(`${name}/index.json`);
    const json = JSON.parse(pkgBuffer.toString());
    json['dist-tags'][pathParameters.tag] = body;

    await storage.put(
      `${name}/index.json`,
      JSON.stringify(json),
    );

    return callback(null, {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        id: pathParameters.name,
        'dist-tags': json['dist-tags'],
      }),
    });
  } catch (storageError) {
    return callback(null, {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: storageError.message,
      }),
    });
  }
};
