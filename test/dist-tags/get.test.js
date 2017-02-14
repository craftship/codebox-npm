/* eslint-disable no-underscore-dangle */
import Storage from '../../src/adapters/s3';
import Logger from '../../src/adapters/logger';
import pkg from '../fixtures/package';

import subject from '../../src/dist-tags/get';

describe('GET /registry/-/package/{name}/dist-tags', () => {
  let event;
  let callback;
  let storageSpy;
  let storageInstance;
  let loggerInstance;
  let loggerSpy;

  beforeEach(() => {
    const env = {
      bucket: 'foo-bucket',
      region: 'bar-region',
      registry: 'https://example.com',
    };

    process.env = env;

    loggerSpy = spy(() => {
      loggerInstance = createStubInstance(Logger);

      loggerInstance.info = stub();
      loggerInstance.error = stub();

      return loggerInstance;
    });

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

    subject.__Rewire__('Logger', loggerSpy);
  });

  describe('dist-tags ls', () => {
    context('package exists in private registry', () => {
      beforeEach(() => {
        storageSpy = spy(() => {
          storageInstance = createStubInstance(Storage);

          storageInstance.get.returns(pkg.withAttachments({
            major: 1,
            minor: 0,
            patch: 0,
          }));

          return storageInstance;
        });

        subject.__Rewire__('S3', storageSpy);
      });

      it('should get from storage with correct key', async () => {
        await subject(event, stub(), callback);

        assert(storageInstance.get.calledWithExactly(
          'foo-bar-package/index.json',
        ));
      });

      it('should return dist tags response', async () => {
        await subject(event, stub(), callback);

        assert(callback.calledWithExactly(null, {
          statusCode: 200,
          body: '{"latest":"1.0.0"}',
        }));
      });

      afterEach(() => {
        subject.__ResetDependency__('S3');
      });
    });

    context('package does not exist in private registry or npm', () => {
      let npmPackageStub;

      beforeEach(() => {
        npmPackageStub = stub().throws(new Error('No package on npm.'));
        const mockNpm = {
          package: npmPackageStub,
        };

        storageSpy = spy(() => {
          storageInstance = createStubInstance(Storage);

          const notFoundError = new Error('No such key.');
          notFoundError.code = 'NoSuchKey';

          storageInstance.get.throws(notFoundError);

          return storageInstance;
        });

        subject.__Rewire__({
          S3: storageSpy,
          npm: mockNpm,
        });
      });

      it('should return correct 404 response', async () => {
        await subject(event, stub(), callback);

        assert(callback.calledWithExactly(null, {
          statusCode: 404,
          body: '{"ok":false,"error":"No package on npm."}',
        }));
      });

      afterEach(() => {
        subject.__ResetDependency__('npm');
        subject.__ResetDependency__('S3');
      });
    });

    context('package does not exist in private registry', () => {
      let npmPackageStub;

      beforeEach(() => {
        npmPackageStub = stub().returns(
          JSON.parse(pkg.withoutAttachments({
            major: 1,
            minor: 0,
            patch: 0,
          }).toString()));

        const mockNpm = {
          package: npmPackageStub,
        };

        storageSpy = spy(() => {
          storageInstance = createStubInstance(Storage);

          const notFoundError = new Error('No such key.');
          notFoundError.code = 'NoSuchKey';

          storageInstance.get.throws(notFoundError);

          return storageInstance;
        });

        subject.__Rewire__({
          S3: storageSpy,
          npm: mockNpm,
        });
      });

      it('should fetch package json from npm', async () => {
        await subject(event, stub(), callback);

        assert(npmPackageStub.calledWithExactly(
          'https://example.com',
          'foo-bar-package',
        ));
      });

      it('should return dist-tags json response from npm', async () => {
        await subject(event, stub(), callback);

        assert(callback.calledWithExactly(null, {
          statusCode: 200,
          body: '{"latest":"1.0.0"}',
        }));
      });

      afterEach(() => {
        subject.__ResetDependency__('npm');
        subject.__ResetDependency__('S3');
      });
    });

    context('storage get errors', () => {
      beforeEach(() => {
        storageSpy = spy(() => {
          storageInstance = createStubInstance(Storage);

          storageInstance.get.throws(new Error('Storage error.'));

          return storageInstance;
        });

        subject.__Rewire__('S3', storageSpy);
      });

      it('should return 500 response with error', async () => {
        await subject(event, stub(), callback);

        assert(callback.calledWithExactly(null, {
          statusCode: 500,
          body: '{"ok":false,"error":"Storage error."}',
        }));
      });

      afterEach(() => {
        subject.__ResetDependency__('S3');
      });
    });
  });

  afterEach(() => {
    subject.__ResetDependency__('Logger');
  });
});
