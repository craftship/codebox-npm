import fetch from 'node-fetch';

export default async (registry, name) => {
  const response = await fetch(`${registry}${name}`);

  if (!response.ok) {
    const error = new Error(`Could Not Get Package: ${registry}${name}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
};
