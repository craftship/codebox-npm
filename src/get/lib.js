export default async ({ pathParameters }, {
  registry,
  user,
  storage,
  npm,
  log,
}, callback) => {
  const name = `${decodeURIComponent(pathParameters.name)}`;

  try {
    const pkgBuffer = await storage.get(`${name}/index.json`);
    const json = JSON.parse(pkgBuffer.toString());
    json._attachments = {}; // eslint-disable-line no-underscore-dangle

    const version = json['dist-tags'].latest;

    await log.info(user, {
      name: json.name,
      version,
    });

    return callback(null, {
      statusCode: 200,
      body: JSON.stringify(json),
    });
  } catch (storageError) {
    if (storageError.code === 'NoSuchKey') {
      try {
        const json = await npm.package(registry, pathParameters.name);

        const version = json['dist-tags'].latest;

        await log.info(user, {
          name: json.name,
          version,
        });

        return callback(null, {
          statusCode: 200,
          body: JSON.stringify(json),
        });
      } catch (npmError) {
        if (npmError.status === 500) {
          await log.error(user, npmError);
        }

        return callback(null, {
          statusCode: npmError.status,
          body: JSON.stringify({
            error: npmError.message,
          }),
        });
      }
    }

    await log.error(user, storageError);

    return callback(null, {
      statusCode: 500,
      body: JSON.stringify({
        error: storageError.message,
      }),
    });
  }
};
