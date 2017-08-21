export default async ({
  requestContext,
  pathParameters,
  body,
}, {
  registry,
  apiEndpoint,
  user,
  storage,
  npm,
  log,
}, callback) => {
  // Ensure package has unique name on npm
  try {
    const data = await npm.package(
      registry,
      pathParameters.name,
    );

    if (data._id) { // eslint-disable-line no-underscore-dangle
      return callback(null, {
        statusCode: 403,
        body: JSON.stringify({
          success: false,
          error: 'Your package name needs to be unique to the public npm registry.',
        }),
      });
    }
  } catch (npmError) {
    if (npmError.status === 500) {
      await log.error(user, npmError);

      return callback(null, {
        statusCode: npmError.status,
        body: JSON.stringify({
          success: false,
          error: npmError.message,
        }),
      });
    }
  }

  const name = `${decodeURIComponent(pathParameters.name)}`;
  const pkg = JSON.parse(body);
  const tag = Object.keys(pkg['dist-tags'])[0];
  const version = pkg['dist-tags'][tag];
  const versionData = pkg.versions[version];

  const tarballFilename = encodeURIComponent(versionData.dist.tarball.split('/-/')[1]);
  versionData.dist.tarball = `${apiEndpoint}/${pathParameters.name}/-/${tarballFilename}`;

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
    json._attachments = {}; // eslint-disable-line no-underscore-dangle
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
      name: versionData.name,
      description: versionData.description,
      version,
      keywords: versionData.keywords,
      license: versionData.license,
      contributors: versionData.contributors,
      dependencies: versionData.dependencies,
      homepage: versionData.homepage,
      repository: versionData.repository,
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
