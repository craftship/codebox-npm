export default class {
  constructor() {
    let credentials = {};

    this.authenticate = (creds) => {
      credentials = creds;
    };

    this.authorization = {};
    this.authorization.getOrCreateAuthorizationForApp = (opts) => {
      switch(credentials.username) {
        case 'error':
          throw new Error('Error occured creating token.');
        case 'first-time':
          return { token: 'first-token' };
        case 'logged-in':
          // GitHub will not return a token if one already exists
          // for security reasons.
          return { token: '' };
      }
    };
    this.authorization.create = (opts) => ({ token: 'fresh-token' });
    this.authorization.delete = (opts) => ({});
  }
};
