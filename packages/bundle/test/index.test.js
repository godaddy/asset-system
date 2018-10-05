import { describe, it, beforeEach } from 'mocha';
import { fixtures } from 'asset-test';
import { decode } from 'asset-parser';
import EventEmitter from 'events';
import Bundle from '../index';
import assume from 'assume';
import path from 'path';

describe('asset-bundle', function () {
  const godaddy = path.join(fixtures, 'godaddy.svg');
  let bundle;

  function nope() { /* empty callback */ }

  beforeEach(function each() {
    bundle = new Bundle([godaddy]);
  });

  it('is an instance of EventEmitter', function () {
    assume(bundle).is.instanceOf(EventEmitter);
  });

  it('deep merges config.svgo', function () {
    bundle = new Bundle([godaddy], {
      svgo: [
        { removeViewBox: true }
      ]
    });

    assume(bundle.config.root).equals(null);
    assume(bundle.config.multipass).false();
    assume(bundle.config.svgo.length).equals(Bundle.defaults.svgo.length);

    const removeViewBox = bundle.config.svgo.find(item => {
      return Object.keys(item)[0] === 'removeViewBox';
    });

    assume(removeViewBox).is.an('object');
    assume(removeViewBox.removeViewBox).true();
  });

  it('exposes the constructor through module.exports', function () {
    const BUNDLEOFJOY = require('../');

    assume(BUNDLEOFJOY).is.a('function');

    const test = new BUNDLEOFJOY([godaddy]);

    assume(test.modify).is.a('function');
    assume(test.run).is.a('function');
  });

  describe('#modify', function () {
    it('is a function', function () {
      assume(bundle.modify).is.a('function');
    });

    it('registers a new transformation hook', function () {
      assume(bundle.hooks).has.length(0);

      const example = () => {};
      bundle.modify('name', example);

      assume(bundle.hooks).has.length(1);
      assume(bundle.hooks.name).equals(example);
    });
  });

  describe('#plugin', function () {
    it('is a function', function () {
      assume(bundle.plugin).is.a('function');
    });

    it('executes the supplied Constructor', function (next) {
      function Test(b, o) {
        assume(b).equals(bundle);
        assume(o).equals(options);

        next();
      }

      const options = {};
      assume(bundle.plugin(Test, options)).is.instanceOf(Test);
    });
  });

  describe('#name', function () {
    it('is a function', function () {
      assume(bundle.name).is.a('function');
    });

    it('produces the name of the asset based on the file name', function () {
      const loc = '/foo/bar/hello-world.svg';
      const name = bundle.name(loc);

      assume(name).equals('hello-world');
    });

    it('uses folder names as namespace when root option is provided', function () {
      bundle = new Bundle([godaddy], {
        root: __dirname
      });

      const loc = path.join(__dirname, 'name', 'space', 'ship.svg');
      const name = bundle.name(loc);

      assume(name).equals('name/space/ship');
    });
  });

  describe('#read', function () {
    it('is a function', function () {
      assume(bundle.read).is.a('function');
    });

    it('reads the passed files', function (next) {
      bundle.read([godaddy], function (err, svgs) {
        assume(err).is.a('null');
        assume(svgs).is.a('array');
        assume(svgs).is.length(1);

        const item = svgs[0];

        assume(item.name).equals('godaddy');
        assume(item.loc).equals(godaddy);
        assume(item.data).is.a('string');
        assume(item.data).contains('Generator: Adobe Illustrator 18.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)');

        next();
      });
    });

    it('calls with error when file does not exist', function (next) {
      bundle.read([path.join(fixtures, 'does-not.exist')], function (err) {
        assume(err).is.a('error');

        next();
      });
    });

    it('emits the `read` event', function (next) {
      bundle.once('read', function (err, svgs) {
        assume(err).is.a('null');
        assume(svgs).is.a('array');

        const item = svgs[0];

        assume(item.name).equals('godaddy');
        assume(item.loc).equals(godaddy);
        assume(item.data).is.a('string');
        assume(item.data).contains('Generator: Adobe Illustrator 18.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)');

        next();
      });

      bundle.read([godaddy], nope);
    });
  });

  describe('#optimize', function () {
    let data;

    before(function (next) {
      bundle.read([godaddy], function (err, svgs) {
        if (err) return next(err);

        data = svgs;
        next();
      });
    });

    it('is a function', function () {
      assume(bundle.optimize).is.a('function');
    });

    it('optimizes the svgs', function (next) {
      bundle.optimize(data, function (err, svgs) {
        assume(err).is.a('null');
        assume(svgs).is.a('array');
        assume(svgs).is.length(1);

        const item = svgs[0];

        assume(item.name).equals('godaddy');
        assume(item.loc).equals(godaddy);
        assume(item.info).is.a('object');
        assume(item.data).is.a('string');
        assume(item.data).does.not.contain('Generator: Adobe Illustrator 18.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)');

        next();
      });
    });

    it('calls with an error on incorrect svg data', function (next) {
      bundle.optimize([{
        name: 'lol',
        data: '@not really data@',
        loc: __filename
      }], function (err) {
        assume(err).is.a('error');

        next();
      });
    });

    it('emits the `optimize` event', function (next) {
      bundle.once('optimize', function (err, svgs) {
        assume(err).is.a('null');
        assume(svgs).is.a('array');
        assume(svgs).is.length(1);

        const item = svgs[0];

        assume(item.name).equals('godaddy');
        assume(item.loc).equals(godaddy);
        assume(item.info).is.a('object');
        assume(item.data).is.a('string');
        assume(item.data).does.not.contain('Generator: Adobe Illustrator 18.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)');

        next();
      });

      bundle.optimize(data, nope);
    });
  });

  describe('#parse', function () {
    it('is a function', function () {
      assume(bundle.optimize).is.a('function');
    });

    it('parses svg data into a DOM tree', function (next) {
      bundle.read([godaddy], function (err, data) {
        if (err) return next(err);

        bundle.parse(data, function (errs, svgs) {
          assume(errs).is.a('null');
          assume(svgs).is.a('array');
          assume(svgs).has.length(1);

          const item = svgs[0];

          assume(item.tree).is.not.a('null');
          next();
        });
      });
    });

    it('emits the `parse` event', function (next) {
      bundle.once('parse', function (errs, svgs) {
        assume(errs).is.a('null');
        assume(svgs).is.a('array');
        assume(svgs).has.length(1);

        const item = svgs[0];

        assume(item.tree).is.not.a('null');
        next();
      });

      bundle.read([godaddy], function (err, data) {
        bundle.parse(data, nope);
      });
    });
  });

  describe('#traverse', function () {
    let data;

    before(function (next) {
      bundle.read([godaddy], function (err, files) {
        if (err) return next(err);

        bundle.parse(files, function (errs, svgs) {
          if (err) return next(errs);

          data = svgs;
          next();
        });
      });
    });

    it('is a function', function () {
      assume(bundle.traverse).is.a('function');
    });

    it('transform the DOM structure in a array', function (next) {
      bundle.traverse(data, function (err, svgs) {
        assume(err).is.a('null');

        assume(svgs).is.a('array');
        assume(svgs).has.length(1);

        const item = svgs[0];

        assume(item.struc).is.a('array');
        next();
      });
    });

    it('calls the transformation hook', function (next) {
      bundle.modify('ellipse', function (attrs, element, name) {
        if (name !== 'Ellipse') return;

        attrs.example = 'cool';
        return 'RENAMED THE COMPONENT';
      });

      bundle.traverse(data, function (err, svgs) {
        assume(err).is.a('null');

        const struc = svgs[0].struc;

        struc[struc.length - 1].forEach(function (item) {
          if (item[0] !== 'RENAMED THE COMPONENT') return;

          assume(item[1]).is.a('object');
          assume(item[1].example).equals('cool');

          next();
        });
      });
    });

    it('emits the `traverse` event', function (next) {
      bundle.once('traverse', function (err, svgs) {
        assume(err).is.a('null');

        assume(svgs).is.a('array');
        assume(svgs).has.length(1);

        const item = svgs[0];

        assume(item.struc).is.a('array');
        next();
      });

      bundle.traverse(data, nope);
    });
  });

  describe('#viewBox', function () {
    let data;

    before(function (next) {
      bundle.read([godaddy], function (err, files) {
        if (err) return next(err);

        bundle.parse(files, function (errs, svgs) {
          if (err) return next(errs);

          data = svgs;
          next();
        });
      });
    });

    it('has a viewBox function', function () {
      assume(bundle.viewBox).is.a('function');
    });

    it('emits the `viewBox` event', function (next) {
      bundle.once('viewBox', function (err, svgs) {
        assume(err).is.a('null');

        assume(svgs).is.a('array');
        assume(svgs).has.length(1);

        const item = svgs[0];

        assume(item.viewBox).is.a('string');
        next();
      });

      bundle.viewBox(data, nope);
    });
  });

  describe('#encode', function () {
    let data;

    before(function (next) {
      bundle.read([godaddy], function (err, files) {
        if (err) return next(err);

        bundle.parse(files, function (errs, trees) {
          if (errs) return next(errs);

          bundle.traverse(trees, function (fail, svgs) {
            if (fail) return next(fail);

            data = svgs;
            next();
          });
        });
      });
    });

    it('is a function', function () {
      assume(bundle.encode).is.a('function');
    });

    it('transforms the traversed tree in the resulting bundle', function (next) {
      bundle.encode(data, function (err, str) {
        assume(err).is.a('null');
        assume(str).is.a('string');

        next();
      });
    });

    it('is encoded using `asset-parser`', function (next) {
      bundle.encode(data, function (err, str) {
        assume(err).is.a('null');
        assume(str).is.a('string');

        decode(str, function (errs, payload) {
          if (errs) return next(errs);

          const version = payload.version;
          const svgs = payload.data;

          assume(version).equals(bundle.specification);
          assume(svgs).is.a('object');
          assume(svgs.godaddy).is.a('array');
          assume(svgs.godaddy).deep.equals(data[0].struc);

          next();
        });
      });
    });

    it('emits the `done` event', function (next) {
      bundle.once('done', function (err, str, svgs) {
        assume(err).is.a('null');
        assume(str).is.a('string');

        assume(svgs).is.a('array');
        assume(svgs).has.length(1);

        const item = svgs[0];

        assume(item).is.a('object');

        next();
      });

      bundle.encode(data, nope);
    });
  });

  describe('#run', function () {
    it('is a function', function () {
      assume(bundle.run).is.a('function');
    });

    it('executes all the steps', function (next) {
      bundle.run(function (err, str) {
        assume(err).is.a('null');
        assume(str).is.a('string');

        decode(str, function (errs, payload) {
          assume(errs).is.a('null');
          assume(payload).is.a('object');

          const version = payload.version;
          const svgs = payload.data;

          assume(version).equals(bundle.specification);
          assume(svgs).is.a('object');
          assume(svgs.godaddy).is.a('array');

          next();
        });
      });
    });
  });

  describe('svgo', function () {
    it('does not mangle classNames', function (next) {
      const fixture = path.join(fixtures, 'homer-classnames.svg');
      const bundler = new Bundle([ fixture ]);

      bundler.run((err, str) => {
        assume(err).is.a('null');
        assume(str).is.a('string');

        assume(str).includes('"className":"another multiple names"');
        assume(str).includes('{"className":"classnames-on-group"}');

        next();
      });
    });
  });
});
