import { describe, it, beforeEach } from 'mocha';
import Remote from '../provider/remote';
import { decode } from 'asset-parser';
import { complex } from './fixtures';
import assume from 'assume';

describe('Remote', function () {
  const uri = 'http://example.com/complex/bundle.svg';
  const format = 'bundle';
  const method = 'GET';

  function parse(form, data, fn) {
    if (typeof data === 'string') {
      return decode(data, function (err, payload) {
        if (err) return fn(err);

        return fn(null, payload.data);

      });
    }

    fn(null, {});
  }

  let remote;

  beforeEach(function each() {
    remote = new Remote();
  });

  describe('#fetch', function () {
    it('returns items from cache', function (next) {
      const item = remote.queue.id(method, uri);
      const mock = { hello: 'world' };

      remote.cache[item] = mock;

      remote.fetch({ format, method, uri }, { parse }, (err, data) => {
        assume(err).is.a('null');
        assume(data).equals(mock);

        next();
      });
    });

    it('returns `undefined` when a response is cached', function () {
      const item = remote.queue.id(method, uri);
      const mock = { hello: 'world' };

      remote.cache[item] = mock;

      assume(remote.fetch({ format, method, uri }, { parse }, () => {})).is.a('undefined');
    });

    it('returns `true` when a request for the same URL is progress', function () {
      assume(remote.fetch({ format, method, uri }, { parse }, () => {})).is.false();
      assume(remote.fetch({ format, method, uri }, { parse }, () => {})).is.true();
      assume(remote.fetch({ format, method, uri }, { parse }, () => {})).is.true();
      assume(remote.fetch({ format, method, uri }, { parse }, () => {})).is.true();
    });

    [404, 500].forEach(function each(status) {
      it(`does not store items in cache on ${status} error`, function (next) {
        assume(remote.cache).is.length(0);

        /*eslint-disable */
        remote.fetch({
          uri: `http://example.com/${status}`,
          format,
          method
        }, { parse }, (err, data) => {
          assume(err).is.a('error');
          assume(data).is.a('object');

          assume(remote.cache).is.length(0);

          next();
        });
        /* eslint-enable */
      });
    });

    it(`does not store items in cache on error`, function (next) {
      assume(remote.cache).is.length(0);

      remote.fetch({
        uri: `http://example-non-existing-nobody-buy-this-domain-plx.lol/`,
        timeout: 10, // Just to speed up the test here so it fails faster
        format,
        method
      }, { parse }, (err, data) => {
        assume(err).is.a('error');
        assume(data).is.a('object');
        assume(remote.cache).is.length(0);
        next();
      });
    });

    it('calls the parser when data is received correctly', function (next) {
      remote.fetch({ format, method, uri }, { parse: (form, data, fn) => {
        assume(form).equals(format);
        assume(data).is.a('string');
        assume(fn).is.a('function');

        decode(data, function (err, payload) {
          if (err) return fn(err);

          assume(payload.version).is.a('string');
          assume(payload.data).is.a('object');
          assume(payload.data).deep.equals(complex);

          fn(null, { what: 'lol' });
        });
      } }, (err, data) => {
        assume(data).deep.equals({ what: 'lol' });
        next(err);
      });
    });

    it('caches the correctly parsed data', function (next) {
      const item = remote.queue.id(method, uri);
      const mock = { hello: 'world' };

      assume(remote.cache).is.length(0);

      remote.fetch({ format, method, uri }, { parse: (form, data, fn) => {
        fn(null, mock);
      } }, (err, data) => {
        assume(data).equals(mock);
        assume(remote.cache).is.length(1);
        assume(remote.cache[item]).equals(mock);

        next(err);
      });
    });

    it('broadcasts the parsed and cached data to all queued fns', function (next) {
      next = assume.wait(3, next);

      ['green', 'green', 'green'].forEach(function (name) {
        remote.fetch({
          uri: `http://example.com/${name}/bundle.svgs`,
          format,
          method
        }, { parse }, (err, svgs) => {
          assume(svgs).is.a('object');
          next(err);
        });
      });
    });
  });
});
