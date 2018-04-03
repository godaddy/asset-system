# Web

A small demo that illustrates how you could use the asset provider in your
own web application.

## Starting the demo

Make sure you have the dependencies installed for this demo:

```
npm install .
```

Once all dependencies are installed you can run the server using:

```
npm start
```

Once the server is started you can navigate your browser to:

- [`http://localhost:8080`](http://localhost:8080)

## How is the demo setup

There are 3 core files that drive this demo:

### index.js

This is the actual file that implements the `assets-provider`. This file
is converted to ES5 by the `server.js`. The application it self is rather
simple:

- Imports `asset-provider`, and it's `<Provider />` and `<Asset />` components.
- Specify a modification hook for the `pants` property, this will be used to
  change the color of homer's pants on the fly.
- Creates a wrapping `<Provider />` that will load our `godaddy.svg` bundle. This
  bundle will only contain a single asset which is the GoDaddy logo.
- Render the asset by adding `<Asset name='godaddy' />` as child node of the
  `<Provider />`
- To make things interesting we've added another `<Provider>` as child which
  will load another bundle that contains the `homer` and `tiger` svgs.
- Add 3 more `<Asset name={godaddy|homer|tiger} />` as child elements of the
  extra `<Provider />`. While `godaddy` is not available in this bundle, it
  will still render as the `<Provider />` is aware of it's own context and
  will request the asset from the wrapping `<Provider />`.
- Set the property `pants=red` on of the `homer` assets to change the color of
  his pants from light blue to red.
- Renders the Example component in the `example` container.

### server.js

The server is in charge of serving the `html`, `js` and the `svgs` asset bundle.

It comes with a dedicated API for generating bundles using the `asset-bundle`
library. The URL structure is a following:

- `http://localhost:8080/[lowercase names of the asset, separated by -].svgs`

It uses the assets that are available in the `asset` folder that is in the
root of this repository. So if you wish to generate a bundle containing just
the GoDaddy.svg logo you would request:

- http://localhost:8080/godaddy.svgs

And if you wanted to include 3 svgs in your bundle you could request:

- http://localhost:8080/godaddy-homer-tiger.svgs

This gives you some insight on the bundles, and what they contain.

### index.html

This is the default HTML page that gets loaded when you visit the URL. It's only
use is to load the `index.js` so it starts the React application.
