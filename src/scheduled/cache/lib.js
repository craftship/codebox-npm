export default async (event, {
  registry,
  storage,
  npm,
}, callback) => {
  const keys = await storage.listAllKeys();

  keys.filter((key) => {
    const parts = key.split('/');
    return parts[parts.length - 1] === 'index.json';
  })
  .forEach(async (k) => {
    const pkgBuffer = await storage.get(k);
    const cacheJson = JSON.parse(pkgBuffer.toString());
    const name = cacheJson._id; // eslint-disable-line no-underscore-dangle
    const npmJson = await npm.package(
      registry,
      name,
    );

    if (npmJson._rev !== cacheJson._rev || // eslint-disable-line no-underscore-dangle
        !cacheJson._codebox.cached) { // eslint-disable-line no-underscore-dangle
      try {
        Object.keys(npmJson.versions).forEach(async (v) => {
          const versionData = npmJson.versions[v];
          const tarballUrl = versionData.dist.tarball;
          const tarball = tarballUrl.split('/').slice(-1);
          const tar = await npm.tar(registry, `${name}/-/${tarball}`);

          await storage.put(
            `${name}/${v}.tgz`,
            tar,
            'base64',
          );
        });

        Object.keys(npmJson.versions).forEach((v) => {
          if (process.env.apiEndpoint) {
            const version = npmJson.versions[v];

            if (version.dist && version.dist.tarball) {
              const tarballParts = version.dist.tarball.split('/');
              const currentHost = tarballParts[2];
              const currentProtocol = tarballParts[0];

              version.dist.tarball = version.dist.tarball
                .replace(currentHost, `${process.env.apiEndpoint}`)
                .replace(currentProtocol, 'https:');

              npmJson.versions[v] = version;
            }
          }
        });

        npmJson._codebox = { // eslint-disable-line no-underscore-dangle
          cached: true,
        };

        await storage.put(
          `${name}/index.json`,
          JSON.stringify(npmJson),
        );
      } catch (err) {
        console.log('ERR', err);
      }
    }
  });

  return callback(null, {
    status: 'OK',
  });
};
