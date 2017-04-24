export default async ({ requestContext }, _, callback) =>
  callback(null, {
    statusCode: 200,
    body: JSON.stringify({
      username: requestContext.authorizer.username,
    }),
  });

