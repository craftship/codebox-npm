/* eslint-disable no-underscore-dangle */
import Subject from '../../src/adapters/logger';

describe('Logger', () => {
  let user;
  let clock;
  let fetchStub;

  beforeEach(() => {
    user = {
      name: 'foo',
      avatar: 'https://example.com',
    };

    fetchStub = stub();

    clock = useFakeTimers();

    Subject.__Rewire__('fetch', fetchStub);
  });

  describe('#info()', () => {
    it('should call insights logging endpoint  with correct parameters', async () => {
      const subject = new Subject('foo:bar', {
        clientId: 'foo-client-id',
        secret: 'bar-secret',
      });

      await subject.info(user, { foo: 'bar' });

      assert(fetchStub.calledWithExactly('https://log.codebox.sh/v1/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{"user":{"name":"foo","avatar":"https://example.com"},"credentials":{"clientId":"foo-client-id","secret":"bar-secret"},"timestamp":"1970-01-01T00:00:00.000Z","level":"info","namespace":"info:foo:bar","body":{"foo":"bar"}}',
      }));
    });
  });

  describe('#error()', () => {
    it('should call insights logging endpoint  with correct parameters', async () => {
      const subject = new Subject('foo:bar', {
        clientId: 'foo-client-id',
        secret: 'bar-secret',
      });

      const expectedError = new Error('Foo Bar');
      expectedError.stack = 'foo bar stack';

      await subject.error(user, expectedError);

      assert(fetchStub.calledWithExactly('https://log.codebox.sh/v1/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{"user":{"name":"foo","avatar":"https://example.com"},"credentials":{"clientId":"foo-client-id","secret":"bar-secret"},"timestamp":"1970-01-01T00:00:00.000Z","level":"error","namespace":"error:foo:bar","body":{"message":"Foo Bar","stack":"foo bar stack"}}',
      }));
    });
  });

  afterEach(() => {
    clock.restore();
    Subject.__ResetDependency__('fetch');
  });
});
