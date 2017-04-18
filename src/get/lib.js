export default async ({ pathParameters, body }, {
  registry,
  user,
  storage,
  cache,
  npm,
  log,
}, callback) => {
  const name = `${decodeURIComponent(pathParameters.name)}`;

  try {
    const cachedBuffer = await cache.get(`${name}/index.json`);
    const cachedJson = JSON.parse(cachedBuffer.toString());

    if (cachedJson._codebox.cached) { // eslint-disable-line no-underscore-dangle
      return callback(null, {
        statusCode: 200,
        body: JSON.stringify(cachedJson),
      });
    }

    const notCachedError = new Error('Not yet cached within npm cache storage.');
    notCachedError.code = 'NotCached';
    throw notCachedError;
  } catch (cachedStorageErr) {
    if (cachedStorageErr.code === 'NoSuchKey' ||
        cachedStorageErr.code === 'NotCached') {
      try {
        // Could be a private package that has been published
        const pkgBuffer = await storage.get(`${name}/index.json`);
        const json = JSON.parse(pkgBuffer.toString());
        json._attachments = {}; // eslint-disable-line no-underscore-dangle

        await log.info(user, {
          name: json.name,
        });

        return callback(null, {
          statusCode: 200,
          body: JSON.stringify(json),
        });
      } catch (storageError) {
        if (storageError.code === 'NoSuchKey') {
          try {
            const json = await npm.package(registry, pathParameters.name);
            json._codebox = { // eslint-disable-line no-underscore-dangle
              cached: false,
            };

            // Store json
            await cache.put(
              `${name}/index.json`,
              JSON.stringify(json),
            );

            await log.info(user, {
              name: json.name,
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
    }

    return callback(null, {
      statusCode: 500,
      body: JSON.stringify({
        error: cachedStorageErr.message,
      }),
    });
  }
};
