/* eslint-disable no-underscore-dangle */
import AWS from 'aws-sdk'; // eslint-disable-line import/no-extraneous-dependencies
import RemoveStorageBucket from '../../../.serverless_plugins/remove-storage';

describe('Plugin: RemoveStorageBucket', () => {
  describe('#beforeRemove()', () => {
    context('success', () => {
      let subject;
      let serverlessStub;
      let serverlessLogStub;
      let deleteBucketStub;

      beforeEach(() => {
        serverlessLogStub = stub();
        serverlessStub = {
          getProvider: () => ({
            sdk: {
              S3: spy(() => {
                deleteBucketStub = stub().returns({ promise: () => Promise.resolve() });

                const awsS3Instance = createStubInstance(AWS.S3);
                awsS3Instance.deleteBucket = deleteBucketStub;

                return awsS3Instance;
              }),
            },
          }),
          cli: {
            log: serverlessLogStub,
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
        };

        subject = new RemoveStorageBucket(serverlessStub);
      });

      it('should call aws delete bucket correctly', async () => {
        await subject.beforeRemove();

        assert(deleteBucketStub.calledWithExactly({
          Bucket: 'foo-bucket',
        }));
      });

      it('should log it was a success', async () => {
        await subject.beforeRemove();

        assert(serverlessLogStub.calledWithExactly('AWS Package Storage Removed'));
      });
    });

    context('error', () => {
      let subject;
      let serverlessStub;
      let serverlessLogStub;
      let deleteBucketStub;

      beforeEach(() => {
        serverlessLogStub = stub();
        serverlessStub = {
          getProvider: () => ({
            sdk: {
              S3: spy(() => {
                deleteBucketStub = stub().returns({
                  promise: () => Promise.reject(new Error('Removal Error')),
                });

                const awsS3Instance = createStubInstance(AWS.S3);
                awsS3Instance.deleteBucket = deleteBucketStub;

                return awsS3Instance;
              }),
            },
          }),
          cli: {
            log: serverlessLogStub,
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
        };

        subject = new RemoveStorageBucket(serverlessStub);
      });

      it('should log error correctly', async () => {
        try {
          await subject.beforeRemove();
        } catch (err) {
          assert(serverlessLogStub.calledWithExactly('Could not remove AWS package storage: Removal Error'));
        }
      });
    });
  });
});
