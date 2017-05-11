/* eslint-disable no-underscore-dangle */
import AWS from 'aws-sdk'; // eslint-disable-line import/no-extraneous-dependencies
import Subject from '../../src/adapters/s3';

describe('S3', () => {
  let awsSpy;
  let putObjectStub;
  let getObjectStub;
  let listObjectsV2Stub;

  beforeEach(() => {
    awsSpy = {
      S3: spy(() => {
        getObjectStub = stub().returns({ promise: () => Promise.resolve() });
        putObjectStub = stub().returns({ promise: () => Promise.resolve() });
        listObjectsV2Stub = stub().returns({ promise: () => Promise.resolve({ Contents: ['foo-key-1', 'foo-key-2'] }) });

        const awsS3Instance = createStubInstance(AWS.S3);
        awsS3Instance.putObject = putObjectStub;
        awsS3Instance.getObject = getObjectStub;
        awsS3Instance.listObjectsV2 = listObjectsV2Stub;

        return awsS3Instance;
      }),
    };

    Subject.__Rewire__('AWS', awsSpy);
  });

  describe('#listAllKeys()', () => {
    it('should call AWS with correct parameters', async () => {
      const subject = new Subject({
        region: 'foo-region',
        bucket: 'bar-bucket',
      });

      await subject.listAllKeys();

      assert(listObjectsV2Stub.calledWithExactly({
        ContinuationToken: null,
      }));
    });

    it('should return an array of keys', async () => {
      const subject = new Subject({
        region: 'foo-region',
        bucket: 'bar-bucket',
      });

      const result = await subject.listAllKeys();

      assert(result, ['foo-key-1', 'foo-key-2']);
    });
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
        }));
      });
    });
  });

  afterEach(() => {
    Subject.__ResetDependency__('AWS');
  });
});
