import fetch from 'node-fetch';

export default async (registry, name) => {
  const response = await fetch(`${registry}${name}`);

  if (!response.ok) {
    throw new Error(`[${response.status}] Could Not Get Package: ${registry}${name}`);
  }

  return response.json();
};
