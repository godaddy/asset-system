import { createHash } from 'crypto';
import Bundle from 'asset-bundle';
import async from 'async';
import path from 'path';

/**
 * Get the name of the file that required this module, so we can attempt to
 * resolve a sensible default root directory for the plugin.
 *
 * @type {String}
 * @private
 */
var requiredRoot = module.parent && module.parent.filename;
delete require.cache[__filename];

if (!requiredRoot || !~requiredRoot.indexOf('webpack.config.js')) {
  requiredRoot = process.cwd();
}

class WebPack {
  constructor(name = 'bundle.svgs', options = {}) {
    const { plugins, namespace, bundler, modify, root } = options;

    this.name = name;     // Name of the file that needs to be written to disk.
    this.output = '';     // Output directly that we receive from webpack.

    //
    // Create the asset-bundle, but instead of passing it with paths
    // we need to pass it an empty array. We're going to call the processing
    // steps our selfs as we don't have the assets yet.
    //
    this.bundle = new Bundle([], {
      root: namespace ? path.dirname(root || requiredRoot) : null,
      ...(bundler || {})
    });

    //
    // Assign plugins to the provider if we have them.
    //
    if (Array.isArray(plugins)) plugins.forEach((args) => {
      const Constructor = args.shift();
      const opts = args.shift() || {};

      Object.defineProperty(opts, 'file', {
        get: () => {
          return path.join(this.output, name);
        }
      });

      this.bundle.plugin(Constructor, opts);
    });

    //
    // Assign modify functions to the bundler.
    //
    if (typeof modify === 'object') Object.keys(modify).forEach((key) => {
      this.bundle.modify(key, modify[key]);
    });
  }

  /**
   * Generate the filename.
   *
   * @param {String} contents The bundle that was produced.
   * @returns {String} The filename.
   * @private
   */
  hash(contents) {
    if (!~this.name.indexOf('[')) return this.name;

    const hash = createHash('md5');
    hash.update(contents);

    return this.name.replace('[hash]', hash.digest('hex'));
  }

  /**
   * Returns the loader logic for a given WebPack Rule. This ensures that the
   * loader will be correctly configured.
   *
   * @returns {Object} Use information for WebPack
   * @public
   */
  loader() {
    return {
      loader: require.resolve('./loader'),
      options: {
        external: '[path][name].[ext]',
        internal: (file) => this.bundle.name(file)
      }
    };
  }

  /**
   * Apply the plugin.
   *
   * @param {Object} compiler The WebPack compiler
   * @private
   */
  apply(compiler) {
    compiler.plugin('this-compilation', (compilation) => {
      const options = compilation.options;
      const output = options.output.path;
      const bundle = this.bundle;

      this.output = output;

      compilation.plugin('optimize-assets', (assets, next) => {
        const files = [];

        compilation.modules.forEach((module) => {
          const loc = module.resource;

          if (!loc || !loc.match(/\.svg$/)) return;

          const hash = Object.keys(module.assets)[0];
          const data = module.assets[hash].source();
          const name = bundle.name(loc);

          //
          // We want to avoid addition reads in our bundle process. So
          // we're going to mimic the output of the `bundle#parse` and
          // create the resulting structure our selfs.
          //
          files.push({ name, loc, data });

          //
          // Now we don't want this file to end up in the bundle so we need
          // to remove it. In addition to that we need to rewrite the source.
          // So the `require(svgfile)` will just return the `name` of which
          // it's known in the bundle
          //
          delete assets[hash];
        });

        //
        // Because we've already read the paths, we need to manually
        // execute the processing waterfall.
        //
        async.waterfall([
          bundle.optimize.bind(bundle, files),
          bundle.parse.bind(bundle),
          bundle.viewBox.bind(bundle),
          bundle.traverse.bind(bundle),
          bundle.encode.bind(bundle)
        ], (err, contents) => {
          if (err) throw err;

          const hash = this.hash(contents);
          const filename = compilation.getPath(hash, {});

          //
          // Register the new asset.
          //
          assets[filename] = {
            source: () => contents,
            size: () => contents.length
          };

          next();
        });
      });
    });
  }
}

//
// Use the Node.js exports so we can require the code without .default
//
module.exports = WebPack;
