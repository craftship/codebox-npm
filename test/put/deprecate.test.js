/* eslint-disable no-underscore-dangle */
import pkg from '../fixtures/package';

import subject from '../../src/put/deprecate';

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

    event = (msg, version) => ({
      requestContext: {
        authorizer: {
          username: 'foo',
          avatar: 'https://example.com',
        },
      },
      body: pkg.deprecate(msg, version),
      pathParameters: {
        name: 'foo-bar-package',
      },
    });

    callback = stub();
  });

  describe('deprecate', () => {
    beforeEach(() => {
      storageStub = {
        put: stub(),
      };
    });

    it('should store package json', async () => {
      await subject(
        event('This package is deprecated', {
          major: 1,
          minor: 0,
          patch: 0,
        }), {
          registry: 'https://example.com',
          user: stub(),
          log: {
            info: stub(),
            error: stub(),
          },
          npm: stub(),
          storage: storageStub,
          command: {
            name: 'deprecate',
            message: 'This package is deprecated',
          },
        },
        callback,
      );

      assert(storageStub.put.calledWithExactly(
        'foo-bar-package/index.json',
        pkg.deprecate('This package is deprecated', {
          major: 1,
          minor: 0,
          patch: 0,
        }).toString(),
      ));
    });

    it('should return correct response', async () => {
      await subject(
        event('This package is deprecated', {
          major: 1,
          minor: 0,
          patch: 0,
        }), {
          registry: 'https://example.com',
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

    context('storage put error', () => {
      beforeEach(() => {
        storageStub = {
          get: stub().returns(pkg.deprecate('This package is deprecated', {
            major: 1,
            minor: 0,
            patch: 0,
          })),
          put: stub().throws(new Error('Failed to put')),
        };
      });

      it('should return 500 response', async () => {
        await subject(
          event('This package is deprecated', {
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
