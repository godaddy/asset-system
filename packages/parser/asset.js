import React, { version } from 'react';
import diagnostics from 'diagnostics';
import { Pass } from './passthrough';
import transform from './transform';
import { G } from 'svgs';

//
// Setup our debug util.
//
const debug = diagnostics('asset:parser:asset');

/**
 * Detect which version of React we're using and if we can optimize
 * our render process.
 *
 * @type {Boolean}
 * @private
 */
const react16 = +version.slice(0, 2) >= 16;

/**
 * Representation of a single Asset of an bundle.
 *
 * @constructor
 * @param {Object} data The data structure.
 * @param {Object} hooks Methods that alter the SVG on the fly.
 * @param {String} version Version number of the specification.
 * @public
 */
export default class Asset {
  constructor(data, hooks = {}, version) {
    this.version = version;
    this.hooks = hooks;
    this.data = data;

    this.parsed = null;
  }

  /**
   * Complete the transformation and render asset into a SVG.
   *
   * @param {Object} changes Optional changes that need to be applied.
   * @returns {Object} Svg element and props.
   * @returns {React.Element} SVG content that can be displayed.
   * @public
   */
  render(changes = {}) {
    if (!this.parsed) {
      debug('first time we parse/transform the data');
      this.parsed = transform(this.data, this.version);
    }

    if (react16) return {
      props: this.parsed.props,
      svg: (
        <Pass { ...changes } modify={ this.hooks }>
          { this.parsed.svg }
        </Pass>
      )
    };

    return {
      props: this.parsed.props,
      svg: (
        <Pass { ...changes } modify={ this.hooks }>
          <G>
            { this.parsed.svg }
          </G>
        </Pass>
      )
    }
  }
}
