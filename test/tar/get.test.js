/* eslint-disable no-underscore-dangle */
import Storage from '../../src/adapters/s3';
import Logger from '../../src/adapters/logger';
import subject from '../../src/tar/get';

describe('GET /registry/{name}/-/{tar}', () => {
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
      name: 'foo-bar-package',
      tar: 'foo-bar-package-1.0.0.tgz',
    };

    callback = stub();

    subject.__Rewire__('Logger', loggerSpy);
  });

  context('tar exists in private registry', () => {
    beforeEach(() => {
      storageSpy = spy(() => {
        storageInstance = createStubInstance(Storage);

        storageInstance.get.returns(new Buffer('bar'));

        return storageInstance;
      });

      subject.__Rewire__('S3', storageSpy);
    });

    it('should get package json from storage with correct key', async () => {
      await subject(event, stub(), callback);

      assert(storageInstance.get.calledWithExactly(
        'foo-bar-package/1.0.0.tgz',
      ));
    });

    it('should return base64 response', async () => {
      await subject(event, stub(), callback);

      assert(callback.calledWithExactly(
        null,
        'YmFy',
      ));
    });

    afterEach(() => {
      subject.__ResetDependency__('S3');
    });
  });

  context('tar does not exist in private registry', () => {
    let npmTarStub;

    beforeEach(() => {
      npmTarStub = stub().returns(
        new Buffer('YmFy', 'base64'),
      );

      const mockNpm = {
        tar: npmTarStub,
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

      assert(npmTarStub.calledWithExactly(
        'https://example.com',
        'foo-bar-package/-/foo-bar-package-1.0.0.tgz',
      ));
    });

    it('should return base64 response', async () => {
      await subject(event, stub(), callback);

      assert(callback.calledWithExactly(
        null,
        'YmFy',
      ));
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

      assert(callback.calledWithExactly(
        new Error('Storage error.'),
      ));
    });

    afterEach(() => {
      subject.__ResetDependency__('S3');
    });
  });

  afterEach(() => {
    subject.__ResetDependency__('Logger');
  });
});
