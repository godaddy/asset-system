import { describe, it } from 'mocha';
import * as walker from '../walker';
import assume from 'assume';

describe('walker', function () {
  describe('#componentName', function () {
    it('transforms svg elements to svgs component names', function () {
      assume(walker.componentName('tspan')).equals('TSpan');
      assume(walker.componentName('path')).equals('Path');
      assume(walker.componentName('radialGradient')).equals('RadialGradient');
    });
  });

  describe('#attributes', function () {
    it('camelCases the attributes', function () {
      const result = walker.attributes({
        'stroke-width': '10px'
      });

      assume(result).has.length(1);
      assume(result.strokeWidth).equals('10px');
    });

    it('renames properties if needed', function () {
      const result = walker.attributes({
        class: 'blue'
      });

      assume(result).has.length(1);
      assume(result.className).equals('blue');
    });

    it('transforms values to number when possible', function () {
      const result = walker.attributes({
        height: '10'
      });

      assume(result).has.length(1);
      assume(result.height).equals(10);
    });
  });
});
