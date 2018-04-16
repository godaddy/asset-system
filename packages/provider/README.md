# asset-provider

Fetches, parses, and introduces SVG bungles through React Context.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
  - [Provider](#provider)
    - [uri](#uri) **required**
    - [preload](#preload)
    - [timeout](#timeout)
    - [format](#format)
  - [Asset](#asset)
    - [name](#name)
    - [data](#data)
    - [height](#height) **required**
    - [width](#width) **required**
    - [title](#title)
    - [onLoad](#onload)
    - [onError](#onerror)
    - [onLoadStart](#onloadstart)
    - [onLoadEnd](#onloadend)
  - [parser](#parser)
  - [License](#license)

## Installation

```
npm install --save asset-provider
```

If you use this module on React-Native, make sure you also install the
`react-native-svg` dependency.

**IMPORTANT** This module is written for React 16 but comes with basic support
for React 15. It's highly recommended that you upgrade as soon as possible. In
order to make React 15 work we **force** you to only use a single child element
for the `<Provider />`. In addition to that, the React 15 specific changes of
the `asset-parser` apply as well.

## Usage

This library exposes the `Provider`, `Asset` components which are used for
displaying SVG assets. The `Provider` component downloads the specified SVG
bundle, parses it and then allows the `Asset` component to reference the
various of bundled SVG assets inside of it.

```js
import Provider, { Asset } from 'asset-provider';

export default function example() {
  return (
    <Provider uri='https://url.here.com/svg.bundle'>
      <div>
        <Asset name='example' width={ 100 } height={ 100 } title='Example image' />

        <Asset name='another' width={ 300 } height={ 100 } title='Another image'>
          <Spinner />
        </Asset>
      </div>
    </Provider>
  );
}
```

The `<Provider />` component can also be nested within another `<Provider />`
this allows the `<Asset />` components within to request assets from both
instances. If the first parent does not export the asset, it will proxy the
request to it's own parent. To illustrate this, in the following example we
will be loading 2 different bundles. `foobar.svgs` contains the svg asset with
the names `foo` and `bar`, and the `another.svgs` contains an asset with the
name another.

```jsx
<Provider uri='https://url.com/foobar.svgs'>
  <Asset name='foo' width={ 120 } height={ 40 } />

  <Provider uri='https://url.com/another.svgs'>
    <Asset name='foo' width={ 120 } height={ 40 } />
    <Asset name='another' width={ 120 } height={ 40 } />
  </Provider>
</Provider>
```

As you can see in the example above, while `<Asset name='foo' />` does not
exist in the `another.svgs` bundle, it will still render as it's request is
proxied to the other `<Provider />` instance.

### Provider

The provider library accepts the following properties:

- [uri](#uri) **required**
- [preload](#preload)
- [timeout](#timeout)
- [format](#format)

#### uri

**Required**

The location of the SVG bundle/asset that needs to be loaded. This asset is
downloaded once a `<Asset />` component references it.

```js
<Provider uri='https://example.com/svg.bundle'>
  // ...
</Provider>
```

For the best cross platform compatibility it recommended that the asset bundle
is served over HTTPS so you do not need to configure
[App Transport Security (ATS)][ATS] on React-Native for iOS.

In addition to that it's recommended that this file is served with `text/plain`
as `Content-Type`. This [prevents a CORS preflight][CORS] request from being
made and therefor drastically improving performance.

The `uri` property can either be a string or a function. In case of a function
it will be called with a completion function incase you need to asynchronously
resolve the URL.

```js
function resolve(next) {
  asynctask(function (err, data) {
    if (err) return next(err);

    next(null, data.url);
  });
}

<Provider uri={ resolve }>
  // ...
</Provider>
```

#### preload

Force the provider to automatically start downloading the bundle once the
component has been initiated instead of waiting for an `<Asset />` to reference
it.

```js
<Provider uri='https://example.com/svg.bundle' preload={ true }>
  ..
</Provider>
```

#### timeout

How long we should wait until an asset is downloaded before giving up and start
displaying our fallback/failure asset. Please note that this option is configured
to a sane value (10 sec) by default so only touch this if you know what you're
doing.

```js
<Provider uri='http://example.com/svg.bundle' timeout={ 5000 }>
  ..
</Provider>
```

#### format

The format of the specified URI, can either be `single` or `bundle`. Defaults to
`bundle`.

```js
<Provider uri='http://example.com/svg.bundle' format='bundle'>
  ..
</Provider>
```

### Asset

The `Asset` component is a consumer of the `Provider`'s React Context, which
are fancy words for child component of Provider. The `<Asset />` component
renders the actual SVG content that the Provider component is fetching.

The Asset component can be imported from the `asset-provider` package:

```js
import { Asset } from 'asset-provider';
```

```js
<Asset name='leader' width={ 100 } height={ 200 } />
<Asset name='another' width={ 20 } height={ 20 }>
  <Spinner size='xs' />
</Asset>
```

As seen from the example above, the `<Asset />` component can be rendered with
or without a child component. Both versions trigger different types of behavior.

If you supply the `<Asset />` with a child component, this child component will
(only) be visible while we are **LOADING** the asset. This allows you to control
the UX / placeholder of the asset during the loading phase. Once the asset is
loaded, we will display the SVG instead of the child components.

When no child component is provided we will render a transparent SVG in exactly
the same size as provided. The reasoning behind this is that it will allow us
to prevent the unwanted layout jumps also known as `relayout` which provides a
really bad user experience. This is also the reason why **height** and **width**
are required properties on the `<Asset />`.

All unknown properties that are added to the `<Asset />` component are passed
down to the resulting `<Svg>` component. So you can use attributes such as `style`
to add additional styling to the assets:

```js
<Asset name='icons/foo' width={ 10 } height={ 20 } style={{ backgroundColor: 'red' }} />
```

The properties that **do not** get transferred are:

- All the properties that the `<Asset />` component accepts (see list below).
- All properties that trigger the [parser](#parser)'s modify methods.

The `<Asset>` component accepts the following properties:

- [name](#name)
- [data](#data)
- [height](#height) **required**
- [width](#width) **required**
- [title](#title)
- [onLoad](#onload)
- [onError](#onerror)
- [onLoadStart](#onloadstart)
- [onLoadEnd](#onloadend)

#### name

Name of the asset that should be rendered. This name should be present in the
SVG bundle that the provider is downloading. In case of an unknown name is
given (and not available through another parent <Provider />), we will return
a fallback SVG.

```js
<Asset name='xmas-tree' width={ 100 } height={ 100 } />
```

#### data

Instead of pulling asset out of the provider's React Context, use the supplied
data.

```js
<Asset data={ .. } width={ 10 } height={ 10} />
```

#### height

**Required**

Sets the height of the asset, should be a numeric value.

```js
<Asset height={ 100 } width={ 400 } />
```

#### width

**Required**

Sets the width of the asset, should be a numeric value.

```js
<Asset height={ 100 } width={ 400 } />
```

#### title

Improve the accessibility of your assets by adding a title. This will be used as the SVG
`<title></title>` attribute on the web and as accessibility label on
React-Native.

```js
<Asset title='Shopping cart' name='cart' />
```

This is done automatically through the [SVGS] library that we use.

#### onLoad

Invoked when load completes successfully without any errors. Should be a function.

```js
<Asset onLoad={ () => { console.log('loaded without errors')} } name='foo' width={10} height={10} />
```

#### onError

Invoked on load error, receives the `error` as argument. Should be a function.

```js
<Asset onError={ () => { console.log('loaded with errors')} } name='foo' width={10} height={10} />
```

#### onLoadStart

Invoked on load start. Should be a function.

```js
<Asset onLoadStart={ () => { this.setState({ loading: true }); } } name='foo' width={10} height={10} />
```

#### onLoadEnd

Invoked when load either succeeds or fails. It will receive an optional error
argument if it loaded with an `error`. Should be a function.

```js
<Asset onLoadEnd={ () => { console.log('started loading')} } name='foo' width={10} height={10} />
```

### parser

This is the `asset-parser` instance that the provider is using to transform
the requested payloads in to actual SVG elements.

```js
import { parser } from 'asset-provider';
```

It allows you to hook in to the modify system of the parser and change the
SVG assets on the fly using the parsers `modify` method.

```js
parser.modify('color', function reseller(attr, props, child) {
  if (attr.fill) attr.fill = props.color;
  if (attr.stroke) attr.stroke = props.color;
});
```

In the example above we've created a small modifier that will re-color the
`fill` and `stroke` attributes of any `<Asset />` when a `color` prop is
added. The function modify receives the following arguments:

- `attr` These are the attributes that are on the SVG tag.
- `props` All properties that are provided to the `<Asset />`.
- `child` React Element of the tag. This can be any tag of the svg, Path, Text,
  Rect etc.

```jsx
<Asset name='foo' width={ 100 } height={ 100 } color='red' />
```

This would then recolor the `stroke` and `fill` of the `foo` asset `red`. If
instead we wanted to just recolor the `fill` then we would just set `attr.fill`
in our call to `parser.modify`:

``` js
parser.modify('color', function reseller(attr, props, child) {
  if (attr.fill) attr.fill = props.color;
});
```

The underlying semantics of how props defined on `<Asset />` instances is up
to the consumer (i.e. you) to define. For more detailed information see the
[asset-parser][asset-parser] project.

## License

[MIT](LICENSE)

[ATS]: https://ste.vn/2015/06/10/configuring-app-transport-security-ios-9-osx-10-11/
[CORS]: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#Simple_requests
[SVGS]: https://github.com/godaddy/svgs#accessibility
[asset-parser]: https://github.com/godaddy/asset-parser
