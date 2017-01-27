const packages = {
  foo: { name: 'foo' },
  bar: { name: 'bar' },
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
