# react-native

A small demo that implements the `asset-provider` in a React-Native
application.

## Starting the demo

Make sure that all dependencies are installed (we do assume that you already
have your machine setup for React-Native development):

```
npm install .
```

In addition to the dependencies of this repository you also need to install
the dependencies of the `web` example as we will use that web server to
serve the svg bundle to the React-Native application.

```
cd .. && cd web && npm install .
```

Once all dependencies are installed we need to start the web server of the `web`
example. So navigate back to `web` folder and run:

```
npm start
```

Once the application is started we can boot up our React-Native application:

```
react-native run-ios
react-native run-android
```

## How is the demo setup

### App.js

This is the entry point of the application and where we've implemented the
`asset-provider`. So how is it build up?

- The first and basically only notable change here is that we needed to install
  `react-native-svg` as a dependency of the project so we can render SVG
  on the devices. The rest is the same as on the web.
- The `<Provider />` and `<Asset />` components are imported from the
  `asset-provider` module.
- We create a `<Provider />` component that downloads the `homer`, `godaddy`
  and `tiger` svg from the generated bundle.
- We add `<Asset>`'s as child components of the `<Provider>` and reference the
  assets using the `name` property of the `<Asset />`.
- One of the `<Asset />`s has a `<Text>` component as child node. This will
  be visible while we are download the asset from our server and will be
  replaced with the actual asset once the bundle is downloaded.

### Server

The server aspect of the example is documented at the `web` example.
