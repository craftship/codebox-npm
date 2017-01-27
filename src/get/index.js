import fetch from 'node-fetch';

require('../bootstrap');

const npm = async (registry, name) => {
  const response = await fetch(`${registry}${name}`);

  if (!response.ok) {
    throw new Error(`[${response.status}] Could Not Get Package: ${registry}${name}`);
  }

  return response.json();
};

export default async ({ path }, context, callback) => {
  try {
    const data = await npm(process.env.registry, path.name);
    return callback(null, data);
  } catch (error) {
    return callback(error);
  }
};
