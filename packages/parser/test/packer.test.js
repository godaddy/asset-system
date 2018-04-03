/* eslint max-nested-callbacks: ["error", 10]*/
import { encode, decode, version as specification } from '../index.js';
import { describe, it } from 'mocha';
import assume from 'assume';

describe('packer', function () {
  describe('#encode', function () {
    it('packs an object into a string that can be decoded again', function (next) {
      const example = { foo: 'bar' };

      encode(specification, example, function (err, str) {
        assume(err).is.a('null');
        assume(str).is.a('string');

        decode(str, function (error, payload) {
          assume(error).is.a('null');
          assume(payload).is.a('object');

          const { version, data } = payload;

          assume(data).deep.equals(example);
          assume(version).equals(specification);

          next();
        });
      });
    });

    it('will call the error first on encode error', function (next) {
      const example = { foo: 'bar' };
      example.example = example; // Circular ref, explode.

      encode(specification, example, function (err, str) {
        assume(err).is.a('error');
        assume(str).is.a('undefined');

        next();
      });
    });
  });

  describe('#decode', function () {
    it('will call the callback with error first on decode error', function (next) {
      decode(`${specification}§{ not really: "data" }`, function (err, data) {
        assume(err).is.a('error');
        assume(data).is.a('undefined');

        next();
      });
    });
  });
});
