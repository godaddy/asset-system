import { createContext, runInContext } from 'vm';
import { fixtures } from 'asset-test';
import { describe, it } from 'mocha';
import Pipeline from '../index.js';
import Bundle from 'asset-bundle';
import webpack from 'webpack';
import assume from 'assume';
import path from 'path';
import fs from 'fs';

const entry = path.join(fixtures, 'entry.js');

describe('Asset Pipeline', function () {
  let pipeline;

  function setup(filename, options) {
    pipeline = new Pipeline(filename, options);
  }

  it('exposes the constructor through module.exports', function () {
    const Packer = require('../');

    assume(Packer).is.a('function');

    const test = new Packer('example', {});

    assume(test.hash).is.a('function');
    assume(test.apply).is.a('function');
  });

  describe('#loader', function () {
    beforeEach(function each() {
      setup('filename.svgs');
    });

    it('has a loader method', function () {
      assume(pipeline.loader).is.a('function');
    });

    it('pre-configures the loader to our own loader', function () {
      const loader = pipeline.loader();

      assume(loader).is.a('object');
      assume(loader.loader).equals(require.resolve('../loader'));
    });

    it('provides a internal override function that uses bundle#name', function () {
      const loader = pipeline.loader();
      const name = loader.options.internal;

      [
        path.join(__dirname, 'test.svg'),
        path.join(__dirname, 'test/bar.svg')
      ].forEach(function (filename) {
        assume(name(filename)).equals(pipeline.bundle.name(filename));
      });
    });
  });

  describe('#hash', function () {
    const content = '08080ad8fa0d98f0sd98fa0sd98fa0s lol what is this';

    it('returns the filename if theres no replace tokens', function () {
      setup('example.svgs');

      const name = pipeline.hash(content);
      assume(name).equals('example.svgs');
    });

    it('replaces [hash] with md5 hash', function () {
      setup('example.[hash].svgs');

      const name = pipeline.hash(content);
      assume(name).equals('example.a09246d44e397b3903a4fc5efd6b9566.svgs');
    });
  });
});

describe('WebPack Integration', function () {
  this.timeout(20000);

  function clonepack(merge, fn) {
    const pipeline = new Pipeline('bundle.svgs', {
      root: entry,
      namespace: true
    });

    const config = {
      entry: entry,
      output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'output.js'
      },

      module: {
        rules: [
          { test: /\.svg$/, use: pipeline.loader() }
        ]
      },

      plugins: [
        pipeline
      ]
    };

    webpack({ ...config, ...merge }, fn);
  }

  it('executes the plugin without errors', function (next) {
    clonepack({}, function (err, stats) {
      if (err) return next(err);

      if (stats.hasErrors()) {
        return next(stats.toString());
      }

      const dist = path.join(__dirname, 'dist');
      const bundle = fs.readFileSync(path.join(dist, 'bundle.svgs'), 'utf-8');
      const output = fs.readFileSync(path.join(dist, 'output.js'), 'utf-8');

      //
      // Ensure that the imports are rewritten
      //
      const sandbox = {};
      createContext(sandbox);
      runInContext(output, sandbox);

      //
      // Validate that the require statements return the name of the asset.
      //
      assume(sandbox.godaddy).equals('godaddy');
      assume(sandbox.homer).equals('deeper/homer');
      assume(sandbox.tiger).equals('tiger');

      //
      // Validate that these names are actually in the bundle.
      //
      assume(bundle).includes('"deeper/homer":');
      assume(bundle).includes('"godaddy":');
      assume(bundle).includes('"tiger":');

      next();
    });
  });

  it('allows plugin configuration through webpack', function (next) {
    clonepack({
      plugins: [
        new Pipeline('bungle.svgs', {
          plugins: [
            [
              function example(bundle, opts) {
                assume(bundle).is.instanceOf(Bundle);
                assume(opts).is.a('object');
                assume(opts.file).is.a('string');
                assume(opts.file).includes('bungle.svgs');
                assume(opts.foo).equals('bar');

                next();
              },
              { foo: 'bar' }
            ]
          ]
        })
      ]
    }, function () { /* ignore me */});
  });

  it('allows modify configuration through webpack', function (next) {
    let called = false;
    clonepack({
      plugins: [
        new Pipeline('bungle.svgs', {
          modify: {
            foo: function () {
              if (!called) {
                called = true;
                next();
              }
            }
          }
        })
      ]
    }, function () { /* ignore me */});
  });
});
