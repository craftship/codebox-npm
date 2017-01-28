jest.mock('github');

const handler = require('../put');

describe('PUT /registry/-/user/{id}', () => {
  let callback;
  let subject;

  beforeEach(() => {
    callback = jest.fn();
    subject = handler.default;
    process.env = {
      githubUrl: 'https://example.com/',
      githubClientId: 'client',
      githubSecret: 'secret',
    };
  });

  describe('user signs in for first time', () => {
    let event;

    beforeEach(() => {
      event = {
        body: '{"name":"first-time","password":"bar"}',
      };
    });

    it('should return token with correct response', async () => {
      await subject(event, jest.fn(), callback);

      expect(callback)
      .toHaveBeenCalledWith(null, {
        statusCode: 201,
        body: JSON.stringify({
          ok: true,
          token: 'first-token',
        }),
      });
    });
  });

  describe('user already logged in', () => {
    let event;

    beforeEach(() => {
      event = {
        body: '{"name":"logged-in","password":"bar"}',
      };
    });

    it('should return fresh token with correct response', async () => {
      await subject(event, jest.fn(), callback);

      expect(callback)
      .toHaveBeenCalledWith(null, {
        statusCode: 201,
        body: JSON.stringify({
          ok: true,
          token: 'fresh-token',
        }),
      });
    });
  });

  describe('error occurs', () => {
    let event;

    beforeEach(() => {
      event = {
        body: '{"name":"error","password":"bar"}',
      };
    });

    it('should return correct error response', async () => {
      await subject(event, jest.fn(), callback);

      expect(callback)
      .toHaveBeenCalledWith(null, {
        statusCode: 500,
        body: JSON.stringify({
          ok: false,
          error: 'Error occured creating token.',
        }),
      });
    });
  });
});
