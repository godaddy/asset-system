# Specification

**Current spec version: 0.1.0**

This documentation contains instructions how to transform SVG asset(s) in to
readable format for this module. There are various of transformation steps
that need to happen before an SVG can be consumed by this library. These exist
for the following reason:

- Reduce the data format so less bytes have to be send over the wire.
- The client side code should be as small and dumb as possible.
- Pre-transform SVG in easy format so less CPU cycles have to spend in the browser.

## Table of Contents

- [Specification](#specification)
  - [Structure](#structure)
  - [Bundle](#bundle)
  - [Serialization](#serialization)

### Structure

A SVG file needs to be transformed in a correct bundle file, in order for that
you need to transform the SVG elements in to JavaScript compatible syntax. This
should be done before uploading the asset so the computation for this happens
during the build process on your own machine, instead of on the client devices
that load these assets. If we imagine having a SVG with the following contents:

```html
<svg>
  <g>
    <path d='13.508 n0180-149 ...' fill='rgb(255,255,255)'  />
    <path d='13.508 n0180-149 ...' fill='#000000' stroke-opacity='0.1' />
  </g>
  <g stroke='green'>
  </g>
</svg>
```

We want to end up with the following "optimized" structure.

```json
[
  [
    "Svg",
    { "viewBox": "0 0 300 600" },
    [
      [
        "G",
        [
          ["Path", { "fill": "#000", "d":"13.508 n0180-149 ..."}],
          ["Path", { "fill": "#FFF", "strokeOpacity":"0.1", "d":"13.508 n0180-149 ..."}]
        ]
      ]
    ]
  ]
]
```

You might notice that the following transformations has occurred:

- The `svg` element has all it's properties removed except for `viewBox`. If no
  `viewBox` property is present, it should be calculated and added.
- Tag names are transformed to be uppercase first, so they match `svgs`
  component names.
- Attributes are transformed to be camelCase and then combined in to an objects
  which should be compatible with `react-native-svg` attributes.
- Colors are optimized to small HEX codes if possible.
- Child components are wrapped in an array [].

Each element is transformed in to an array where the first item of the Array
is the name of the tagName of the element which is transformed to be uppercase
first to match the components from the `svgs` library. The second item of the
array will either be:

- An object with attributes that should be applied to the tag.
- An array, that contains child elements for the given tag.
- A string, which will be content for the element in the case of `Text` tags.
- Nothing, no child elements or attributes are needed.

See the `test/fixtures/index.js` file for more examples of the bundle structure
and their resulting output.

### Bundle

Creating a bundle of SVG assets is a straight forward process. The
[structure](#structure) for assets is already known. The only thing it needs is
an identifier for each asset. This should be a unique id as it will be used as
`key` in the overall JSON structure and structure will be the value. A good
practise is to use the filename of the asset key. So if you have a file with the
name `example.svg` and `another.svg` you should end up with following bundle
structure.

```json
{
  "example": [
    ["Text", "Generated structure"]
  ],
  "another": [
    ["G", ["Text", { "stroke": 1 }, "Another"]]
  ]
}
```

### Serialization

The current implementation assumes that JSON is used serialization format. Run
the resulting bundle through your JSON encoder and upload it to the cloud.
