const path = require('path');

module.exports = {
  name: 'JS',
  entry: [
    path.join(__dirname, 'index.js')
  ],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'client.js'
  },
  module: {
    rules: [{
      test: /\.jsx?$/,
      use: [{
        loader: 'babel-loader',
        options: {
          presets: [
            'babel-preset-es2015',
            'babel-preset-react'
          ]
        }
      }]
    }]
  }
};
