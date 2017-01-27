const packages = {
  foo: { name: 'foo', 'dist-tags': { latest: '1.0.0' } },
  bar: { name: 'bar', 'dist-tags': { latest: '1.0.0' } },
};

export default (url) => {
  const name = url.split('/').slice(-1)[0];
  const pkg = packages[name];

  return {
    ok: !!pkg,
    status: pkg ? 200 : 404,
    json: () => Promise.resolve(pkg),
  };
};
