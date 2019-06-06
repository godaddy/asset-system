import { encode, decode } from './packer';
import diagnostics from 'diagnostics';
import Asset from './asset';

//
// Setup our debug util.
//
const debug = diagnostics('asset:parser:transform');

/**
 * The version of the specification that we currently follow.
 *
 * @type {String}
 * @public
 */
export const version = '0.1.0';

/**
 * Defines the parser function.
 *
 * @constructor
 * @public
 */
export default class Parser {
  constructor() {
    this.version = version;   // Version number of the spec we follow.
    this.hooks = {};          // Stores our modifer functions.
  }

  /**
   * Register a new modification hook.
   *
   * @param {String} name Name property the transformer should trigger on.
   * @param {Function} fn Callback that transforms.
   * @public
   */
  modify(name, fn) {
    debug(`registered a new tranform hook(${name})`);

    if (!(name in this.hooks)) this.hooks[name] = [];
    if (!~this.hooks[name].indexOf(fn)) this.hooks[name].push(fn);
  }

  /**
   * Returns an array of properties that we have modifiers registered for.
   *
   * @returns {Array} List of properties.
   * @public
   */
  modifiers() {
    return Object.keys(this.hooks);
  }

  /**
   * Parse the received data.
   *
   * @param {String} format How is the data supplied.
   * @param {String} str Input that needs to be parsed to individual assets.
   * @param {Function} fn Error first completion callback.
   * @public
   */
  parse(format, str, fn) {
    /**
     * Transforms the data structure into a format that can be used by the
     * React SVG Asset Provider.
     *
     * @param {Object} data Object where key is name, and value is an array.
     * @param {String} spec Specification version in which the data is encoded.
     * @private
     */
    const transform = (data, spec) => {
      const assets = Object.keys(data).reduce((memo, key) => {
        if (Array.isArray(data[key])) {
          debug(`transforming ${key} in to an Asset`);
          memo[key] = new Asset(data[key], this.hooks, spec);
        }

        return memo;
      }, {});

      fn(null, assets);
    };

    /**
     * Handle the decoded data and process it into Assets.
     *
     * @param {Error} err Optional error that happend during decoding.
     * @param {Object} payload Data structure containing the svg names, data.
     * @returns {Undefined} Nope.
     * @private
     */
    const decoded = (err, payload) => {
      if (err) {
        debug('failed to decode the supplied string, most likely invalid JSON', err);
        return fn(err, {});
      }

      const data = payload.data;
      const spec = payload.version;

      if (typeof data === 'object' && !Array.isArray(data)) {
        debug(`received correct payload, encoded in spec(${spec})`);
        return transform(data, spec);
      }

      debug('incorrect payload structure', data, spec);
      fn(new Error(`Failed to decode payload, spec(${spec})`), {});
    };

    decode(str, decoded);
  }
}

//
// Export all the components, parsers and utilities.
//
export {
  encode,
  decode,
  Asset
};
