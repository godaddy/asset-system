# asset-dimensions

Extract the dimensions of a given SVG image. When no information can be
extracted from the `viewBox` or `width` and `height` properties it will be
rendered in a headless browser and the Bounding Box will be extracted from
the rendered image and returned instead for guaranteed sizing information.

## Installation

```
npm install --save asset-dimensions
```

The module has an **optional** dependency on [`puppeteer`][puppeteer]. This
module is used to resolve the `viewBox` of a given `svg` asset if there is no
`viewBox` or `height/width` combination available on the asset.

If these properties are missing on some of your assets you will print a warning
and can decide to either manually update them, or install `puppeteer` and it
will automatically extract the correct viewBox from your svg.

```
npm install --save puppeteer
```

This dependency is not listed as `optionalDependency` in the package.json so
it needs to be manually installed. The reason for this is so we do not download
the headless chrome browser by default when it's not needed for our users.

## Usage

The module exposes as `async function` as default interface. This function
expects an object as first argument with the following properties:

- `file` The path to the svg that we're extracting information from. This will
  be used in the debug output when we fail to extract the dimensions so you know
  which file needs manual updating, or why `puppeteer` is required.
- `source` The contents of the file as plain text.
- `tree` DOM (`cheerio`) of the SVG.

```js
import dimensions from 'asset-dimensions';
import { readFileSync } from 'fs';
import { load } from 'cheerio';
import { join } from 'path';

const file = join(__dirname, 'assets', 'file.svg');
const source = readFileSync(file, 'utf-8');

const result = await dimensions({
  tree: load(content, { decodeEntities: false }),
  content,
  file,
});

console.log(result);
```

The returned `result` is an `object` that will have the following keys:

- `width` Width of the asset.
- `height` Height of the asset.
- `x` y of the asset.
- `y` x of the asset.
- `viewBox` The viewBox constructed with the `height`, `width`, `x`, `y` props.

## License

[MIT](LICENSE)

[puppeteer]: https://github.com/GoogleChrome/puppeteer
