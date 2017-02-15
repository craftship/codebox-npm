import fetch from 'node-fetch';

export default {
  package: async (registry, name) => {
    const response = await fetch(`${registry}${name}`);

    if (!response.ok) {
      const error = new Error(`Could Not Find Package: ${registry}${name}`);
      error.status = response.status;
      throw error;
    }

    return response.json();
  },
  tar: async (registry, name) => {
    const response = await fetch(`${registry}${name}`);

    if (!response.ok) {
      const error = new Error(`Could Not Find Tar: ${registry}${name}`);
      error.status = response.status;
      throw error;
    }

    return response.buffer();
  },
};
