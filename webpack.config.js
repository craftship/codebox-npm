const nodeExternals = require('webpack-node-externals');
const path = require('path');

module.exports = {
  target: 'node',
  externals: [nodeExternals()],
  entry: {
    authorizerGithub: ['./bootstrap', './src/authorizers/github.js'],
    put: ['./bootstrap', './src/put/index.js'],
    get: ['./bootstrap', './src/get/index.js'],
    distTagsGet: ['./bootstrap', './src/dist-tags/get.js'],
    distTagsPut: ['./bootstrap', './src/dist-tags/put.js'],
    distTagsDelete: ['./bootstrap', './src/dist-tags/delete.js'],
    userPut: ['./bootstrap', './src/user/put.js'],
    userDelete: ['./bootstrap', './src/user/delete.js'],
    whoamiGet: ['./bootstrap', './src/whoami/get.js'],
    tarGet: ['./bootstrap', './src/tar/get.js'],
  },
  output: {
    libraryTarget: 'commonjs',
    path: path.join(__dirname, '.webpack'),
    filename: '[name].js',
  },
  module: {
    loaders: [{
      test: /\.js$/,
      loader: 'babel',
      include: /src/,
      exclude: /node_modules/,
    },
    {
      test: /\.json$/,
      loader: 'json-loader',
    }],
  },
};
