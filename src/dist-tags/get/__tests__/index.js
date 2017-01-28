jest.mock('node-fetch');
jest.mock('aws-sdk');

const handler = require('../');

describe('GET /registry/-/package/{name}/dist-tags', () => {
  let callback;
  let subject;

  beforeEach(() => {
    callback = jest.fn();
    subject = handler.default;
    process.env = {
      registry: 'https://example.com/',
      bucket: 'foo',
      region: 'bar',
    };
  });

  describe('package is in private registry', () => {
    let event;

    beforeEach(() => {
      event = {
        path: {
          name: 'private-foo',
        },
      };
    });

    it('should return package json from private registry', async () => {
      await subject(event, jest.fn(), callback);

      expect(callback)
      .toHaveBeenCalledWith(null, { latest: '1.0.0' });
    });
  });

  describe('package is not in private registry', () => {
    describe('is available on npm', () => {
      let event;

      beforeEach(() => {
        event = {
          path: {
            name: 'bar',
          },
        };
      });

      it('should return package json from npm', async () => {
        await subject(event, jest.fn(), callback);

        expect(callback)
        .toHaveBeenCalledWith(null, { latest: '1.0.0' });
      });
    });

    describe('is not available on npm', () => {
      let event;

      beforeEach(() => {
        event = {
          path: {
            name: 'not-found',
          },
        };
      });

      it('should return error with status code', async () => {
        await subject(event, jest.fn(), callback);

        expect(callback)
        .toHaveBeenCalledWith(null, {
          ok: false,
          error: '[404] Could Not Get Package: https://example.com/not-found',
        });
      });
    });
  });

  describe('private registry storage throws uknown error', () => {
    let event;

    beforeEach(() => {
      event = {
        path: {
          name: 'uknown-error',
        },
      };
    });

    it('should return correct error response', async () => {
      await subject(event, jest.fn(), callback);

      expect(callback)
      .toHaveBeenCalledWith(null, {
        ok: false,
        error: 'Could not find key',
      });
    });
  });
});
