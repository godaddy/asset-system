import { describe, it, beforeEach } from 'mocha';
import { remote, cache, queue } from '../provider/remote';
import { decode } from 'asset-parser';
import { complex } from './fixtures';
import assume from 'assume';

describe('remote', function () {
  const url = 'http://example.com/complex/bundle.svg';
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

  function nukeCache() {
    for (let key in cache) delete cache[key];
  }

  beforeEach(nukeCache);
  afterEach(nukeCache);

  it('returns items from cache', function (next) {
    const item = queue.id(method, url);
    const mock = { hello: 'world' };

    cache[item] = mock;

    remote({ format, url }, { parse }, (err, data) => {
      assume(err).is.a('null');
      assume(data).equals(mock);

      next();
    });
  });

  it('returns `undefined` when a response is cached', function () {
    const item = queue.id(method, url);
    const mock = { hello: 'world' };

    cache[item] = mock;

    assume(remote({ format, url }, { parse }, () => {})).is.a('undefined');
  });

  it('returns `true` when a request for the same URL is progress', function () {
    assume(remote({ format, url }, { parse }, () => {})).is.false();
    assume(remote({ format, url }, { parse }, () => {})).is.true();
    assume(remote({ format, url }, { parse }, () => {})).is.true();
    assume(remote({ format, url }, { parse }, () => {})).is.true();
  });

  [404, 500].forEach(function each(status) {
    it(`does not store items in cache on ${status} error`, function (next) {
      assume(cache).is.length(0);

      /*eslint-disable */
      remote({
        url: `http://example.com/${status}`,
        format
      }, { parse }, (err, data) => {
        assume(err.message).is.a('string');
        assume(data).is.a('object');

        assume(cache).is.length(0);

        next();
      });
      /* eslint-enable */
    });
  });

  it(`does not store items in cache on error`, function (next) {
    assume(cache).is.length(0);
    remote({
      url: `http://example-non-existing-nobody-buy-this-domain-plx.lol/`,
      format
    }, { parse }, (err, data) => {
      assume(err.message).is.a('string');
      assume(data).is.a('object');
      assume(cache['GET:http://example-non-existing-nobody-buy-this-domain-plx.lol/']).is.a('undefined');

      next();
    });
  });

  it('calls the parser when data is received correctly', function (next) {
    remote({ format, url }, { parse: (form, data, fn) => {
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
    const item = queue.id(method, url);
    const mock = { hello: 'world' };

    assume(cache).is.length(0);

    remote({ format, url }, { parse: (form, data, fn) => {
      fn(null, mock);
    } }, (err, data) => {
      assume(data).equals(mock);
      assume(cache).is.length(1);
      assume(cache[item]).equals(mock);

      next(err);
    });
  });

  it('broadcasts the parsed and cached data to all queued fns', function (next) {
    next = assume.wait(3, next);

    ['green', 'green', 'green'].forEach(function (name) {
      remote({
        url: `http://example.com/${name}/bundle.svgs`,
        format
      }, { parse }, (err, svgs) => {
        assume(svgs).is.a('object');
        next(err);
      });
    });
  });
});
