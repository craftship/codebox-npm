/* eslint-disable no-underscore-dangle */
import subject from '../../src/whoami/get';

describe('GET /registry/-/whoami', () => {
  let event;
  let callback;

  beforeEach(() => {
    callback = stub();
  });

  describe('whoami', () => {
    beforeEach(() => {
      event = {
        requestContext: {
          authorizer: {
            username: 'foobar',
          },
        },
      };
    });

    it('should return correct username', async () => {
      await subject(event, stub(), callback);

      assert(callback.calledWithExactly(null, {
        statusCode: 200,
        body: '{"username":"foobar"}',
      }));
    });
  });
});
