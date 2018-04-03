# asset-list

Automatically generate markdown documentation of your generated
`asset-bundle` bundles.

## Table of contents

- [Installation](#installation)
- [Usage](#usage)
  - [Options](#options)
  - [asset-webpack](#asset-webpack)
  - [asset-bundle](#asset-bundle)
- [output](#output)
- [License](#license)

## Installation

```
npm install --save asset-list
```

## Usage

There are 2 different usage, directly with the `asset-bundle` module or as
part of the `asset-webpack`. Both use the same options, the only difference
is how you enable the plugin.

This documentation generation is a **synchronous** process, it will happen
**before** the completion callback is called of `asset-bundle`. And we will
automatically write the file to the same output directory that contains the
generated bundle.

So when you generate an `./dist/assets.svgs` this module will also add an
`./dist/assets.md` which contains the generated documentation.

### Options

The options should be supplied as an object, the following properties are
supported:

- `file` Path of where the bundle and documentation should be stored. When you
  using the `asset-webpack` this will be set automatically to the output
  path.
- `hosted` Indication that the SVG assets should reference a hosted server
  instead of a local, relative file path to the asset.
- `separator` The separator that is used to indicate namespaces/categories in
  asset names. Defaults to `require('path').sep` so it's a folder separator.

### `asset-webpack`

When using `asset-webpack` you can use the `plugins` option to supply a list
of plugins. The notable difference here is that you **do not** need to supply
the `file` option. This is set automatically by the WebPack plugin to the specified
output file.

```js
import Pipeline from 'asset-webpack';
import List from 'asset-list';
import path from 'path';

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
      namespace: true,
      plugins: [
        [List, { /* asset-list options here */ }]
      ]
    })
  ]
};
```

### `asset-bundle`

The `asset-bundle` provides a `plugin` method that is used to register
plugins. The first argument should be the constructor, and the second argument
the options that this library accepts. The `file` option is required.

```js
import Bundle from 'asset-bundle';
import List from 'asset-list';
import path from 'path';
import fs from 'fs';

const bundle = new Bundle([ path.join(__dirname, 'test', 'fixtures', 'godaddy.svg'); ]);
const output = path.join(__dirname, 'bundle.svg');

//
// Add the plugin to the bundle process using the `.plugin` module.
//
bundle.plugin(List, { file: output });

//
// Once the bundle is done, it will generate all the things.
//
bundle.run((err, str) => {
  fs.writeFileSync(output, str);
});
```

## Output

Below is an example output of the documentation that is generated about our 3
example assets:

# bundle.svgs

## Table of Contents

- [Bundle details](#bundle-details)
- [Assets](#assets)
  - [godaddy](#godaddy)
  - [tiger](#tiger)
  - [homer](#homer)

## Bundle details

- **31.03KB** compressed(gzip).
- **81.26KB** uncompressed.
- Contains **3** assets.
- Build according to specification: **0.1.0**

The bundle can be included using the `asset-provider` components:

```js
import Provider, { Asset } from "asset-parser";

<Provider uri="./bundle.svgs">
  <!-- Add the <Asset />s here -->
</Provider>
```

Learn more about [asset-provider](https://github.com/godaddy/asset-system) components.

## Assets

### godaddy

| name    | width | height | preview                                    |
| ------- | ----- | ------ | ------------------------------------------ |
| godaddy | 127   | 55.2   | <img src="../test/fixtures/godaddy.svg" /> |

```js
<Asset name="godaddy" width={ 127 } height={ 55.2 } />
```

### tiger

| name  | width              | height             | preview                                  |
| ----- | ------------------ | ------------------ | ---------------------------------------- |
| tiger | 493.87457275390625 | 509.17413330078125 | <img src="../test/fixtures/tiger.svg" /> |

```js
<Asset name="tiger" width={ 493.87457275390625 } height={ 509.17413330078125 } />
```

### homer

| name  | width             | height            | preview                                  |
| ----- | ----------------- | ----------------- | ---------------------------------------- |
| homer | 457.2821960449219 | 490.2279052734375 | <img src="../test/fixtures/homer.svg" /> |

```js
<Asset name="homer" width={ 457.2821960449219 } height={ 490.2279052734375 } />
```

## License

[MIT](LICENSE)
