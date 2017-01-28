jest.mock('node-fetch');
jest.mock('aws-sdk');

const handler = require('../');

describe('registry/-/package/{name}/dist-tags/{tag}', () => {
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
          tag: 'latest',
        },
      };
    });

    it('should return package json from private registry', async () => {
      await subject(event, jest.fn(), callback);

      expect(callback)
      .toHaveBeenCalledWith(null, {
        ok: true,
        id: 'private-foo',
        'dist-tags': {},
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
