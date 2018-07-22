# asset-bundle

Transforms your SVG assets in to `asset-provider` compatible bundle that
contains multiple SVG assets.

The bundle process executes the following steps to produce a bundle:

- **read** It reads out all the supplied paths that you supplied and generates
  the name of the asset based on the filename. If the `root` option is set, it
  will use the folder structure as "namespace", when the option is omitted the
  name of the asset is just file name without extension.
- **optimize** The SVG's are optimized with `svgo` so all information that
  cannot be used is removed. This ensures that the assets that we bundle are as
  small as possible.
- **parse** The optimized SVG structure is transformed to a DOM tree so we
  can start extracting and transforming.
- **viewBox** In order to correctly render, and scale the assets we need to know
  the dimensions. We verify if a `viewBox` properly is available or we render
  the `svg` with [puppeteer][puppeteer] and extract the calculated SVG bounding
  box. The bounding box information is then used to construct the viewBox.
- **traverse** We transform the SVG to an easy to parse format so minimal CPU
  needs to be used when transforming assets to `svgs` elements. We want to
  minimize impact to mobile device CPU's and battery life so this optimization
  step happens during the bundling phase.
- **encode** The resulting transformed structure is then encoded using the
  `asset-parser` library.

## Installation

```
npm install --save asset-bundle
```

The bundler has an **optional** dependency on `puppeteer`. This module is used
to resolve the `viewBox` of a given `svg` asset if there is no `viewBox` or
`height/width` combination available on the asset. If these properties are
missing on some of your assets you can either manually update them, or install
`puppeteer` and it will automatically extract the correct viewBox from your
svg.

```
npm install --save puppeteer
```

## Table of Contents

- [Usage](#usage)
  - [modify](#modify)
  - [plugin](#plugin)
  - [run](#run)
  - [events](#events)
- [License](#license)

## Usage

```js
import Bundle from 'asset-bundle';
```

The `Bundle` constructor requires a single argument.

- `paths` An array of paths that point to the SVG files that need to be
  included in the resulting bundle.
- `config` Optional configuration that allows you to customize the SVGO process.
  Do not touch this unless you know what you're doing, like really know what
  you are doing.

```js
import path from 'path';

const bundle = new Bundle([
  path.join(__dirname, 'folder', 'filename.svg'),
  path.join(__dirname, 'folder', 'another.svg'),
  path.join(__dirname, 'folder', 'more.svg')
]);
```

The following `config` options are available:

- `root` The root of the directory where the bundling process is taking place.
  This will be used to generate "namespaced" names of assets when they are
  deeply nested in folders.
- `multipass` Enable or disable multipass in `svgo`. Defaults to `false`;
- `svgo` An Array of plugins that need to be enabled in `svgo`. Highly
  recommended to **not** touch this, unless you know what you're doing, know
  the order of the `svgo` plugins, and which `svgo` plugins are vital for the conversion process.

### modify

Registers a new transformation hook that is ran on every element. This allows
you to transform, remove or add addition attributes or even change the
component completely.

The method requires 2 arguments:

- `name` A unique name for your transformation
- `fn` Function that does the actual transforming.

```js
bundle.modify('what', function (attr, element, name) {

});
```

As you can see in the example above it receives 3 arguments in the
transformation function:

- `attr` An object that contains all attributes of the SVG elements.
- `element` Reference to the DOM element of the SVG that we just parsed.
- `name` Component name of the element.

If you want to modify the attributes you can just alter the `attr` object.
If you wish to change the component name, you need to `return` a new name. We
assume that you return `undefined` in all other cases as signal that the
component name should not be changed.

### plugin

Register a new plugin.

- `Plugin` The `constructor` of the plugin function.
- `...args` The rest of the arguments for the plugin.

```js
bundle.plugin(PluginConstructor, {
  options: 'for',
  the: 'plugin'
});
```

It returns the instance of the plugin for debugging sake.

### run

Starts the transformation process of the supplied SVG files. Please note that
this is a heavy operation and should really be done during build time of your
assets.

The run method requires a single argument:

- `fn` Error first completion callback. The first argument will be an optional
  error argument, the second argument will be the resulting bundle. The bundle
  is already encoded in the correct format that is accepted by the
  `asset-parser` library.

```js
import path from 'path';
import fs from 'fs';

bundle.run(function (err, str) {
  if (err) throw err; // Don't actually throw it, just handle it.

  fs.writeFileSync(path.join(__dirname, 'bundle.svgs'), str);
});
```

It is worth noting that we use the `filename` of each SVG as name for the asset.
So when you're fetching this bundle using the `asset-provider` library your
assets would be named:

- `filename`
- `another`
- `more`

(As those were the files that our bundle example was using).

### events

The `Bundle` extends `EventEmitter` and emits events during the various of
transformation cycles. The following events are emitted (and in order):

- `read` Supplied paths have been read.
- `optimize` SVG's have been optimized.
- `parse` AST has been generated from the SVGS.
- `viewBox` All viewBox's have been calculated.
- `traverse` AST has been traversed and output structure is generated.
- `done` Structure has been encoded.

All events will receive the following arguments:

- `err` An `Error` if that happens during the transformation step.
- `svgs` An `Array` of SVG objects.

The only exception for this is the `done` event, which will receive:

- `err` An `Error` if that happens during the transformation step.
- `result` Encoded result.
- `svgs` An `Array` of SVG objects.

```js
bundle.on('done', (err, data, svgs) => {
  console.log(svgs);
});
```

## License

[MIT](LICENSE)

[puppeteer]: https://github.com/GoogleChrome/puppeteer
