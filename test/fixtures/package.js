export default {
  deprecate: (msg, {
    major,
    minor,
    patch,
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
            tarball: `https://example.com/prod/registry/foo-bar-package/-/foo-bar-package-${major}.${minor}.${patch}.tgz`,
          },
        },
      },
      _attachments: {
        [`foo-bar-package-${major}.${minor}.${patch}.tgz`]: {
          data: 'foo-package-data',
        },
      },
    }),
  ),
  withAttachments: ({
    major,
    minor,
    patch,
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
            tarball: `https://example.com/prod/registry/foo-bar-package/-/foo-bar-package-${major}.${minor}.${patch}.tgz`,
          },
        },
      },
      _attachments: {
        [`foo-bar-package-${major}.${minor}.${patch}.tgz`]: {
          data: 'foo-package-data',
        },
      },
    }),
  ),
  withoutAttachments: ({
    major,
    minor,
    patch,
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
            tarball: `https://example.com/prod/registry/foo-bar-package/-/foo-bar-package-${major}.${minor}.${patch}.tgz`,
          },
        },
      },
      _attachments: {},
    }),
  ),
};
