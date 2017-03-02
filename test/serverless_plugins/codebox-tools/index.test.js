/* eslint-disable no-underscore-dangle */
import AWS from 'aws-sdk'; // eslint-disable-line import/no-extraneous-dependencies
import CodeboxTools from '../../../.serverless_plugins/codebox-tools';

describe('Plugin: CodeboxTools', () => {
  const createServerlessStub = (S3, log) => ({
    getProvider: () => ({
      sdk: {
        S3,
      },
    }),
    cli: {
      log,
    },
    service: {
      resources: {
        Resources: {
          PackageStorage: {
            Properties: {
              BucketName: 'foo-bucket',
            },
          },
        },
      },
    },
  });

  describe('#migrate()', () => {
    context('has no keys', () => {
      let subject;
      let serverlessStub;
      let serverlessLogStub;
      let listObjectsStub;

      beforeEach(() => {
        serverlessLogStub = stub();
        serverlessStub = createServerlessStub(
          spy(() => {
            listObjectsStub = stub().returns({
              promise: () => Promise.resolve({
                IsTruncated: false,
                Contents: [],
              }),
            });

            const awsS3Instance = createStubInstance(AWS.S3);
            awsS3Instance.listObjectsV2 = listObjectsStub;

            return awsS3Instance;
          }), serverlessLogStub);

        subject = new CodeboxTools(serverlessStub, { host: 'bar' });
      });

      it('should request keys correctly', async () => {
        await subject.migrate();

        assert(listObjectsStub.calledWithExactly({
          Bucket: 'foo-bucket',
          ContinuationToken: undefined,
        }));
      });
    });

    context('has keys', () => {
      let subject;
      let serverlessStub;
      let serverlessLogStub;
      let putObjectStub;
      let listObjectsStub;
      let getObjectStub;

      beforeEach(() => {
        serverlessLogStub = stub();
        serverlessStub = createServerlessStub(
          spy(() => {
            putObjectStub = stub().returns({
              promise: () => Promise.resolve(),
            });

            listObjectsStub = stub().returns({
              promise: () => Promise.resolve({
                IsTruncated: false,
                Contents: [{
                  Key: 'foo/index.json',
                }],
              }),
            });

            getObjectStub = stub().returns({
              promise: () => Promise.resolve({
                Body: new Buffer('{"versions":{"1.0.0":{"name":"foo", "dist":{"tarball":"http://old-host/registry/foo/-/bar-1.0.0.tgz"}}}}'),
              }),
            });

            const awsS3Instance = createStubInstance(AWS.S3);
            awsS3Instance.listObjectsV2 = listObjectsStub;
            awsS3Instance.putObject = putObjectStub;
            awsS3Instance.getObject = getObjectStub;

            return awsS3Instance;
          }), serverlessLogStub);

        subject = new CodeboxTools(serverlessStub, { host: 'example.com' });
      });

      it('should store updated packages correctly', async () => {
        await subject.migrate();

        assert(putObjectStub.calledWithExactly({
          Bucket: 'foo-bucket',
          Key: 'foo/index.json',
          Body: '{"versions":{"1.0.0":{"name":"foo","dist":{"tarball":"https://example.com/registry/foo/-/bar-1.0.0.tgz"}}}}',
        }));
      });

      it('should request keys correctly', async () => {
        await subject.migrate();

        assert(listObjectsStub.calledWithExactly({
          Bucket: 'foo-bucket',
          ContinuationToken: undefined,
        }));
      });
    });

    context('error', () => {
      let subject;
      let serverlessStub;
      let serverlessLogStub;
      let listObjectsStub;

      beforeEach(() => {
        serverlessLogStub = stub();
        serverlessStub = createServerlessStub(
          spy(() => {
            listObjectsStub = stub().returns({
              promise: () => Promise.reject(new Error('Domain Migration Error')),
            });

            const awsS3Instance = createStubInstance(AWS.S3);
            awsS3Instance.listObjectsV2 = listObjectsStub;

            return awsS3Instance;
          }), serverlessLogStub);

        subject = new CodeboxTools(serverlessStub, { host: 'example.com' });
      });

      it('should log error correctly', async () => {
        try {
          await subject.migrate();
        } catch (err) {
          assert(serverlessLogStub.calledWithExactly('Domain update failed for example.com'));
        }
      });
    });
  });
});
