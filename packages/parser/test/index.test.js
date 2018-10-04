import AssetParser, { encode, decode, Asset, version } from '../index.js';
import { describe, it, before } from 'mocha';
import { create } from 'asset-test';
import * as svgs from 'svgs';
import assume from 'assume';
import React from 'react';

const { complex } = create(svgs, React);

describe('asset-parser', function () {
  it('exports all utilties', function () {
    assume(version).is.a('string');
    assume(encode).is.a('function');
    assume(decode).is.a('function');
    assume(Asset).is.a('function');
    assume(AssetParser).is.a('function');
  });

  describe('AssetParser', function () {
    let asset;

    function setup() {
      asset = new AssetParser();
    }

    describe('#modify', function () {
      it('registers a new hook', function () {
        setup();

        assume(asset.hooks).to.have.length(0);

        const what = () => {};
        asset.modify('what', what);

        assume(asset.hooks).to.have.length(1);
        assume(asset.hooks.what).is.a('array');
        assume(asset.hooks.what).to.have.length(1);
        assume(asset.hooks.what[0]).equals(what);
      });

      it('can register multiple modifiers for a given property', function () {
        setup();

        const one = () => {};
        const two = () => {};

        asset.modify('color', one);
        asset.modify('color', two);

        assume(asset.hooks).to.have.length(1);
        assume(asset.hooks.color).is.a('array');
        assume(asset.hooks.color).to.have.length(2);
        assume(asset.hooks.color[0]).equals(one);
        assume(asset.hooks.color[1]).equals(two);
      });

      it('ignores duplicates for a given prop', function () {
        setup();

        const one = () => {};
        const two = () => {};

        asset.modify('color', one);
        asset.modify('color', two);
        asset.modify('color', two);

        assume(asset.hooks).to.have.length(1);
        assume(asset.hooks.color).is.a('array');
        assume(asset.hooks.color).to.have.length(2);
        assume(asset.hooks.color[0]).equals(one);
        assume(asset.hooks.color[1]).equals(two);
      });
    });

    describe('#modifiers', function () {
      it('returns an array with the names of the modifiers', function () {
        setup();

        asset.modify('foo', () => {});
        asset.modify('bar', () => {});
        asset.modify('bar', () => {});

        assume(asset.modifiers()).is.a('array');
        assume(asset.modifiers()).deep.equals(['foo', 'bar']);
      });
    });

    describe('#parse', function () {
      let str;

      before((next) => {
        setup();

        encode(version, { complex: complex.structure }, (err, data) => {
          if (err) return next(err);

          str = data;
          next();
        });
      });

      it('decodes the playload and returns a list of Asset instances', function (next) {
        asset.parse('bundle', str, (err, svgs) => {
          if (err) return next(err);

          assume(err).is.a('null');
          assume(svgs).is.a('object');

          assume(svgs.complex).is.instanceOf(Asset);
          next();
        });
      });

      it('passes pass errors in to callback', function (next) {
        asset.parse('bundle', `${version}§l{}`, (err, svgs) => {
          assume(err).is.a('error');
          assume(err.message).to.contain('Unexpected token');

          assume(svgs).is.a('object');
          assume(svgs).to.have.length(0);

          next();
        });
      });

      it('returns error on invalid data structure', function (next) {
        asset.parse('bundle', `${version}§[{"foo":"bar"}]`, (err, svgs) => {
          assume(err).is.a('error');
          assume(err.message).equals(`Failed to decode payload, spec(${version})`);

          assume(svgs).is.a('object');
          assume(svgs).to.have.length(0);

          next();
        });
      });
    });
  });
});
