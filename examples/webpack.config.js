const Pipeline = require('asset-webpack');
const List = require('asset-list');
const path = require('path');

module.exports = {
  entry: path.join(__dirname, 'index.js'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'output.js'
  },

  module: {
    loaders: [
      { test: /\.svg$/, loaders: ['file-loader'] }
    ]
  },

  plugins: [
    new Pipeline('bundle.svgs', {
      //
      // Set to `true` if you want to use the folder structure of the files as
      // basic namespacing.
      //
      namespace: true,

      plugins: [
        [List, {
          //
          // `asset-list` options here.
          //
        }]
      ]
    })
  ]
};
