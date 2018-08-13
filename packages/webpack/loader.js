import utils from 'loader-utils';

/**
 * The smallest loader we could get away with.
 *
 * @param {Content} content The content that needs to be loaded.
 * @returns {String} Name of the file in the svg bundle.
 */
module.exports = function svgLoader(content) {
  const options = utils.getOptions(this) || {};
  const context = options.context || this.rootContext || this.options && this.options.context;
  const opts = { context, content };

  //
  // Create internal and external names:
  //
  // Internal: How it ends up in the bundle so can be used as name prop.
  // External: Simple name to identify it during the WebPack plugin phase.
  //
  const external = utils.interpolateName(this, options.external, opts);
  const internal = utils.interpolateName(this, options.internal, opts);

  //
  // Ensures that these custom files end-up in `optimize-assets` event of
  // WebPack so we can intercept them.
  //
  this.emitFile(external, content);
  return `module.exports = ${JSON.stringify(internal)};`;
};
