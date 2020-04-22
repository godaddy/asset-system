# asset system [![Build Status](https://img.shields.io/travis/babel/babel/master.svg?label=travis&maxAge=43200)](https://travis-ci.org/godaddy/asset-system) [![Coverage Report](https://img.shields.io/codecov/c/github/godaddy/asset-system/master.svg?maxAge=43200)](https://codecov.io/gh/godaddy/asset-system) [![Greenkeeper badge](https://badges.greenkeeper.io/godaddy/asset-system.svg)](https://greenkeeper.io/)

`assets-{*}` is a cross platform asset system for React and React-Native.
It allows you to use the same assets and logic on web and native devices.

What you are looking at is the mono repo for all `asset-*` projects. If
are looking for specific documentation about a projects:

- [asset-provider][provider] The React(-native) Components.
- [asset-parser][parser] Response parser / encoder.
- [asset-bundle][bundle] Bundles svgs in to a single bundle.
- [asset-webpack][webpack] WebPack plugin.
- [asset-list][list] Generates documentation about the bundle.

## Table of Contents

- [Design Goals](#design-goals)
- [Examples](#examples)
- [Project structure](#project-structure)
- [Integrate with WebPack](#integrate-with-webpack)
  - [Specify the `file-loader` for .svg extensions](#specify-the-file-loader-for-svg-extensions)
  - [Configure plugin](#configure-plugin)
  - [Producing a bundle](#producing-a-bundle)
- [Integrate with Next.js](#integrate-with-nextjs)
- [Integrate with warehouse.ai](#integrate-with-warehouseai)
- [Project Management](#project-management)
  - [Install](#install)
  - [Testing](#testing)
  - [Publishing](#publishing)
- [License](#license)

## Design Goals

When designing the asset system from the ground up, we established some humble
design goals that the system should satisfy:

- **isomorphic** Asset loading and presenting should work in React **and**
  React-Native without having to change a single line of code.
- **scalable** Assets should be scalable without any degradation in quality
  regardless of the size and resolution.
- **performance focused** Highly optimized bundle, built-in caching and request
  optimizations.
- **UX/DX first** Easy to use, intuitive API's. With `height` and `width` as
  required properties we [prevent unwanted layout reorganization/relayout][sizing].
- **accessibility** ARIA properties and roles are used where possible and
  `accessibilityLabel` for React-Native.
- **modifications** Various of hooks should be present in the transformation
  process to support on the fly modification e.g. recoloring of the asset so you
  can prevent duplicates.

## Examples

We have prepared 2 examples where we integrate `asset-provider` in to
an application.

- [web](/examples/web) Integration in to a web application.
- [react-native](/examples/reactnative) Integration in to a React-Native application.

## Project structure

The README that you're currently reading is in the root of our [mono][mono]
repository. All related projects/packages are available in the [packages][packages]
folder that is in the root of this repository. This makes it easier to contribute
changes to the multiple packages at once as they tightly coupled/integrated.

This undertaking is separated into multiple standalone packages:

- [asset-provider][provider]
- [asset-parser][parser]
- [asset-bundle][bundle]
- [asset-webpack][webpack]
- [asset-list][list]

The following flow chart illustrates how the various of packages are used:

```
[ asset-provider] -> [ <Provider uri={} /> ] -> [ <Asset name={} /> ]
          ^                         ^
          |                         |
    XMLHTTPRequest         [ asset-parser ]
          |                         ^
          v                         |
 [ ~ bundle.svgs ~ ]                |
          ^                         |
          |                         |
  [ asset-bundle ] < - - - - - - - - - - - - - -> [ asset-list ]
          ^
          |
  [ asset-webpack ]
```

Lets start from the bottom and move our way upwards. There is a WebPack plugin
that can extract SVG's from your JavaScript files (or you can create a
separate JavaScript file that requires the SVGS). All found SVG assets are
then passed to the [asset-bundle][bundle] library.

This library will parse, optimize and combine all SVGS in to a single file
format. This will reduce HTTP requests leading to better performance. The
resulted bundle will then be encoded using the [asset-parser][parser].

Once this process is done, [asset-list][list] will generate documentation
about the created bundle so you can easily see which files are embedded, the
dimensions of the assets and the total file size.

You can then upload the resulting bundle to your CDN for usage.

The [asset-provider][provider] contains `<Provider>` (root) and `<Asset>`
(child) components for fetching/presenting assets from the uploaded svgs
bundle. The `<Provider uri={ }>` will fetch the bundle once an nested child
`<Asset />` component is encountered. Once bundle is downloaded the
[/asset-parser][parser] decode the HTTP payload. The bundled SVG's will only be
transformed to SVG elements once a `<Asset name={} />` component references.

## Integrate with WebPack

Import the loader in to your [`webpack.config.js`](/examples/webpack.config.js):

```js
import SVGBundler from 'asset-webpack';
```

#### Specify the `file-loader` for .svg extensions

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

#### Configure plugin

The following arguments are accepted:

- `filename` The filename of the resulting SVG Asset Bundle. It will be stored
  in the folder you specified in your `webpack.config.js`'s `ouptput.path`.
- `options` Additional configuration that will be forwarded to the
  `asset-bundle` processor.

```js
{
  ...,
  plugins: [
    new SVGBundler('bundle.svgs', { /* opts */ })
  ]
}
```

#### Producing a bundle

Create an entry file that requires the SVG assets:

```js
require('./file.svg');
require('./another.svg');
require('./more.svg');
```

## Integrate with [next.js][next]

Next.js is a minimalistic framework for server-rendered React applications. The
render flow of Next.js is as followed:

1. On first render, your application will be rendered on the **server** and the
   resulting HTML will be send to the client.
2. The returned HTML will be rehydrated with ReactDOM so all event listeners
   are attached again and every re-render of your application will work as
   intended.

This means that if you include an SVG element in your application it will send
to the client on initial render as part of the HTML payload as well as be
included in the client-side bundle as it needs to be available for re-rendering.

Asset-System's build-in optimizations will automatically resolve this
duplication as it will render a placeholder with the same dimensions as the
original SVG, and once the application is rehydrated on the client-side it
fetch the SVG bundle, and render your intended SVG in the placeholder. As the
placeholder is the same dimensions as the actual SVG, there will be no annoying
jumping of layout (relayout).

In order to implement Asset-System with Next.js, we need to add our
`asset-webpack` module to their own `webpack.config.js`, this is done by
creating a custom `next.config.js` and assigning a `webpack` function that
alters the webpack. In this example we use `webpack-merge` to help with the
merging of our new webpack rules:

```js
// next.config.js
module.exports = {
  webpack: function webpack(config) {
    return require('webpack-merge').smart(config, {
      module: {
        rules: [
          {
            test: /\.(svg)$/,
            use: ['file-loader']
          }
        ]
      },
      plugins: [
        new Bundler('static/bundle.svgs', {
          root: __dirname
        })
      ]
    });
  }
}
```

Once you have your custom `next.config.js` in place, you can reference the
generated bundle at `/_next/static/bundle.svgs` in your pages:

```js
// pages/index.js

import Provider, { Asset } from 'asset-provider';
import reactLogo from '@fortawesome/fontawesome-free/svgs/brands/react.svg';

export default function Index(props) {
  return (
    <Provider uri='/_next/static/bundle.svgs'>
      <h1>Rendering the React Logo</h1>
      <Asset name={ reactLogo } width={ 100 } height={ 100 } title='The React logo' />
    </Provider>
  )
}
```

## Integrate with [warehouse.ai][warehouse]

The system was designed to be compatible [warehouse.ai][warehouse], which is
what we use internally at GoDaddy to compile and distribute our front-end code.
If you've also adopted warehouse, you can easily integrate `asset-system` in
your build flow.

We assume you've already setup your own scope according to the warehouse
instructions that are outlined in their docs.

Update the projects `package.json` to include the following:

- `build` which activates `webpack`
- `publishConfig` that points to the Warehouse server

```js
{
  ...
  "build": "webpack",
  "publishConfig": {
    "registry": "https://custom.wrhs.url.here.com"
  },
  ...
}
```

Now that the `package.json` is updated you need to specify which files should
be uploaded to the CDN. This is done by creating a [`whrs.toml`](/examples/whrs.toml)
which contains the following:

```
[files]
dev = ['dist/bundle.svgs']
test = ['dist/bundle.svgs']
prod = ['dist/bundle.svgs']
```

You can specify multiple bundles that need be uploaded, or create multiple
packages.

## Project management

Managing your first mono repo can be overwhelming at first, luckily we have
some tools that will make this a lot easier and automate most of the processes.

This repo is managed by the `mono-repos` package which comes with CLI and Node.js
API for managing packages. It's already installed as devDependency, but you
can also install it globally:

```
npm install --global mono-repos
```

### Install

We've provided an installation script that will automatically go through
all the packages, install the dependencies, and symlink them if needed. This
process is ran automatically when you run:

```
npm install
mono --install
```

In the root of the repository. You can always run `npm install` in the package
folder as well, but that will not setup the correct symlinks for you.

### Testing

You can either run tests separately, or run them all at once (recommended for new
releases).

```
npm test

mono --test
```

For testing individual packages

```
npm run test:provider
npm run test:bundle
npm run test:list
npm run test:webpack

mono --test bundle
mono --test webpack
mono --test provider
```

If this isn't your thing, you can also still go in to the package's directory
and run the `npm test` command there for the individual test.

### Publishing

The publishing is automated using the `mono` command as well, it ensures that
following happens in the correct order, and format so we can still correctly
track individual publishes in our `git tags`:

- Increases version number.
- Create dist commit.
- Create the correct git tag.
- Push to repo.
- Publish package.

To bump all packages:

```
npm run publish -- --release major
mono --publish --release major
```

If the `--release` flag is omitted we assume it's a `patch` release by default.
When you want to release an individual package:

```
npm run publish:provider
npm run publish:bundle
npm run publish:parser

mono --publish provider
mono --publish bundle
mono --publish parser
```

## License

[MIT](LICENSE)

[bundle]: /packages/bundle
[parser]: /packages/parser
[webpack]: /packages/webpack
[provider]: /packages/provider
[list]: /packages/list
[svgs]: https://github.com/godaddy/svgs
[sizing]: https://facebook.github.io/react-native/docs/images.html#why-not-automatically-size-everything
[mono]: https://github.com/3rd-Eden/mono-repos/mono.md
[packages]: /packages/
[warehouse]: https://github.com/godaddy/warehouse.ai
[next]: https://github.com/zeit/next.js
