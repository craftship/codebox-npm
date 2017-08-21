/* eslint-disable no-underscore-dangle */
import pkg from '../fixtures/package';

import subject from '../../src/put/publish';

describe('PUT /registry/{name}', () => {
  let event;
  let callback;
  let storageStub;

  beforeEach(() => {
    const env = {
      bucket: 'foo-bucket',
      region: 'bar-region',
    };

    process.env = env;

    event = version => ({
      requestContext: {
        authorizer: {
          username: 'foo',
          avatar: 'https://example.com',
        },
      },
      body: pkg.withAttachments(version),
      pathParameters: {
        name: 'foo-bar-package',
      },
    });

    callback = stub();
  });

  describe('publish', () => {
    context('new package', () => {
      beforeEach(() => {
        const notFoundError = new Error('No such key.');
        notFoundError.code = 'NoSuchKey';

        storageStub = {
          get: stub().throws(notFoundError),
          put: stub(),
        };
      });

      it('should attempt to get package json', async () => {
        await subject(
          event({
            major: 1,
            minor: 0,
            patch: 0,
          }), {
            registry: 'https://example.com',
            apiEndpoint: 'https://example.com/prod/registry',
            user: stub(),
            log: {
              info: stub(),
              error: stub(),
            },
            npm: stub(),
            storage: storageStub,
          },
          callback,
        );

        assert(storageStub.get.calledWithExactly(
          'foo-bar-package/index.json',
        ));
      });

      it('should store tar file', async () => {
        await subject(
          event({
            major: 1,
            minor: 0,
            patch: 0,
          }), {
            registry: 'https://example.com',
            apiEndpoint: 'https://example.com/prod/registry',
            user: stub(),
            log: {
              error: stub(),
            },
            npm: stub(),
            storage: storageStub,
          },
          callback,
        );

        assert(storageStub.put.calledWithExactly(
          'foo-bar-package/1.0.0.tgz',
          'foo-package-data',
          'base64',
        ));
      });

      it('should store package json', async () => {
        await subject(
          event({
            major: 1,
            minor: 0,
            patch: 0,
          }), {
            registry: 'https://example.com',
            apiEndpoint: 'https://example.com/prod/registry',
            user: stub(),
            log: {
              info: stub(),
              error: stub(),
            },
            npm: stub(),
            storage: storageStub,
          },
          callback,
        );

        assert(storageStub.put.calledWithExactly(
          'foo-bar-package/index.json',
          pkg.withAttachments({
            major: 1,
            minor: 0,
            patch: 0,
          }).toString(),
        ));
      });

      it('should return correct response', async () => {
        await subject(
          event({
            major: 1,
            minor: 0,
            patch: 0,
          }), {
            registry: 'https://example.com',
            apiEndpoint: 'https://example.com/prod/registry',
            user: stub(),
            log: {
              info: stub(),
              error: stub(),
            },
            npm: stub(),
            storage: storageStub,
          },
          callback,
        );

        assert(callback.calledWithExactly(null, {
          statusCode: 200,
          body: '{"success":true}',
        }));
      });
    });

    context('existing package', () => {
      beforeEach(() => {
        storageStub = {
          get: stub().returns(pkg.withAttachments({
            major: 1,
            minor: 0,
            patch: 0,
          })),
          put: stub(),
        };
      });

      it('should get package json', async () => {
        await subject(
          event({
            major: 2,
            minor: 0,
            patch: 0,
          }), {
            registry: 'https://example.com',
            apiEndpoint: 'https://example.com/prod/registry',
            user: stub(),
            log: {
              info: stub(),
              error: stub(),
            },
            npm: stub(),
            storage: storageStub,
          },
          callback,
        );

        assert(storageStub.get.calledWithExactly(
          'foo-bar-package/index.json',
        ));
      });

      it('should store tar file', async () => {
        await subject(
          event({
            major: 2,
            minor: 0,
            patch: 0,
          }), {
            registry: 'https://example.com',
            apiEndpoint: 'https://example.com/prod/registry',
            user: stub(),
            log: {
              error: stub(),
              info: stub(),
            },
            npm: stub(),
            storage: storageStub,
          },
          callback,
        );

        assert(storageStub.put.calledWithExactly(
          'foo-bar-package/2.0.0.tgz',
          'foo-package-data',
          'base64',
        ));
      });

      it('should store package json', async () => {
        await subject(
          event({
            major: 2,
            minor: 0,
            patch: 0,
          }), {
            registry: 'https://example.com',
            apiEndpoint: 'https://example.com/prod/registry',
            user: stub(),
            log: {
              error: stub(),
              info: stub(),
            },
            npm: stub(),
            storage: storageStub,
          },
          callback,
        );

        const pkg1 = JSON.parse(pkg.withAttachments({ major: 1, minor: 0, patch: 0 }).toString());
        const pkg2 = JSON.parse(pkg.withAttachments({ major: 2, minor: 0, patch: 0 }).toString());

        const versions = Object.assign(pkg1.versions, pkg2.versions);

        const updatedPackage = Object.assign({}, pkg1, pkg2);
        updatedPackage.versions = versions;
        updatedPackage._attachments = pkg2._attachments;

        const expected = JSON.stringify(updatedPackage);

        assert(storageStub.put.calledWithExactly(
          'foo-bar-package/index.json',
          expected,
        ));
      });

      it('should return correct response', async () => {
        await subject(
          event({
            major: 2,
            minor: 0,
            patch: 0,
          }), {
            registry: 'https://example.com',
            apiEndpoint: 'https://example.com/prod/registry',
            user: stub(),
            log: {
              error: stub(),
              info: stub(),
            },
            npm: stub(),
            storage: storageStub,
          },
          callback,
        );

        assert(callback.calledWithExactly(null, {
          statusCode: 200,
          body: '{"success":true}',
        }));
      });
    });

    context('package id that exists on npm', () => {
      let npmStub;

      beforeEach(() => {
        npmStub = {
          package: stub().returns(
            JSON.parse(
              pkg.withAttachments({
                major: 1,
                minor: 0,
                patch: 0,
              }).toString(),
            ),
          ),
        };
      });

      it('should return 403 informing you require a unqiue package name', async () => {
        await subject(
          event({
            major: 1,
            minor: 0,
            patch: 0,
          }), {
            registry: 'https://example.com',
            apiEndpoint: 'https://example.com/prod/registry',
            user: stub(),
            log: {
              error: stub(),
              info: stub(),
            },
            npm: npmStub,
            storage: storageStub,
          },
          callback,
        );

        assert(callback.calledWithExactly(null, {
          statusCode: 403,
          body: '{"success":false,"error":"Your package name needs to be unique to the public npm registry."}',
        }));
      });
    });

    context('publishing an existing version', () => {
      beforeEach(() => {
        storageStub = {
          get: stub().returns(pkg.withAttachments({
            major: 1,
            minor: 0,
            patch: 0,
          })),
        };
      });

      it('should return 403 informing you cannot re-publish previous versions', async () => {
        await subject(
          event({
            major: 1,
            minor: 0,
            patch: 0,
          }), {
            registry: 'https://example.com',
            apiEndpoint: 'https://example.com/prod/registry',
            user: stub(),
            log: {
              error: stub(),
              info: stub(),
            },
            npm: stub(),
            storage: storageStub,
          },
          callback,
        );

        assert(callback.calledWithExactly(null, {
          statusCode: 403,
          body: '{"success":false,"error":"You cannot publish over the previously published version 1.0.0."}',
        }));
      });
    });

    context('storage put error', () => {
      beforeEach(() => {
        storageStub = {
          get: stub().returns(pkg.withAttachments({
            major: 1,
            minor: 0,
            patch: 0,
          })),
          put: stub().throws(new Error('Failed to put')),
        };
      });

      it('should return 500 response', async () => {
        await subject(
          event({
            major: 2,
            minor: 0,
            patch: 0,
          }), {
            registry: 'https://example.com',
            user: stub(),
            log: {
              error: stub(),
              info: stub(),
            },
            npm: stub(),
            storage: storageStub,
          },
          callback,
        );

        assert(callback.calledWithExactly(null, {
          statusCode: 500,
          body: '{"success":false,"error":"Failed to put"}',
        }));
      });
    });
  });
});
