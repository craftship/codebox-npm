export default async ({
  requestContext,
  pathParameters,
  body,
}, {
  registry,
  user,
  storage,
  npm,
  log,
}, callback) => {
  const name = `${decodeURIComponent(pathParameters.name)}`;

  try {
    await storage.put(
      `${name}/index.json`,
      body.toString(),
    );

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
