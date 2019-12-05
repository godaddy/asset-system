# Releasing

Some of the packages are tightly coupled and need to be released in a specific
order. This file documents the order and release process of all the packages
that are included in the Asset-System project.

Releases are done using the `mono-repos` module:

```
npm install -g mono-repos
```

## test

This is the bundle that includes all test fixtures that are shared between
the various of packages. This is probably the first package that you want to
bump to latest and ensure that every sub-package receives the latest and
greatest version:

```
mono --publish test --version x.x.x
```

Once released, bump version in _every_ package.

## parser

If there are `asset-parser` changes, update the version in the `CHANGELOG.md`
and release a new version:

```
mono --publish parser --version x.x.x
```

- Bump released version in `asset-provider`
- Bump released version in `asset-bundle`

## provider

If there are `asset-provider` changes, update the version in the `CHANGELOG.md`
and release a new version:

```
mono --publish provider --version x.x.x
```

## dimensions

If there are `asset-dimensions` changes, update the version in the `CHANGELOG.md`
and release a new version:

```
mono --publish dimensions --version x.x.x
```

- Bump released version in `asset-bundle`

## bundle

If there are `asset-bundle` changes, update the version in the `CHANGELOG.md`
and release a new version:

```
mono --publish bundle --version x.x.x
```

- Bump released version in `asset-webpack`

## webpack

If there are `asset-webpack` changes, update the version in the `CHANGELOG.md`
and release a new version:

```
mono --publish webpack --version x.x.x
```

## list

If there are `asset-list` changes, update the version in the `CHANGELOG.md`
and release a new version:

```
mono --publish webpack --list x.x.x
```
