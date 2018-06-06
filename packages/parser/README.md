# asset-parser

Asset Parser parses SVG bundles and turns them in to usable SVG assets that
can be used in React and React-Native. It also provider a way to transform
the assets on the fly if needed.

This module is designed to be used with the `asset-provder`.

## Installation

If you are using this on the web, with React:

```
npm install --save asset-parser
```

If you run this on `react-native` you also need to **manually** install the
`react-native-svg` dependency.

## Table of contents

- [Installation](#installation)
- [API](#api)
  - [parse](#parse)
  - [modify](#modify)
    - [child filtering](#child-filtering)
    - [child replacement](#child-replacement)
  - [modifiers](#modifiers)
  - [decode](#decode)
  - [encode](#encode)
  - [version](#version)
  - [Asset](#asset)
- [License](#license)

## API

The parser class is directly exported from the module:

```js
import AssetParser from 'asset-parser';

const ap = new AssetParser();
```

And it exposes the following methods:

#### parse

Parses the actual data into an object structure that contains the various of
assets that were bundled in the received payload. It requires the following
arguments.

- `format` Either `bundle` or `single`.
- `data` The data that needs to be parsed.
- `fn` Error first completion callback.

```js
ap.parse('bundle', '{..}', (err, svgs) => {

});
```

The `svgs` argument is *alway* specified, even in case of an error, where it
will be an empty object. When parsing has completed successfully the object will
be a mapping of `<name of the asset>` and an [`<Asset>`](#asset) instance.

It's important to know that while parsing of the payload is complete, we will
not parse and transform the actual contents of the SVG until it's actually
rendered. So if there are SVG's in the bundle that you are not using, it will
not cost you any CPU cycles.

See [Asset.render](#asset) for more detailed information on rendering the
assets.

#### modify

Allows you to modify the SVG's on the fly, this allows you to re-color, resize,
change and even completely replace parts of SVG assets. It requires the
following arguments:

- `name` The name of the property where the modifier should trigger on.
- `fn` Callback function that will do the modifications. The function receives 3
  arguments:
  - Attributes that will be introduced to child component.
  - Properties that are passed in from `asset.render({ props here })` method.
  - The child component.

```js
ap.modify('color', (attr, props, child) => {

});
```

It's worth noting that you can assign multiple modifiers per property. They are
called in a FIFO order.

The following examples will give an indication of the flexibility and power of
the modification system:

##### child filtering

As the modifier is called for every element in the SVG asset, you can do some
filtering based on received child. As this is a `React.Element` it will give
you access to `child.props`, but more importantly it's type using `child.type`.

```js
ap.modify('fill', function (attr, props, child) {
  if (child.type !== 'G') return;
  if (attr.fill) return;

  attr.fill = props.fill;
});
```

##### child replacement

If you want to replace a child completely, you can return a new `React.Element`.

```js
import { Circle } from 'svgs';

ap.modify('circle', function (attr, props, child) {
  if (child.type !== 'Rect') return;

  return (
    <Circle radius={ 10 } />
  );
});
```

#### modifiers

Returns an array of properties that we have modifiers registered for.

```js
ap.modify('foo', () => { });
ap.modify('foo', () => { });
ap.modify('bar', () => { });

console.log(ap.modifiers()) // [ "foo", "bar" ]
```

#### encode

Encodes a given payload in to string. It prefixes the resulting string with
the supplied version number. It requires 3 arguments:

- `version` Version number of the specification.
- `data` Object/array that needs to be encoded.
- `fn` Error first completion callback.

```js
import { encode } from 'asset-parser';

const data = { foo: 'bar' };
const version = '1.33.7';

encode(version, data, (err, str) => {

});
```

The example above would generate the following string as output;

```
1.33.7§{"foo":"bar"}
```

#### decode

Decodes the payload. It requires 2 arguments:

- `data` String that needs to be encoded.
- `fn` Error first completion callback.

```js
import { decode } from 'asset-parser';

const str = '1.33.7§{"foo":"bar"}';
decode(str, (err, payload) => {

});
```

The resulting `payload` argument will be an `object` that will contain the
following keys:

- `version` The extracted version number from data string. This is version of
  the [specification](/SPECIFICATION.md) that was used to encode the data.
- `data` The decoded data.

#### version

Exposes the current version of the specification that we encode the payload in.

```js
import { version } from 'asset-parser';
```

#### Asset

The asset is our internal class that represents a single SVG item/result. It
provides some optimizations and hooks to alter SVG's on the fly. It is exposed
as export and can be accessed using.

```js
import { Asset } from 'asset-parser';
```

The constructor requires 2 arguments:

- `data` The data structure that needs to be transformed.
- `hooks` Hooks that are used to modify the SVG elements.

#### Asset.render

Returns the SVG elements for the given asset. It accepts a single argument:

- `props` Addition props that need to be introduced on the SVG, the `modify`
  functions will also receive these as arguments.

```js
as.parser('bundle', 'string of bundle', (err, svgs) => {
  const asset = svgs['name of the file'];

  const { props, svg } = asset.render();

  console.log(props, svg);
  console.log(asset.render({ fill: 'red' }));
});
```

## License

[MIT](LICENSE)
