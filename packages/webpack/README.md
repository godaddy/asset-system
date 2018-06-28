# asset-webpack

A WebPack plugin that combines all your SVG assets into a `asset-provider`
compatible bundle.

## Table of Contents

- [Install](#install)
- [Usage](#usage)
  - [Specify the `file-loader` for .svg extensions](#specify-the-file-loader-for-svg-extensions)
  - [Configure plugin](#configure-plugin)
  - [Producing a bundle](#producing-a-bundle)
- [License](#license)

## Install

The following dependencies need to be installed:

- `file-loader` For loading SVG files.
- `asset-webpack` The actual plugin.

```
npm install --save asset-webpack file-loader
```

## Usage

Import the loader in to your `webpack.config.js`:

```js
import SVGBundler from 'asset-webpack';
```

### Specify the `file-loader` for .svg extensions

First we need to ensure that `.svg` files are handled as normal, static, files.
This is done by specifying a `file-loader` for the given extension. Update the
module loaders to contain the following:

```js
module: {
  loaders: [
    { test: /\.svg$/, loaders: [ 'file-loader' ] }
  ]
}
```

### Configure plugin

The plugin supplied in the `plugin` array of your `webpack.config.js`:

```js
{
  ...,
  plugins: [
    new SVGBundler('bundle.svgs', { /* opts */ })
  ]
}
```

The first argument is the name the bundle. It should be single file name, and
it will be placed in the output directory that you specified in the WebPack
configuration. The filename supports the following (template) replacements:

- `[hash]` Will be replaced with a MD5 hash of the resulting bundle.

The second argument is an **options** object that allows you to further
configure the plugin, and the bundle system. The following options are
supported:

- `namespace` Should we use the folder structure of the assets as namespaces,
  defaults to `false`.
- `root` Location of the root directory that used to generate the namespaces.
- `bundler` Options that will be passed in to the `asset-bundle` constructor.
- `modify` An object where the key is the name of the modifer and the value the
  function that does the modification. This will be passed in to `bundle#modify`.
- `plugins` Plugins that need to be assigned to the `asset-bundle` instance.
  The plugins option should be an `Array` of arrays which is spread on the
  `bundle#plugin` method.


```js
  ...
  namespace: true,
  bundler: {
    multipass: true,
  },
  modify: {
    color: function () { .. }
  },
  plugins: [
    [Constructor, { options }, args, etc],
    [Constructor, { options }, args, etc]
  ]
  ...
```

### Producing a bundle

Create the `entry` file that requires the SVG assets:

```js
require('./file.svg');
require('./another.svg');
require('./more.svg');
```

In addition to producing the bundled SVG, we've also rewritten the contents of
the required file. The file will now return the `name` of your SVG how it's
stored inside the bundle.

```js
import Provider, { Asset } from 'asset-provider';
import React, { Component } from 'react';
import upload from './upload.svg';
import file from './file.svg';

export default class Example extends Component {
  render() {
    return (
      <Provider uri='http://url.com/bundle.svgs'>
        <div>
          <h1>Upload <Asset name={ file } /></h1>

          <label>
            Upload file: <input type='file' name='file' />
          </label>

          <button> Upload <Asset name={ upload } /></button>
        </div>
      </Provider>
    );
  }
}
```

## License

[MIT](LICENSE)
