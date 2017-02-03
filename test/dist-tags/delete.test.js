/* eslint-disable no-underscore-dangle */
import Storage from '../../src/adapters/s3';
import pkg from '../fixtures/package';

import subject from '../../src/dist-tags/delete';

describe('DELETE registry/-/package/{name}/dist-tags/{tag}', () => {
  let event;
  let callback;
  let storageSpy;
  let storageInstance;

  beforeEach(() => {
    const env = {
      bucket: 'foo-bucket',
      region: 'bar-region',
    };

    process.env = env;

    event = {
      pathParameters: {
        name: 'foo-bar-package',
        tag: 'alpha',
      },
    };

    callback = stub();
  });

  describe('dist-tags rm', () => {
    context('package exists', () => {
      beforeEach(() => {
        storageSpy = spy(() => {
          storageInstance = createStubInstance(Storage);

          const pkgDistTags = JSON.parse(pkg({
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
          pkg({ major: 1, minor: 0, patch: 0 }).toString(),
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

          storageInstance.get.returns(pkg({
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
});
