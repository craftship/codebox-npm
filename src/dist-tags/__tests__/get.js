jest.mock('node-fetch');
jest.mock('aws-sdk');

const handler = require('../get');

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
        pathParameters: {
          name: 'private-foo',
        },
      };
    });

    it('should return package json from private registry', async () => {
      await subject(event, jest.fn(), callback);

      expect(callback)
      .toHaveBeenCalledWith(null, {
        statusCode: 200,
        body: JSON.stringify({ latest: '1.0.0' }),
      });
    });
  });

  describe('package is not in private registry', () => {
    describe('is available on npm', () => {
      let event;

      beforeEach(() => {
        event = {
          pathParameters: {
            name: 'bar',
          },
        };
      });

      it('should return package json from npm', async () => {
        await subject(event, jest.fn(), callback);

        expect(callback)
        .toHaveBeenCalledWith(null, {
          statusCode: 200,
          body: JSON.stringify({ latest: '1.0.0' }),
        });
      });
    });

    describe('is not available on npm', () => {
      let event;

      beforeEach(() => {
        event = {
          pathParameters: {
            name: 'not-found',
          },
        };
      });

      it('should return error with status code', async () => {
        await subject(event, jest.fn(), callback);

        expect(callback)
        .toHaveBeenCalledWith(null, {
          statusCode: 404,
          body: JSON.stringify({
            ok: false,
            error: 'Could Not Get Package: https://example.com/not-found',
          }),
        });
      });
    });
  });

  describe('private registry storage throws uknown error', () => {
    let event;

    beforeEach(() => {
      event = {
        pathParameters: {
          name: 'uknown-error',
        },
      };
    });

    it('should return correct error response', async () => {
      await subject(event, jest.fn(), callback);

      expect(callback)
      .toHaveBeenCalledWith(null, {
        statusCode: 500,
        body: JSON.stringify({
          ok: false,
          error: 'Could not find key',
        }),
      });
    });
  });
});
