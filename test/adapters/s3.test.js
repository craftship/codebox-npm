/* eslint-disable no-underscore-dangle */
import AWS from 'aws-sdk'; // eslint-disable-line import/no-extraneous-dependencies
import Subject from '../../src/adapters/s3';

describe('S3', () => {
  let awsSpy;
  let putObjectStub;
  let getObjectStub;

  beforeEach(() => {
    awsSpy = {
      S3: spy(() => {
        getObjectStub = stub().returns({ promise: () => Promise.resolve() });
        putObjectStub = stub().returns({ promise: () => Promise.resolve() });

        const awsS3Instance = createStubInstance(AWS.S3);
        awsS3Instance.putObject = putObjectStub;
        awsS3Instance.getObject = getObjectStub;

        return awsS3Instance;
      }),
    };

    Subject.__Rewire__('AWS', awsSpy);
  });

  describe('#put()', () => {
    context('base64', () => {
      it('should call AWS with correct parameters', async () => {
        const subject = new Subject({
          region: 'foo-region',
          bucket: 'bar-bucket',
        });

        await subject.put('foo-key', 'test', 'base64');

        assert(putObjectStub.calledWithExactly({
          Key: 'foo-key',
          Body: new Buffer('test', 'base64'),
          ServerSideEncryption: 'AES256',
        }));
      });
    });

    context('string', () => {
      it('should call AWS with correct parameters', async () => {
        const subject = new Subject({
          region: 'foo-region',
          bucket: 'bar-bucket',
        });

        await subject.put('foo-key', 'test');

        assert(putObjectStub.calledWithExactly({
          Key: 'foo-key',
          Body: 'test',
          ServerSideEncryption: 'AES256',
        }));
      });
    });
  });

  afterEach(() => {
    Subject.__ResetDependency__('AWS');
  });
});
