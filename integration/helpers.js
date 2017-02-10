/* eslint-disable import/no-extraneous-dependencies */
import AWS from 'aws-sdk';
import { execFile as exec } from 'child_process';

const S3 = new AWS.S3({
  signatureVersion: 'v4',
});

export default {
  package: {
    publish: () =>
      new Promise((resolve) => {
        exec('npm', ['publish', './integration/test-package'], () => {
          resolve();
        });
      }),
    delete: async () => {
      const fixture = 'test-package';
      let stage = 'integration';

      if (process.env.CIRCLE_SHA1) {
        stage = `${process.env.CIRCLE_SHA1.substring(0, 8)}${process.env.CIRCLE_NODE_INDEX || ''}`;
      }

      const bucket = `${process.env.YITH_BUCKET}-${stage}`;

      let items;
      try {
        items = await S3.listObjectsV2({
          Bucket: bucket,
          Prefix: fixture,
        }).promise();
      } catch (err) {
        throw new Error(`Could not list S3 objects for ${bucket}`);
      }

      items.Contents.forEach(async (item) => {
        try {
          await S3.deleteObject({
            Bucket: bucket,
            Key: item.Key,
          }).promise();
        } catch (err) {
          throw new Error(`Could not delete S3 object ${item.Key}`);
        }
      });

      try {
        await S3.deleteObject({
          Bucket: bucket,
          Key: fixture,
        }).promise();
      } catch (err) {
        throw new Error(`Could not delee test package from ${bucket}`);
      }
    },
  },
};
