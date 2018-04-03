import diagnostics from 'diagnostics';
import dimensions from './dimensions';
import * as AP from 'asset-parser';
import EventEmitter from 'events';
import { load } from 'cheerio';
import walker from './walker';
import async from 'async';
import Svgo from 'svgo';
import path from 'path';
import fs from 'fs';

//
// Setup our debug util.
//
const debug = diagnostics('asset:bundle');

/**
 * Bundle it up.
 *
 * @param {Array} paths The files to include in the bundle.
 * @param {Object} config Configuration.
 * @constructor
 * @public
 */
class Bundle extends EventEmitter {
  constructor(paths, config = {}) {
    super();

    this.configure(config);
    this.specification = AP.version || '0.1.0';
    this.paths = paths;
    this.hooks = {};
  }

  /**
   * Save a new modifier.
   *
   * @param {String} name Name of the modifier.
   * @param {Function} fn Callback that transforms.
   * @public
   */
  modify(name, fn) {
    debug('registered new modify hook', name);
    this.hooks[name] = fn;
  }

  /**
   * Register a new plugin.
   *
   * @param {Function} Constructor The Constructor of the plugin.
   * @param {...args} args The rest of the args are spread as arguments.
   * @public
   */
  plugin(Constructor, ...args) {
    return new Constructor(this, ...args);
  }

  /**
   * Performs a deep merge of the `config` into this instance.
   * @param  {Object} config Configuration
   * @private
   */
  configure(config = {}) {
    this.config = {};
    this.config.root = config.root || Bundle.defaults.root;
    this.config.multipass = config.multipass || Bundle.defaults.multipass;

    //
    // Merge the two Arrays into a single array and create a merged Object
    // from them, then transform that Object back into an Array of Objects
    // with a single `key:value` pair.
    //
    const svgo = Bundle.defaults.svgo.concat(config.svgo || [])
      .reduce((acc, item) => {
        Object.keys(item).forEach(key => {
          acc[key] = item[key];
        });

        return acc;
      }, {});

    this.config.svgo = Object.keys(svgo).reduce((acc, key) => {
      acc.push({ [key]: svgo[key] });
      return acc;
    }, []);
  }

  /**
   * Broadcasts an event with arguments before calling the callback.
   *
   * @param {String} name Name of the event to emit.
   * @param {Function} fn Completion callback
   * @returns {Function} The broadcaster.
   * @private
   */
  broadcast(name, fn, ...rest) {
    return (...args) => {
      this.emit(name, ...[...args, ...rest]);
      fn(...args);
    };
  }

  /**
   * Generate the name for the bundle.
   *
   * @param {String} loc Location of the asset.
   * @returns {String} Name of the asset as known in the bundle.
   * @public
   */
  name(loc) {
    const ext = path.extname(loc);
    const root = this.config.root;
    let name = path.basename(loc, ext);

    //
    // In the rare case where we don't have a root directory, we just want to
    // return the name.
    //
    if (!root || loc.indexOf(root) !== 0) return name;

    name = loc.slice(root.length, -Math.abs(ext.length));
    return name.charAt(0) == '/' ? name.slice(1) : name;
  }

  /**
   * Read all the files from the provided paths.
   *
   * @param {Array} paths File paths that need to be read.
   * @param {Function} fn Error first completion callback.
   * @private
   */
  read(paths, fn) {
    async.map(paths, (loc, next) => {
      const name = this.name(loc);

      debug(`reading file(${loc})`);
      fs.readFile(loc, 'utf-8', function ready(err, data) {
        if (err) {
          debug(`failed to read file($loc)`, err);
          return next(err);
        }

        next(null, { name, data, loc });
      });
    }, this.broadcast('read', fn));
  }

  /**
   * Optimize the SVG content to something smaller.
   *
   * @param {Array} svgs Array of SVG files.
   * @param {Function} fn Error first completion callback.
   * @private
   */
  optimize(svgs, fn) {
    const config = this.config;
    const svgo = new Svgo({
      multipass: config.multipass,
      plugins: config.svgo
    });

    async.map(svgs, function optimizer(svg, reallyNext) {
      debug(`optimizing svg(${svg.name})`);

      /**
       * Escape from promise hell, delay the callback to have it execute during
       * a different tick so any errors, like assertions, are not captured as
       * promise based errors but as actual errors.
       *
       * @private
       */
      const next = function hang(...args) {
        setImmediate(function () {
          reallyNext(...args);
        });
      };

      svgo
        .optimize(svg.data, { path: svg.loc })
        .then(function ready(result) {
          next(null, { ...svg, ...result });
        })
        .catch(function catched(err) {
          if (typeof err === 'string') err = new Error(err);

          debug(`optimization process for svg(${svg.name}) failed`, err);
          next(err);
        });
    }, this.broadcast('optimize', fn));
  }

