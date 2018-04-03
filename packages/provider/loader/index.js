import diagnostics from 'diagnostics';
import requests from 'requests';

//
// Setup our debug util.
//
const debug = diagnostics('asset:provider:loader');

/**
 * Loads a given URL.
 *
 * @param {String} uri The URL that needs to be loaded.
 * @param {Object} options Addition configuration for the request.
 * @param {Function} fn Error first completion callback.
 * @public
 */
export default function loader(uri, options, fn) {
  const req = requests(uri, { ...options, mode: 'no cors' });
  const chunks = [];

  debug('requesting new remote payload', uri);

  /**
   * Process incoming data.
   *
   * @param {String} data Chunk of data
   * @private
   */
  req.on('data', (data) => {
    chunks.push(data);
  });

  /**
   * Request is done, handle all the response chunks.
   *
   * @param {Error} err Optional error if the request ended with an error.
   * @param {Object} status Status code information.
   * @private
   */
  req.on('end', (err, status) => {
    if (err) {
      debug(`failed to retrieve ${uri} due to error`, err);
      return fn(err);
    }

    if (status.error) {
      debug(`failed to retrieve ${uri} as we received an invalid status code`, status);
      return fn(new Error('Invalid status code received'));
    }

    debug(`received payload for ${uri}`, status);
    fn(null, chunks.join(''));
  });
}
