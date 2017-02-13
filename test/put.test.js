/* eslint-disable no-underscore-dangle */
import Storage from '../src/adapters/s3';
import Logger from '../src/adapters/logger';
import pkg from './fixtures/package';

import subject from '../src/put';

describe('PUT /registry/{name}', () => {
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

    event = version => ({
      body: pkg.withAttachments(version),
      pathParameters: {
        name: 'foo-bar-package',
      },
    });

    callback = stub();

    subject.__Rewire__('Logger', loggerSpy);
  });

  describe('publish', () => {
    context('new package', () => {
      beforeEach(() => {
        storageSpy = spy(() => {
          storageInstance = createStubInstance(Storage);

          const notFoundError = new Error('No such key.');
          notFoundError.code = 'NoSuchKey';

          storageInstance.get.throws(notFoundError);

          return storageInstance;
        });

        subject.__Rewire__('S3', storageSpy);
      });

      it('should create storage instance', async () => {
        await subject(event({
          major: 1,
          minor: 0,
          patch: 0,
        }), stub(), callback);

        assert(storageSpy.calledWithNew());
        assert(storageSpy.calledWithExactly({
          bucket: 'foo-bucket',
          region: 'bar-region',
        }));
      });

      it('should attempt to get package json', async () => {
        await subject(event({
          major: 1,
          minor: 0,
          patch: 0,
        }), stub(), callback);

        assert(storageInstance.get.calledWithExactly(
          'foo-bar-package/index.json',
        ));
      });

      it('should store tar file', async () => {
        await subject(event({
          major: 1,
          minor: 0,
          patch: 0,
        }), stub(), callback);

        assert(storageInstance.put.calledWithExactly(
          'foo-bar-package/1.0.0.tgz',
          'foo-package-data',
          'base64',
        ));
      });

      it('should store package json', async () => {
        await subject(event({
          major: 1,
          minor: 0,
          patch: 0,
        }), stub(), callback);

        assert(storageInstance.put.calledWithExactly(
          'foo-bar-package/index.json',
          pkg.withAttachments({
            major: 1,
            minor: 0,
            patch: 0,
          }).toString(),
        ));
      });

      it('should return correct response', async () => {
        await subject(event({
          major: 1,
          minor: 0,
          patch: 0,
        }), stub(), callback);

        assert(callback.calledWithExactly(null, {
          statusCode: 200,
          body: '{"success":true}',
        }));
      });

      afterEach(() => {
        subject.__ResetDependency__('S3');
      });
    });

    context('existing package', () => {
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

      it('should create storage instance', async () => {
        await subject(event({
          major: 2,
          minor: 0,
          patch: 0,
        }), stub(), callback);

        assert(storageSpy.calledWithNew());
        assert(storageSpy.calledWithExactly({
          bucket: 'foo-bucket',
          region: 'bar-region',
        }));
      });

      it('should get package json', async () => {
        await subject(event({
          major: 2,
          minor: 0,
          patch: 0,
        }), stub(), callback);

        assert(storageInstance.get.calledWithExactly(
          'foo-bar-package/index.json',
        ));
      });

      it('should store tar file', async () => {
        await subject(event({
          major: 2,
          minor: 0,
          patch: 0,
        }), stub(), callback);

        assert(storageInstance.put.calledWithExactly(
          'foo-bar-package/2.0.0.tgz',
          'foo-package-data',
          'base64',
        ));
      });

      it('should store package json', async () => {
        await subject(event({
          major: 2,
          minor: 0,
          patch: 0,
        }), stub(), callback);

        const pkg1 = JSON.parse(pkg.withAttachments({ major: 1, minor: 0, patch: 0 }).toString());
        const pkg2 = JSON.parse(pkg.withAttachments({ major: 2, minor: 0, patch: 0 }).toString());

        const versions = Object.assign(pkg1.versions, pkg2.versions);
        const attachments = Object.assign(pkg1._attachments, pkg2._attachments);

        const updatedPackage = Object.assign({}, pkg1, pkg2);
        updatedPackage.versions = versions;
        updatedPackage._attachments = attachments;

        const expected = JSON.stringify(updatedPackage);

        assert(storageInstance.put.calledWithExactly(
          'foo-bar-package/index.json',
          expected,
        ));
      });

      it('should return correct response', async () => {
        await subject(event({
          major: 2,
          minor: 0,
          patch: 0,
        }), stub(), callback);

        assert(callback.calledWithExactly(null, {
          statusCode: 200,
          body: '{"success":true}',
        }));
      });

      afterEach(() => {
        subject.__ResetDependency__('S3');
      });
    });

    context('publishing an existing version', () => {
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

      it('should return 403 informing you cannot re-publish previous versions', async () => {
        await subject(event({
          major: 1,
          minor: 0,
          patch: 0,
        }), stub(), callback);

        assert(callback.calledWithExactly(null, {
          statusCode: 403,
          body: '{"success":false,"error":"You cannot publish over the previously published version 1.0.0."}',
        }));
      });

      afterEach(() => {
        subject.__ResetDependency__('S3');
      });
    });

    context('storage put error', () => {
      beforeEach(() => {
        storageSpy = spy(() => {
          storageInstance = createStubInstance(Storage);

          storageInstance.get.returns(pkg.withAttachments({
            major: 1,
            minor: 0,
            patch: 0,
          }));

          storageInstance.put.throws(new Error('Failed to put'));

          return storageInstance;
        });

        subject.__Rewire__('S3', storageSpy);
      });

      it('should return 500 response', async () => {
        await subject(event({
          major: 2,
          minor: 0,
          patch: 0,
        }), stub(), callback);

        assert(callback.calledWithExactly(null, {
          statusCode: 500,
          body: '{"success":false,"error":"Failed to put"}',
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
