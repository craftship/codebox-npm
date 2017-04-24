/* eslint-disable no-underscore-dangle */
import pkg from '../fixtures/package';

import subject from '../../src/get/lib';

describe('GET /registry/{name}', () => {
  let event;
  let callback;

  beforeEach(() => {
    event = {
      requestContext: {
        authorizer: {
          username: 'foo',
          avatar: 'https://example.com',
        },
      },
      pathParameters: {
        name: 'foo-bar-package',
      },
    };

    callback = stub();
  });

  context('package does not exist in private registry', () => {
    let npmStub;
    let storageStub;

    beforeEach(() => {
      const npmPackageStub = stub().returns(
        JSON.parse(pkg.withoutAttachments({
          major: 1,
          minor: 0,
          patch: 0,
        }).toString()));

      npmStub = {
        package: npmPackageStub,
      };

      const notFoundError = new Error('Not Found');
      notFoundError.code = 'NoSuchKey';

      storageStub = {
        get: stub().throws(notFoundError),
      };
    });

    it('should fetch package json from npm', async () => {
      await subject(event, {
        registry: 'https://example.com',
        user: stub(),
        log: {
          error: stub(),
        },
        npm: npmStub,
        storage: storageStub,
      }, callback);

      assert(npmStub.package.calledWithExactly(
        'https://example.com',
        'foo-bar-package',
      ));
    });

    it('should return package json response from npm', async () => {
      await subject(event, {
        registry: 'https://example.com',
        user: stub(),
        log: {
          error: stub(),
          info: stub(),
        },
        npm: npmStub,
        storage: storageStub,
      }, callback);

      assert(callback.calledWithExactly(null, {
        statusCode: 200,
        body: pkg.withoutAttachments({
          major: 1,
          minor: 0,
          patch: 0,
        }).toString(),
      }));
    });
  });

  context('package exists in private registry', () => {
    let storageStub;

    beforeEach(() => {
      const getPackageStub = stub().returns(
        pkg.withoutAttachments({
          major: 1,
          minor: 0,
          patch: 0,
        }));

      storageStub = {
        get: getPackageStub,
      };
    });

    it('should get package json from storage with correct key', async () => {
      await subject(event, {
        registry: 'https://example.com',
        user: stub(),
        log: {
          error: stub(),
        },
        npm: stub(),
        storage: storageStub,
      }, callback);

      assert(storageStub.get.calledWithExactly(
        'foo-bar-package/index.json',
      ));
    });

    it('should return package json response', async () => {
      await subject(event, {
        registry: 'https://example.com',
        user: stub(),
        log: {
          error: stub(),
          info: stub(),
        },
        npm: stub(),
        storage: storageStub,
      }, callback);

      assert(callback.calledWithExactly(null, {
        statusCode: 200,
        body: pkg.withoutAttachments({
          major: 1,
          minor: 0,
          patch: 0,
        }).toString(),
      }));
    });
  });

  context('npm errors', () => {
    let npmStub;
    let storageStub;

    beforeEach(() => {
      const npmError = new Error('npm Error');
      npmError.status = 500;

      npmStub = {
        package: stub().throws(npmError),
      };

      const notFoundError = new Error('Not Found');
      notFoundError.code = 'NoSuchKey';

      storageStub = {
        get: stub().throws(notFoundError),
      };
    });

    it('should return correct status code and response with error', async () => {
      await subject(event, {
        registry: 'https://example.com',
        user: stub(),
        log: {
          error: stub(),
        },
        npm: npmStub,
        storage: storageStub,
      }, callback);

      assert(callback.calledWithExactly(null, {
        statusCode: 500,
        body: '{"error":"npm Error"}',
      }));
    });
  });

  context('cache enabled', () => {
    let storageStub;
    let cacheStub;

    beforeEach(() => {
      const getPackageStub = stub().returns(
        pkg.withoutAttachments({
          major: 1,
          minor: 0,
          patch: 0,
        }));

      cacheStub = {
        get: getPackageStub,
      };
    });

    it('should attempt to get package from cache', async () => {
      await subject(event, {
        registry: 'https://example.com',
        user: stub(),
        cacheEnabled: true,
        cache: cacheStub,
        log: {
          error: stub(),
        },
        npm: stub(),
        storage: stub(),
      }, callback);

      assert(cacheStub.get.calledWithExactly(
        'foo-bar-package/index.json',
      ));
    });

    context('package has not been cached and not a private package', () => {
      beforeEach(() => {
        const notInStorageErr = new Error('Not Found');
        notInStorageErr.code = 'NoSuchKey';

        const notInStorageStub = stub().throws(notInStorageErr);

        cacheStub = {
          get: notInStorageStub,
          put: stub(),
        };

        storageStub = {
          get: notInStorageStub,
        };
      });

      it('should add package ready to be cached by schedule', async () => {
        await subject(event, {
          registry: 'https://example.com',
          user: stub(),
          cacheEnabled: true,
          cache: cacheStub,
          log: {
            info: stub(),
          },
          npm: {
            package: stub().returns(
              JSON.parse(
                pkg.withoutAttachments({
                  major: 1,
                  minor: 0,
                  patch: 0,
                }).toString())),
          },
          storage: storageStub,
        }, callback);

        assert(cacheStub.put.calledWithExactly(
          'foo-bar-package/index.json',
          pkg.withoutAttachments({
            major: 1,
            minor: 0,
            patch: 0,
            cached: false,
          }).toString(),
        ));
      });
    });

    context('package has been cached', () => {
      beforeEach(() => {
        const getPackageStub = stub().returns(
          pkg.withoutAttachments({
            major: 1,
            minor: 0,
            patch: 0,
            cached: true,
          }));

        cacheStub = {
          get: getPackageStub,
        };
      });

      it('should return package from cache', async () => {
        await subject(event, {
          registry: 'https://example.com',
          user: stub(),
          cacheEnabled: true,
          cache: cacheStub,
          log: {
            error: stub(),
          },
          npm: stub(),
          storage: stub(),
        }, callback);

        assert(callback.calledWithExactly(null, {
          statusCode: 200,
          body: pkg.withoutAttachments({
            major: 1,
            minor: 0,
            patch: 0,
            cached: true,
          }).toString(),
        }));
      });
    });
  });

  context('storage get errors', () => {
    let storageStub;

    beforeEach(() => {
      storageStub = {
        get: stub().throws(new Error('Storage Error')),
      };
    });

    it('should return 500 response with error', async () => {
      await subject(event, {
        registry: 'https://example.com',
        user: stub(),
        log: {
          error: stub(),
        },
        npm: stub(),
        storage: storageStub,
      }, callback);

      assert(callback.calledWithExactly(null, {
        statusCode: 500,
        body: '{"error":"Storage Error"}',
      }));
    });
  });
});
