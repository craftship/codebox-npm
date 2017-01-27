jest.mock('node-fetch');

const handler = require('../');

describe('/registry/{name}', () => {
  let callback;
  let subject;

  beforeEach(() => {
    callback = jest.fn();
    subject = handler.default;
    process.env.registry = 'https://example.com/';
  });

  describe('package exists', () => {
    let event;

    beforeEach(() => {
      event = {
        path: {
          name: 'foo',
        },
      };
    });

    it('should return correct response', async () => {
      await subject(event, jest.fn(), callback);

      expect(callback)
        .toHaveBeenCalledWith(null, { name: 'foo' });
    });
  });

  describe('package does not exist', () => {
    let event;

    beforeEach(() => {
      event = {
        path: {
          name: 'not-found',
        },
      };
    });

    it('should return error response with status code', async () => {
      await subject(event, jest.fn(), callback);

      expect(callback)
        .toHaveBeenCalledWith(new Error('[404] Could Not Get Package: https://example.com/not-found'));
    });
  });
});
