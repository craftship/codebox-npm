jest.mock('node-fetch');
jest.mock('aws-sdk');

const handler = require('../');

describe('/registry/{name}', () => {
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

    it('should return correct response', async () => {
      await subject(event, jest.fn(), callback);

      expect(callback)
      .toHaveBeenCalledWith(null, {
        statusCode: 200,
        body: JSON.stringify({
          name: 'private-foo',
          'dist-tags': {
            latest: '1.0.0',
          },
        }),
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

      it('should package from npm', async () => {
        await subject(event, jest.fn(), callback);

        expect(callback)
        .toHaveBeenCalledWith(null, {
          statusCode: 200,
          body: JSON.stringify({
            name: 'bar',
            'dist-tags': {
              latest: '1.0.0',
            },
          }),
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

    it('should return error with status code', async () => {
      await subject(event, jest.fn(), callback);

      expect(callback)
      .toHaveBeenCalledWith(null, {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Could not find key',
        }),
      });
    });
  });
});
