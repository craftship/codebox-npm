/* eslint-disable no-underscore-dangle */
import subject from '../../src/adapters/npm';

describe('NPM', () => {
  describe('#tar()', () => {
    context('does not exist', () => {
      let fetchStub;

      beforeEach(() => {
        fetchStub = stub().returns({
          ok: false,
          status: 404,
        });

        subject.__Rewire__('fetch', fetchStub);
      });

      it('throw correct error', async () => {
        try {
          await subject.tar(
            'https://example.com/',
            'foo-tar',
          );
        } catch (error) {
          assert.equal(error.status, 404);
          assert.equal(error.message, 'Could Not Find Tar: https://example.com/foo-tar');
        }
      });

      afterEach(() => {
        subject.__ResetDependency__('fetch');
      });
    });

    context('exists', () => {
      const expected = new Buffer('foo');
      let fetchStub;

      beforeEach(() => {
        fetchStub = stub().returns({
          ok: true,
          buffer: () => Promise.resolve(expected),
        });

        subject.__Rewire__('fetch', fetchStub);
      });

      it('should return buffer', async () => {
        const actual = await subject.tar(
          'https://example.com',
          'foo-package',
        );

        assert.equal(actual, expected);
      });

      afterEach(() => {
        subject.__ResetDependency__('fetch');
      });
    });
  });

  describe('#package()', () => {
    context('does not exist', () => {
      let fetchStub;

      beforeEach(() => {
        fetchStub = stub().returns({
          ok: false,
          status: 404,
        });

        subject.__Rewire__('fetch', fetchStub);
      });

      it('throw correct error', async () => {
        try {
          await subject.package(
            'https://example.com/',
            'foo-package',
          );
        } catch (error) {
          assert.equal(error.status, 404);
          assert.equal(error.message, 'Could Not Find Package: https://example.com/foo-package');
        }
      });

      afterEach(() => {
        subject.__ResetDependency__('fetch');
      });
    });

    context('exists', () => {
      const expected = { name: 'foo-package' };
      let fetchStub;

      beforeEach(() => {
        fetchStub = stub().returns({
          ok: true,
          json: () => Promise.resolve(expected),
        });

        subject.__Rewire__('fetch', fetchStub);
      });

      it('should return json', async () => {
        const actual = await subject.package(
          'https://example.com',
          'foo-package',
        );

        assert.equal(actual, expected);
      });

      afterEach(() => {
        subject.__ResetDependency__('fetch');
      });
    });
  });
});
