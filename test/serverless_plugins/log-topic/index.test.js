/* eslint-disable no-underscore-dangle */
import AWS from 'aws-sdk'; // eslint-disable-line import/no-extraneous-dependencies
import LogTopic from '../../../.serverless_plugins/log-topic';

describe('Plugin: LogTopic', () => {
  const createServerlessStub = (SNS, log) => ({
    getProvider: () => ({
      sdk: {
        SNS,
      },
    }),
    service: {
      provider: {
        environment: stub(),
      },
      service: 'foo',
    },
    processedInput: {
      options: {
        stage: 'bar',
      },
    },
    cli: {
      log,
    },
  });

  describe('#beforeDeploy()', () => {
    context('success', () => {
      let subject;
      let serverlessStub;
      let serverlessLogStub;
      let createTopicStub;

      beforeEach(() => {
        serverlessLogStub = stub();
        serverlessStub = createServerlessStub(
          spy(() => {
            createTopicStub = stub().returns({
              promise: () => Promise.resolve({ TopicArn: 'foo-bar-arn' }),
            });

            const awsSNSInstance = createStubInstance(AWS.SNS);
            awsSNSInstance.createTopic = createTopicStub;

            return awsSNSInstance;
          }), serverlessLogStub);

        subject = new LogTopic(serverlessStub);
      });

      it('should create topic correctly', async () => {
        await subject.beforeDeploy();

        assert(createTopicStub.calledWithExactly({
          Name: 'foo-bar-log',
        }));
      });

      it('should set environment variable logTopic', async () => {
        await subject.beforeDeploy();

        assert(serverlessStub
         .service
         .provider
         .environment
         .logTopic === 'foo-bar-arn',
        );
      });

      it('should log success', async () => {
        await subject.beforeDeploy();

        assert(serverlessLogStub.calledWithExactly('AWS Logging SNS Topic Created foo-bar-arn'));
      });
    });

    context('error', () => {
      let subject;
      let serverlessStub;
      let serverlessLogStub;
      let createTopicStub;

      beforeEach(() => {
        serverlessLogStub = stub();
        serverlessStub = createServerlessStub(
          spy(() => {
            createTopicStub = stub().returns({
              promise: () => Promise.reject(new Error('Create Failed')),
            });

            const awsSNSInstance = createStubInstance(AWS.SNS);
            awsSNSInstance.createTopic = createTopicStub;

            return awsSNSInstance;
          }), serverlessLogStub);

        subject = new LogTopic(serverlessStub);
      });

      it('should log error', async () => {
        try {
          await subject.beforeDeploy();
        } catch (err) {
          assert(serverlessLogStub.calledWithExactly('Could not create AWS Logging SNS Topic: Create Failed'));
        }
      });
    });
  });
});
