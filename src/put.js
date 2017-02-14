import S3 from './adapters/s3';
import Logger from './adapters/logger';

export default async ({
  requestContext,
  pathParameters,
  body,
}, context, callback) => {
  const { bucket, region, logTopic } = process.env;
  const user = {
    name: requestContext.authorizer.username,
    avatar: requestContext.authorizer.avatar,
  };

  const log = new Logger('package:put', { region, topic: logTopic });
  const storage = new S3({ region, bucket });

  const name = `${decodeURIComponent(pathParameters.name)}`;

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

    await log.info(user, {
      name: json.name,
      version: json['dist-tags'].latest,
      'dist-tags': json['dist-tags'],
    });

    return callback(null, {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
      }),
    });
  } catch (putError) {
    await log.error(user, putError);

    return callback(null, {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: putError.message,
      }),
    });
  }
};
