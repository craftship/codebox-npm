import { execFile as exec } from 'child_process';
import helpers from './helpers';

describe('npm', () => {
  context('get registry', () => {
    it('should use private registry', (done) => {
      exec('npm', ['get', 'registry'], { env: process.env }, (_, stdout) => {
        assert(!stdout.includes('registry.npmjs.org'));
        done();
      });
    });
  });

  context('publish <pkg>', () => {
    afterEach(async () => helpers.package.delete());

    it('should not allow a re-publish', (done) => {
      exec('npm', ['publish', './integration/test-package'], () => {
        exec('npm', ['publish', './integration/test-package'], (_, stdout) => {
          assert(!stdout.includes('test-package@1.0.0'));
          done();
        });
      });
    });

    it('should publish a new package correctly', (done) => {
      exec('npm', ['publish', './integration/test-package'], (_, stdout) => {
        assert(stdout.includes('test-package@1.0.0'));
        done();
      });
    });
  });

  context('dist-tags', () => {
    beforeEach(async () => helpers.package.publish());

    it('should list tags correctly', (done) => {
      exec('npm', ['dist-tags', 'add', 'test-package@1.0.0', 'alpha'], (_, stdout) => {
        assert(stdout.includes('alpha'));
        done();
      });
    });

    it('should add tag correctly', (done) => {
      exec('npm', ['dist-tags', 'add', 'test-package@1.0.0', 'alpha'], (_, stdout) => {
        assert(stdout.includes('+alpha: test-package@1.0.0'));
        done();
      });
    });

    it('should rm tag correctly', (done) => {
      exec('npm', ['dist-tags', 'add', 'test-package@1.0.0', 'alpha'], () => {
        exec('npm', ['dist-tags', 'rm', 'test-package', 'alpha'], (_, stdout) => {
          assert(stdout.includes('-alpha: test-package@1.0.0'));
          done();
        });
      });
    });

    afterEach(async () => helpers.package.delete());
  });

  context('info', () => {
    it('should return package json ok', (done) => {
      exec('npm', ['info', 'serverless'], { env: process.env }, (error, stdout) => {
        assert(stdout.includes('name: \'serverless\''));
        done();
      });
    });
  });
});
