import dimensions from '../dimensions';
import { describe, it } from 'mocha';
import Bundle from '../index';
import assume from 'assume';
import path from 'path';

const fixtures = path.join(__dirname, '..', '..', '..', 'test', 'fixtures');

describe('dimensions', function () {
  this.timeout(100000);

  function setup(asset, next) {
    const bundle = new Bundle([asset]);

    bundle.read([asset], function (err, files) {
      if (err) return next(err);

      bundle.optimize(files, function (fail, svgos) {
        if (fail) return next(fail);

        bundle.parse(svgos, function (errs, data) {
          if (err) return next(errs);

          bundle.traverse(data, next);
        });
      });
    });
  }

  it('extracts the viewBox from the svg', function (next) {
    const godaddy = path.join(fixtures, 'godaddy.svg');

    setup(godaddy, function (err, svgs) {
      if (err) return next(err);

      const item = svgs[0];
      assume(item.viewBox).is.a('undefined');

      dimensions(item, function (err, svg) {
        assume(err).is.a('null');
        assume(svg).equals(item);

        assume(item.viewBox).equals('0 0 127 55.2');
        next();
      });
    });
  });

  it('extracts the full viewBox by rendering headless', function (next) {
    const tiger = path.join(fixtures, 'tiger.svg');

    setup(tiger, function (err, svgs) {
      if (err) return next(err);

      const item = svgs[0];
      assume(item.viewBox).is.a('undefined');

      dimensions(item, function (err, svg) {
        assume(err).is.a('null');
        assume(svg).equals(item);

        assume(item.viewBox).is.a('string');
        assume(item.viewBox).equals('16.072994232177734 55.62681579589844 493.87457275390625 509.17413330078125');
        next();
      });
    });
  });
});
