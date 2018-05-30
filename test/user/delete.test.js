/* eslint-disable no-underscore-dangle */
import GitHub from '@octokit/rest';
import subject from '../../src/user/delete';

describe('DELETE /registry/-/user/token/{token}', () => {
  let event;
  let callback;
  let gitHubSpy;
  let gitHubInstance;

  beforeEach(() => {
    const env = {
      githubClientId: 'foo-client-id',
      githubSecret: 'bar-secret',
      githubUrl: 'https://example.com',
      restrictedOrgs: 'foo-org',
    };

    process.env = env;

    callback = stub();
  });

  describe('logout', () => {
    context('with valid token', () => {
      let authStub;
      let resetAuthStub;

      beforeEach(() => {
        event = {
          pathParameters: {
            token: 'foo-token',
          },
        };

        gitHubSpy = spy(() => {
          gitHubInstance = createStubInstance(GitHub);
          authStub = stub();
          resetAuthStub = stub();

          gitHubInstance.authenticate = authStub;
          gitHubInstance.authorization = {
            reset: resetAuthStub,
          };

          return gitHubInstance;
        });

        subject.__Rewire__({
          GitHub: gitHubSpy,
        });
      });

      it('should authenticate using app credentials with github', async () => {
        await subject(event, stub(), callback);

        assert(authStub.calledWithExactly({
          type: 'basic',
          username: 'foo-client-id',
          password: 'bar-secret',
        }));
      });

      it('should reset token with github', async () => {
        await subject(event, stub(), callback);

        assert(resetAuthStub.calledWithExactly({
          client_id: 'foo-client-id',
          access_token: 'foo-token',
        }));
      });

      it('should return 200 response', async () => {
        await subject(event, stub(), callback);

        assert(callback.calledWithExactly(null, {
          statusCode: 200,
          body: '{"ok":true}',
        }));
      });

      afterEach(() => {
        subject.__ResetDependency__('GitHub');
      });
    });

    context('with invalid token', () => {
      let authStub;
      let resetAuthStub;

      beforeEach(() => {
        event = {
          pathParameters: {
            token: 'foo-bad-token',
          },
        };

        gitHubSpy = spy(() => {
          gitHubInstance = createStubInstance(GitHub);
          authStub = stub();
          resetAuthStub = stub().throws(new Error('Invalid token'));

          gitHubInstance.authenticate = authStub;
          gitHubInstance.authorization = {
            reset: resetAuthStub,
          };

          return gitHubInstance;
        });

        subject.__Rewire__({
          GitHub: gitHubSpy,
        });
      });

      it('should authenticate using app credentials with github', async () => {
        await subject(event, stub(), callback);

        assert(authStub.calledWithExactly({
          type: 'basic',
          username: 'foo-client-id',
          password: 'bar-secret',
        }));
      });

      it('should return a 500 error', async () => {
        await subject(event, stub(), callback);

        assert(callback.calledWithExactly(null, {
          statusCode: 500,
          body: '{"ok":false,"error":"Invalid token"}',
        }));
      });

      afterEach(() => {
        subject.__ResetDependency__('GitHub');
      });
    });
  });
});
