import diagnostics from 'diagnostics';
import Queue from 'queueback';

//
// Setup our debug util.
//
const debug = diagnostics('asset:provider:remote');

//
// Cache and Queue setup to prevent duplicate HTTP requests.
//
const queue = new Queue();
const cache = {};

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
function remote(options, parser, fn) {
  const { url, format } = options;
  const id = queue.id('GET', url);
  const item = cache[id];

  //
  // Fastest option first, it's already cached, or we already fetching the
  // exact same URI.
  //
  if (item) {
    debug(`the requested url(${url}) was already requested and cached`);
    return fn(null, item);
  }

  if (queue.add('GET', url, fn)) {
    debug(`the requested url(${url}) was already requested, waiting for callback`);
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
    if (!error) cache[id] = svgs;
    queue.run('GET', url, error, svgs);
  };

  debug(`first time requesting url(${url})`);
  fetch(url)
  .then(function status(response) {
    if (response.status >= 200 && response.status < 300) {
      return Promise.resolve(response);
    } else {
      return Promise.reject(new Error(response.statusText));
    }
  })
  .then(function parse(response) {
    return response.text();
  })
  .then(function fetched(data) {
    parser.parse(format, data, loaded);
  })
  .catch(loaded);

  return false;
}

export {
  remote as default,
  remote,
  queue,
  cache
}