  /**
   * Generate the AST from the optimized SVG's
   *
   * @param {Array} svgos Array of Optimized SVG's
   * @param {Function} fn Error first completion callback.
   * @private
   */
  parse(svgos, fn) {
    async.map(svgos, function parse(svg, next) {
      debug(`parsing svg data into DOM tree for svg(${svg.name})`);
      svg.tree = load(svg.data, { decodeEntities: false });

      next(null, svg);
    }, this.broadcast('parse', fn));
  }

  /**
   * Ensure that all our SVG's have a proper viewBox so we can easily
   * rescale them later using width and height attributes.
   *
   * @param {Array} svgos Array of Optimized SVG's
   * @param {Function} fn Error first completion callback.
   * @private
   */
  viewBox(svgos, fn) {
    async.map(svgos, dimensions, this.broadcast('viewBox', fn));
  }

  /**
   * traverse the generated DOM tree and generate the required structure.
   *
   * @param {Array} svgos Array of Optimized SVG's
   * @param {Function} fn Error first completion callback.
   * @private
   */
  traverse(svgos, fn) {
    const hooks = this.hooks;

    async.map(svgos, function traversing(svg, next) {
      walker(svg, hooks, next);
    }, this.broadcast('traverse', fn));
  }

  /**
   * Reformat the data structure in to asset-parse compatible bundle.
   *
   * @param {Array} svgos List of the SVGs to include in the bundle.
   * @param {Function} fn Error first completion callback.
   * @private
   */
  encode(svgos, fn) {
    const result = svgos.reduce(function reduce(memo, svg) {
      memo[svg.name] = svg.struc;

      return memo;
    }, {});

    debug(`encoding all the svgs according to spec(${this.specification})`);
    AP.encode(this.specification, result, this.broadcast('done', fn, svgos));
  }

  /**
   * Execute all the required steps in the correct order to generate a single
   * bundle according to the specifications of the parser.
   *
   * @param {Function} fn Error first completion callback.
   * @public
   */
  run(fn) {
    async.waterfall([
      this.read.bind(this, this.paths),
      this.optimize.bind(this),
      this.parse.bind(this),
      this.viewBox.bind(this),
      this.traverse.bind(this),
      this.encode.bind(this)
    ], fn);
  }
}
/**
 * Default configuration.
 *
 * @type {Object}
 * @private
 */
Bundle.defaults = {
  root: null,
  multipass: false,
  svgo: [
    { removeDoctype: true },
    { removeXMLProcInst: true },
    { removeComments: true },
    { removeMetadata: true },
    { removeXMLNS: true },
    { removeEditorsNSData: true },
    { cleanupAttrs: true },
    { inlineStyles: true },
    { minifyStyles: true },
    { convertStyleToAttrs: true },
    { cleanupIDs: true },
    { prefixIds: true },
    { removeRasterImages: true },
    { removeUselessDefs: true },
    { cleanupNumericValues: true },
    { cleanupListOfValues: true },
    { convertColors: true },
    { removeUnknownsAndDefaults: true },
    { removeNonInheritableGroupAttrs: true },
    { removeUselessStrokeAndFill: true },
    { removeViewBox: false },
    { cleanupEnableBackground: true },
    { removeHiddenElems: true },
    { removeEmptyText: true },
    { convertShapeToPath: true },
    { moveElemsAttrsToGroup: true },
    { moveGroupAttrsToElems: true },
    { collapseGroups: true },
    { convertPathData: true },
    { convertTransform: true },
    { removeEmptyAttrs: true },
    { removeEmptyContainers: true },
    { mergePaths: true },
    { removeUnusedNS: true },
    { sortAttrs: true },
    { removeTitle: true },
    { removeDesc: true },
    { removeStyleElement: true },
    { removeScriptElement: true },
    { removeDimensions: true }
  ]
};

//
// Use the Node.js exports so we can require the code without .default
//
module.exports = Bundle;
