import fetch from 'node-fetch';

export default class Logger {
  constructor(cmd, namespace, credentials = {}) {
    this.command = cmd;
    this.namespace = namespace;
    this.credentials = credentials;
  }

  async publish(json) {
    if (this.credentials.clientId && this.credentials.secret) {
      await fetch('https://log.codebox.sh/v1/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.credentials.clientId}:${this.credentials.secret}`,
        },
        body: JSON.stringify(json),
      });
    }
  }

  async error(user, { stack, message }) {
    const json = {
      user,
      timestamp: new Date(),
      level: 'error',
      namespace: `error:${this.namespace}`,
      command: this.command,
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
      timestamp: new Date(),
      level: 'info',
      namespace: `info:${this.namespace}`,
      command: this.command,
      body: message,
    };

    return this.publish(json);
  }
}
