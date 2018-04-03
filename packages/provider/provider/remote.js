import diagnostics from 'diagnostics';
import loader from '../loader';
import Queue from 'queueback';

//
// Setup our debug util.
//
const debug = diagnostics('asset:provider:remote');

/**
 * Fetch remote assets, and process them.
 *
 * @constructor
 * @public
 */
export default class Remote extends Queue {
  constructor() {
    super();

    this.cache = {};
  }

  /**
   * Fetch a given resource and parse it's outcome, store it, and send it to
   * all other requests that were waiting for the same response.
   *
   * @param {Object} options Request options.
   * @param {AssetParser} parser AssetParser instance
   * @param {Function} fn Error first completion callback
   * @returns {Undefined|Boolean} Indication of cached, queued or loaded response.
   * @public
   */
  fetch(options, parser, fn) {
    const { method, uri, format, timeout } = options;
    const id = this.id(method, uri);
    const item = this.cache[id];

    //
    // Fastest option first, it's already cached, or we already fetching the
    // exact same URI.
    //
    if (item) {
      debug(`the requested uri(${uri}) was already requested and cached`);
      return fn(null, item);
    }

    if (this.add(method, uri, fn)) {
      debug(`the requested uri(${uri}) was already requested, waiting for callback`);
      return true;
    }

    /**
     * Generic processing function for parser and loader responses.
     *
     * @param {Error} err Optional error.
     * @param {Object} data Parsed data.
     * @private
     */
    const loaded = (err, data) => {
      const error = err || null;
      const svgs = data || {};

      //
      // Worth noting, we don't want to cache errors even if it means that
      // multiple requests will be send. In unexpected slowness or downtime of
      // a CDN we might be able to fetch a resource in the end. Especially
      // important for native devices!
      //
      if (!error) this.cache[id] = svgs;
      this.run(method, uri, error, svgs);
    };

    debug(`first time requesting uri(${uri})`);
    loader(uri, { timeout, method }, (err, data) => {
      if (err) return loaded(err);

      parser.parse(format, data, loaded);
    });

    return false;
  }
}
