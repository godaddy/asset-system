/**
 * Our "unique" indentifier that signals the end of the specification version
 * number and the start of the actual encoded payload for that given version
 * number.
 *
 * @type {String}
 * @private
 */
const identifier = '§';

/**
 * Decode the data structure.
 *
 * @param {String} str String that needs to be decoded.
 * @param {Function} fn Error first completion callback.
 * @returns {undefined} Nope.
 * @public
 */
export function decode(str, fn) {
  let data;

  //
  // The bundle will be prefixed with the version of the bundle specification
  // that we follow, so we need to extract that version number before we can
  // parse the payload.
  //
  const end = str.indexOf(identifier);
  const version = str.slice(0, end);
  const payload = str.slice(end + identifier.length);

  try { data = JSON.parse(payload); } catch (e) { return fn(e); }

  fn(null, { data, version });
}

/**
 * Pack the data structure.
 *
 * @param {String} spec Specification number.
 * @param {Object} data Object structurethat needs to be encoded.
 * @param {Function} fn Error first completion callback.
 * @returns {undefined} Nope.
 * @public
 */
export function encode(spec, data, fn) {
  let result;

  try { result = JSON.stringify(data); } catch (e) { return fn(e); }

  fn(null, `${spec}${identifier}${result}`);
}
