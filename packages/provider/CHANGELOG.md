# CHANGELOG

- Simplify array spread usage to avoid babel@7 issue [#7597](https://github.com/babel/babel/issues/7597)

### 4.2.0

- Provide default `viewBox` to fallback image.

### 4.1.0

- Allow for a custom asset fallback at the provider-level

### 4.0.0

- Major: Upgraded to use the latest `@babel/*` 7.0 packages.

### 3.1.0

- Fixed main/browser exports to point to ES5 builds
- Various of fixes that caused usage with Next.js to fail.

### 2.0.0 - 3.0.0 (failed publish)

- Fixed a race condition where fetching would still trigger setState when the
  component was unmounted already.
- Removed React 15 support.

### 1.1.1

- Allowed the `url` function that was added in 1.1.0 to access the provider
  instance through `this`.

### 1.1.0

- Added support for specifying the `uri` as a function for dynamic URL
  generation.

### 1.0.0

- Initial public release.
