# CHANGELOG

### 4.0.0

- Major: Upgraded to use the latest `@babel/*` 7.0 packages.

### 3.0.1

- Also lazy require the `puppeteer` library in our render method.

### 3.0.0

- Removed `puppeteer` from the dependencies and made it an optional dependency
  instead as it needs to download 230mb+ files on installation each time for
  an edge case as documented in #13

### 2.1.0

- Point main/browser to ES5 builds.

### 2.0.0

- Bump to asset-parser@2.0.0

### 1.0.0

- Initial public release.
