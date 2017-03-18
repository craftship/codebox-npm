import fetch from 'node-fetch';

export default class Logger {
  constructor(namespace, credentials = {}) {
    this.namespace = namespace;
    this.credentials = credentials;
  }

  async publish(json) {
    if (this.credentials.clientId && this.credentials.secret) {
      await fetch('https://log.codebox.sh/v1/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(json),
      });
    }
  }

  async error(user, { stack, message }) {
    const json = {
      user,
      credentials: this.credentials,
      timestamp: new Date(),
      level: 'error',
      namespace: `error:${this.namespace}`,
      body: {
        message,
        stack,
      },
    };

    return this.publish(json);
  }

  async info(user, message) {
    const json = {
      user,
      credentials: this.credentials,
      timestamp: new Date(),
      level: 'info',
      namespace: `info:${this.namespace}`,
      body: message,
    };

    return this.publish(json);
  }
}
