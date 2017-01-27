var path = require('path');

module.exports = {
  target: 'node',
  entry: {
    get: ['babel-polyfill', './src/get/index.js'],
  },
  output: {
    libraryTarget: 'commonjs',
    path: path.join(__dirname, '.webpack'),
    filename: '[name].js'
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
      loader: 'json-loader'
    }]
  },
};
