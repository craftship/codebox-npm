/* eslint-disable no-underscore-dangle */
import Storage from '../../src/adapters/s3';
import Logger from '../../src/adapters/logger';
import pkg from '../fixtures/package';

import subject from '../../src/dist-tags/delete';

describe('DELETE registry/-/package/{name}/dist-tags/{tag}', () => {
  let event;
  let callback;
  let storageSpy;
  let storageInstance;
  let loggerSpy;
  let loggerInstance;

  beforeEach(() => {
    const env = {
      bucket: 'foo-bucket',
      region: 'bar-region',
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
        tag: 'alpha',
      },
    };

    callback = stub();

    subject.__Rewire__('Logger', loggerSpy);
  });

  describe('dist-tags rm', () => {
    context('package exists', () => {
      beforeEach(() => {
        storageSpy = spy(() => {
          storageInstance = createStubInstance(Storage);

          const pkgDistTags = JSON.parse(pkg.withAttachments({
            major: 1,
            minor: 0,
            patch: 0,
          }).toString());

          pkgDistTags['dist-tags'].alpha = '1.0.0';

          storageInstance.get.returns(
            new Buffer(JSON.stringify(pkgDistTags)),
          );

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

      it('should put updated package json into storage', async () => {
        await subject(event, stub(), callback);

        assert(storageInstance.put.calledWithExactly(
          'foo-bar-package/index.json',
          pkg.withAttachments({ major: 1, minor: 0, patch: 0 }).toString(),
        ));
      });

      it('should return correct updated package json response', async () => {
        await subject(event, stub(), callback);

        assert(callback.calledWithExactly(null, {
          statusCode: 200,
          body: '{"ok":true,"id":"foo-bar-package","dist-tags":{"latest":"1.0.0"}}',
        }));
      });

      afterEach(() => {
        subject.__ResetDependency__('S3');
      });
    });

    context('storage put errors', () => {
      beforeEach(() => {
        storageSpy = spy(() => {
          storageInstance = createStubInstance(Storage);

          storageInstance.get.returns(pkg.withoutAttachments({
            major: 1,
            minor: 0,
            patch: 0,
          }));

          storageInstance.put.throws(new Error('Storage error.'));

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
