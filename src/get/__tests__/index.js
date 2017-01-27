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
        path: {
          name: 'private-foo',
        },
      };
    });

    it('should return correct response', async () => {
      await subject(event, jest.fn(), callback);

      expect(callback)
      .toHaveBeenCalledWith(null, { name: 'private-foo' });
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

      it('should package from npm', async () => {
        await subject(event, jest.fn(), callback);

        expect(callback)
        .toHaveBeenCalledWith(null, { name: 'bar' });
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
        .toHaveBeenCalledWith(new Error('[404] Could Not Get Package: https://example.com/not-found'));
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

    it('should return error with status code', async () => {
      await subject(event, jest.fn(), callback);

      expect(callback)
      .toHaveBeenCalledWith(new Error('Could not find key'));
    });
  });
});
