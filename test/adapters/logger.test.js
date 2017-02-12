/* eslint-disable no-underscore-dangle */
import AWS from 'aws-sdk'; // eslint-disable-line import/no-extraneous-dependencies
import Subject from '../../src/adapters/logger';

describe('Logger', () => {
  let clock;
  let awsSpy;
  let publishStub;

  beforeEach(() => {
    awsSpy = {
      SNS: spy(() => {
        publishStub = stub().returns({ promise: () => Promise.resolve() });

        const awsSNSInstance = createStubInstance(AWS.S3);
        awsSNSInstance.publish = publishStub;

        return awsSNSInstance;
      }),
    };

    clock = useFakeTimers();

    Subject.__Rewire__('AWS', awsSpy);
  });

  describe('#info()', () => {
    it('should call AWS with correct parameters', async () => {
      const subject = new Subject('foo:bar', {
        region: 'foo-region',
        topic: 'bar-topic',
      });

      await subject.info({ foo: 'bar' });

      assert(publishStub.calledWithExactly({
        Message: '{"timestamp":"1970-01-01T00:00:00.000Z","level":"info","namespace":"info:foo:bar","body":{"foo":"bar"}}',
        TopicArn: 'bar-topic',
      }));
    });
  });

  describe('#error()', () => {
    it('should call AWS with correct parameters', async () => {
      const subject = new Subject('foo:bar', {
        region: 'foo-region',
        topic: 'bar-topic',
      });

      const expectedError = new Error('Foo Bar');
      expectedError.stack = 'foo bar stack';

      await subject.error(expectedError);

      assert(publishStub.calledWithExactly({
        Message: '{"timestamp":"1970-01-01T00:00:00.000Z","level":"error","namespace":"error:foo:bar","body":{"message":"Foo Bar","stack":"foo bar stack"}}',
        TopicArn: 'bar-topic',
      }));
    });
  });

  afterEach(() => {
    clock.restore();
    Subject.__ResetDependency__('AWS');
  });
});
