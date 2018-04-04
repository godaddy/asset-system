import Bundle from '../../bundle/index.js';
import List from '../index.js';
import assume from 'assume';
import clone from 'clone';
import path from 'path';

describe('List', function () {
  const fixtures = path.join(__dirname, '..', '..', '..', 'test', 'fixtures');

  const godaddy = path.join(fixtures, 'godaddy.svg');
  const tiger = path.join(fixtures, 'tiger.svg');
  const homer = path.join(fixtures, 'homer.svg');

  let output;
  let bundle;
  let svgs;
  let svg;
  let list;

  before(function (next) {
    this.timeout(20000);

    bundle = new Bundle([ godaddy, tiger, homer ]);
    bundle.once('done', (err, out, data) => {
      output = out;
      svgs = data;
      svg = data[0];

      next();
    });

    bundle.run(function nope(err) {
      if (err) next(err);
    });

    list = new List(bundle, {
      file: path.join(__dirname, '..', 'dist', 'bundle.svgs')
    });
  });

  describe('#link', function () {
    it('is a function', function () {
      assume(list.link).is.a('function');
    });

    it('removes slashes', function () {
      assume(list.link('hello/world')).equals('helloworld');
    });

    it('lowercases', function () {
      assume(list.link('WHATDOING')).equals('whatdoing');
    });

    it('removes spaces', function () {
      assume(list.link('Long title here')).equals('long-title-here');
    });

    it('removes - suffix', function () {
      assume(list.link('Long title here-')).equals('long-title-here');
    });
  });

  describe('#contents', function () {
    it('is a function', function () {
      assume(list.contents).is.a('function');
    });

    it('generates a table of contents', function () {
      const res = list.contents(clone(svgs));

      assume(res).is.a('string');
      assume(res).contains('## Table of Contents');
      assume(res).contains('- [godaddy](#godaddy)');
    });

    it('generates deep indentation for namespaces', function () {
      const res = list.contents([
        { name: 'foo' },
        { name: 'foo/bar' },
        { name: 'foo/bar/baz' },
        { name: 'foo/bar/world' },
        { name: 'hello' },
        { name: 'unknown/namespace' }
      ]);

      assume(res).contains('  - [foo](#foo)');
      assume(res).contains('    - [bar](#foobar)')
      assume(res).contains('      - [world](#foobarworld)');

      assume(res).contains('  - unknown');
      assume(res).contains('    - [namespace](#unknownnamespace)');
    });
  });

  describe('#details', function () {
    it('is a function', function () {
      assume(list.details).is.a('function');
    });

    it('includes the details of the bundle', function () {
      const res = list.details(output, clone(svgs));

      assume(res).contains('- **81.2KB** uncompressed');
      assume(res).contains('- **30.99KB** compressed(gzip)');
      assume(res).contains('- Contains **3** asset');
      assume(res).contains('- Build according to specification **0.1.0**');
    });
  });

  describe('#categories', function () {
    it('is a function', function () {
      assume(list.categories).is.a('function');
    });

    it('returns an object', function () {
      const res = list.categories([
        { name: 'foo' },
        { name: 'foo/bar' },
        { name: 'foo/bar/baz' },
        { name: 'foo/bar/world' },
        { name: 'hello' }
      ]);

      assume(res).is.a('object');
    });
  });

  describe('#asset', function () {
    it('is a function', function () {
      assume(list.asset).is.a('function');
    });

    it('includes the name of the Asset as header', function () {
      const res = list.asset(svg);

      assume(res).contains('### godaddy');
    });

    it('includes an example', function () {
      const res = list.asset(svg);

      assume(res).contains('<Asset name="godaddy" width={ 127 } height={ 55.2 } />');
    });

    it('includes with width and heigh', function () {
      const res = list.asset(svg);

      assume(res).contains('| 127');
      assume(res).contains('| 55.2');
    });

    it('includes an example', function () {
      const res = list.asset(svg);

      assume(res).contains('<img src="');
    });

    it('prefixes the url with a hosted url', function () {
      const hosted = new List(bundle, {
        file: path.join(__dirname, '..', 'dist', 'bundle.svgs'),
        hosted: 'https://google.com/github/proxy/'
      });

      const res = hosted.asset(svg);
      assume(res).contains('https://google.com');
    });
  });

  describe('#generate', function () {
    it('is a function', function () {
      assume(list.generate).is.a('function');
    });

    it('emits a `done` event', function (next) {
      list.once('done', function (readme) {
        assume(readme).is.a('string');

        next();
      });

      list.generate(null, output, clone(svgs));
    });

    it('emits an `error` event when first arg is an Error', function (next) {
      list.once('error', function (err) {
        assume(err).is.a('error');
        assume(err.message).equals('F = Failure');

        next();
      });

      list.generate(new Error('F = Failure'));
    });
  });
});
