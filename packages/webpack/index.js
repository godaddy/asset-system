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

/**
 * WebPack wrapper for the asset-bundle module.
 *
 * @constructor
 * @param {String} filename The location of where the asset should be written.
 * @param {Object} options asset-bundle options.
 * @public
 */
class WebPack {
  constructor(filename, options) {
    this.options = options;
    this.name = filename;
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
   * Apply the plugin.
   *
   * @param {Object} compiler The WebPack compiler
   * @private
   */
  apply(compiler) {
    compiler.plugin('this-compilation', (compilation) => {
      const options = compilation.options;
      const output = options.output.path;

      compilation.plugin('optimize-assets', (assets, next) => {
        const { plugins, namespace, bundler, modify, root } = this.options;
        const files = [];

        //
        // Create the asset-bundle, but instead of passing it with paths
        // we need to pass it an empty array. We're going to call the processing
        // steps our selfs as we don't have the assets yet.
        //
        const bundle = new Bundle([], {
          root: namespace ? path.dirname(root || requiredRoot) : null,
          ...(bundler || {})
        });

        //
        // Assign plugins to the provider if we have them.
        //
        if (Array.isArray(plugins)) plugins.forEach((args) => {
          const Constructor = args.shift();
          const options = args.shift() || {};

          bundle.plugin(Constructor, { ...options, file: path.join(output, this.name) });
        });

        //
        // Assign modify functions to the bundler.
        //
        if (typeof modify === 'object') Object.keys(modify).forEach((key) => {
          bundle.modify(key, modify[key]);
        });

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

          //
          // Change the original `require('/lol/what.svg')` to return the
          // resulting name. So you can still do:
          //
          // <AssetProvider uri=''>
          //  <Asset name={ require('./path/to/icon.svg') } />
          // </AssetProvider>
          //
          // Do not touch the following lines, internals are evil. But a
          // nessecary evil to make this spawn from hell work.
          //
          // This hack is stolen from NormalModule#build of the WebPack
          // source. If this breaks, it's most likely this, good luck
          // fixing it brave soul that reads this.
          //
          // 1. Removing the __webpack_public_path__ will break the build;
          // 2. Multi line code will break the build;
          // 3. Not doing a module.exports = __webpack_public_path__ breaks;
          // 4. As __webpack_public_path__ can be set, we cant use `? x : y`
          // 5. As __webpack_public_path__ can be "" we cant `x && y`;
          // 6. We can't even wrap it in () to create: module.exports (__wpp_, y);
          //
          // However, doing a double override of the `module.exports` does work
          // this means we only have to store the (potentially long) name of
          // the asset once in the new source of the require.
          //
          // Have mercy on the brave soul that will ever have to debug this
          // madness.
          //
          // Days wasted by this webpack bullshit: 2
          //
          module._source._value = 'module.exports = __webpack_public_path__; module.exports =' + JSON.stringify(name);
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
