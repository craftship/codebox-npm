import S3 from './adapters/s3';

export default async ({ pathParameters, body }, context, callback) => {
  const { bucket, region } = process.env;
  const name = `${decodeURIComponent(pathParameters.name)}`;
  const storage = new S3({ region, bucket });

  const pkg = JSON.parse(body);
  const tag = Object.keys(pkg['dist-tags'])[0];
  const version = pkg['dist-tags'][tag];
  const versionData = pkg.versions[version];

  const tarballFilename = encodeURIComponent(versionData.dist.tarball.split('/-/')[1]);
  const tarballBaseUrl = versionData.dist.tarball.split('/registry/')[0];
  versionData.dist.tarball = `${tarballBaseUrl}/registry/${pathParameters.name}/-/${tarballFilename}`;

  let json = {};

  try {
    const pkgBuffer = await storage.get(`${name}/index.json`);
    json = JSON.parse(pkgBuffer.toString());

    if (json.versions[version]) {
      return callback(null, {
        statusCode: 403,
        body: JSON.stringify({
          success: false,
          error: `You cannot publish over the previously published version ${version}.`,
        }),
      });
    }

    json['dist-tags'][tag] = version;
    json['dist-tags'].latest = version;
    json._attachments[`${name}-${version}.tgz`] = pkg._attachments[`${name}-${version}.tgz`]; // eslint-disable-line no-underscore-dangle
    json.versions[version] = versionData;
  } catch (storageError) {
    if (storageError.code === 'NoSuchKey') {
      json = pkg;
      json['dist-tags'].latest = version;
    }
  }

  try {
    await storage.put(
      `${name}/${version}.tgz`,
      json._attachments[`${name}-${version}.tgz`].data, // eslint-disable-line no-underscore-dangle
      'base64',
    );

    await storage.put(
      `${name}/index.json`,
      JSON.stringify(json),
    );

    return callback(null, {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
      }),
    });
  } catch (putError) {
    return callback(null, {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: putError.message,
      }),
    });
  }
};
