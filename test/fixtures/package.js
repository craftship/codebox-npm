export default {
  deprecate: (msg, {
    major,
    minor,
    patch,
    cached = false,
  }) => new Buffer(
    JSON.stringify({
      _id: 'foo-bar-package',
      name: 'foo-bar-package',
      'dist-tags': {
        latest: `${major}.${minor}.${patch}`,
      },
      versions: {
        [`${major}.${minor}.${patch}`]: {
          name: 'foo-bar-package',
          version: `${major}.${minor}.${patch}`,
          deprecated: msg,
          dist: {
            tarball: `https://example.com/registry/foo-bar-package/-/foo-bar-package-${major}.${minor}.${patch}.tgz`,
          },
        },
      },
      _attachments: {
        [`foo-bar-package-${major}.${minor}.${patch}.tgz`]: {
          data: 'foo-package-data',
        },
      },
      _codebox: {
        cached,
      },
    }),
  ),
  withAttachments: ({
    major,
    minor,
    patch,
    cached = false,
  }) => new Buffer(
    JSON.stringify({
      _id: 'foo-bar-package',
      name: 'foo-bar-package',
      'dist-tags': {
        latest: `${major}.${minor}.${patch}`,
      },
      versions: {
        [`${major}.${minor}.${patch}`]: {
          name: 'foo-bar-package',
          version: `${major}.${minor}.${patch}`,
          dist: {
            tarball: `https://example.com/registry/foo-bar-package/-/foo-bar-package-${major}.${minor}.${patch}.tgz`,
          },
        },
      },
      _attachments: {
        [`foo-bar-package-${major}.${minor}.${patch}.tgz`]: {
          data: 'foo-package-data',
        },
      },
      _codebox: {
        cached,
      },
    }),
  ),
  withoutAttachments: ({
    major,
    minor,
    patch,
    cached = false,
  }) => new Buffer(
    JSON.stringify({
      _id: 'foo-bar-package',
      name: 'foo-bar-package',
      'dist-tags': {
        latest: `${major}.${minor}.${patch}`,
      },
      versions: {
        [`${major}.${minor}.${patch}`]: {
          name: 'foo-bar-package',
          version: `${major}.${minor}.${patch}`,
          dist: {
            tarball: `https://example.com/registry/foo-bar-package/-/foo-bar-package-${major}.${minor}.${patch}.tgz`,
          },
        },
      },
      _attachments: {},
      _codebox: {
        cached,
      },
    }),
  ),
};
