const debug = require('diagnostics')('asset:list');
const table = require('markdown-table');
const EventEmitter = require('events');
const bytes = require('bytes');
const path = require('path');
const mkdirp = require('mkdirp');
const zlib = require('zlib');
const url = require('url');
const fs = require('fs');

/**
 * Default options of the plugin.
 *
 * @type {Object}
 * @private
 */
const defaults = {
  separator: path.sep
};

/**
 * Assets symbol.
 *
 * @type {Symbol}
 * @private
 */
const ASSETS = Symbol('ASSETS');

/**
 * Generates a markdown document that contains a listing of the various of
 * assets that are bundled into the document.
 *
 * @param {Bundle} bundle Asset Bundle instance.
 * @param {Object} options Configuration.
 * @public
 */
class List extends EventEmitter {
  constructor(bundle, options) {
    super();

    this.file = options.file;
    this.bundle = bundle;
    this.options = { ...defaults, ...options };
    this.generate = this.generate.bind(this);
    this.bundle.on('done', this.generate);
    this.on('done', this.write);
  }

  /**
   * The name of the (bundle) documentation that we're generating.
   *
   * @returns {String} The name.
   * @private
   */
  name() {
    return path.basename(this.file, path.extname(this.file));
  }

  /**
   * Write the README file to disk.
   *
   * @param {String} readme The compiled markdown file.
   * @private
   */
  write(readme) {
    const ext = path.extname(this.file);
    const out = this.file.slice(0, -Math.abs(ext.length)) + '.md';

    debug(`creating 'dist' folder`);
    mkdirp.sync('dist')

    debug(`writing readme file to ${out}`);
    fs.writeFileSync(out, readme);
  }

  /**
   * The bundle process is done, so we can start generating the documentation.
   *
   * @param {Error} err Error that happend during the generation.
   * @param {String} output The resulted bundle that is encoded.
   * @param {Array} svgs The svgs that are included in the bundle.
   * @private
   */
  generate(err, output, svgs) {
    if (err) {
      debug('failed to generate documentations as generation resulted in error', err);
      return this.emit('error', err);
    }

    //
    // Sort the svgs alphabetically based on the name of the asset.
    //
    svgs.sort(function sort(a, b) {
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;

      return 0;
    });

    const readme = [
      '# '+ path.basename(this.file),
      '',
      this.contents(svgs),
      '',
      this.details(output, svgs),
      '',
      '## Assets',
      '',
      ...svgs.map(this.asset.bind(this))
    ].join('\n');

    this.emit('done', readme);
    debug('done', readme);
  }

  /**
   * Generates an introduction header that contains some default information.
   *
   * @param {String} output The resulting output bundle.
   * @param {Array} svgs
   * @returns {Array}
   */
  details(output, svgs) {
    const buffy = new Buffer(output);
    const gzip = zlib.gzipSync(buffy);
    const name = this.name();

    return `## Bundle details

- **${bytes(gzip.length)}** compressed(gzip).
- **${bytes(buffy.length)}** uncompressed.
- Contains **${svgs.length}** asset${svgs.length > 1 ? 's' : ''}.
- Build according to specification **${this.bundle.specification}**

The bundle can be included using the \`asset-provider\` components:

\`\`\`js
import Provider, { Asset } from "asset-parser";

<Provider uri="./${name}.svgs">
  <!-- Add the <Asset />\'s here -->
</Provider>
\`\`\`

Learn more about [asset-provider](https://github.com/godaddy/asset-system) components.`;
  }

  /**
   * Generates the documentation for a single Asset.
   *
   * @param {Object} svg Details about the SVG.
   * @returns {String} Documentation.
   * @private
   */
  asset(svg) {
    //
    // Extract the dimensions of the SVG from the viewBox.
    //
    const viewBox = svg.viewBox.split(/[ ,]+/g);
    const size = {
      width: parseFloat(viewBox[2], 10),
      height: parseFloat(viewBox[3], 10)
    };

    return [
      `### ${svg.name}`,
      '',
      table([
        [ 'name', 'width', 'height', 'preview' ],
        [ svg.name, size.width, size.height, this.embed(svg) ]
      ]),
      '',
      ...this.example(svg, size),
      ''
    ].join('\n');
  }

  /**
   * Embed a preview of the asset.
   *
   * @param {Object} svg SVG object.
   * @return {String} Embed
   * @private
   */
  embed(svg) {
    let location;

    //
    // If we're supplied with a `hosted` property we're gonna assume that the
    // files are hosted in that said location.
    //
    if (this.options.hosted) {
      location = url.resolve(this.options.hosted, path.relative(process.cwd(), svg.loc));
    } else {
      location = path.relative(path.dirname(this.file), svg.loc);
    }

    return `<img src="${location}" />`;
  }

  /**
   * Generate the example code.
   *
   * @param {Object} svg SVG object.
   * @param {Object} size Dimensions of the svg.
   * @returns {Array} The example.
   * @private
   */
  example(svg, size) {
    return [
      '```js',
      `<Asset name="${svg.name}" width={ ${size.width} } height={ ${size.height} } />`,
      '```'
    ];
  }

  /**
   * Generate categories for the assets based on the namespace.
   *
   * @param {Array} svgs The svgs.
   * @returns {Object} The categories.
   * @private
   */
  categories(svgs) {
    const result = {};

    svgs
    .map(svg => svg.name)
    .forEach((name) => {
      let struc = result;

      name.split(this.options.separator).forEach((category, i, all) => {
        if (!struc[category]) struc[category] = {};
        struc = struc[category];

        if (i === (all.length - 1)) {
          if (!struc[ASSETS]) struc[ASSETS] = [];
          struc[ASSETS].push({ short: category, full: name });
        }
      });
    });

    return result;
  }

  /**
   * Generates the hash that github uses to link to headers.
   *
   * @param {String} name The header that you want to link
   * @returns {String} Cleaned up hash/link.
   * @private
   */
  link(name) {
    return name.replace(/[\.|\#]/g, '')     // Remove dots and others.
               .replace(/\//g, '')          // Remove slashes.
               .replace(/[^\w]+/g, '-')     // All none-words are now -'s>
               .replace(/[\-]+$/, '')       // Remove suffixed -'s.
               .toLowerCase();              // Always lowercase things.
  }

  /**
   * Generate a Table of Contents for the assets.
   *
   * @param {Array} svgs The SVGS.
   * @returns {String} Table of Contents
   * @private
   */
  contents(svgs) {
    const categories = this.categories(svgs);
    const assets = [];
    let indent = 3;

    /**
     *  Generate link to the assets.
     *
     * @param {Object} category what ever holds the categories.
     * @private
     */
    const item = (category) => {
      category[ASSETS].forEach((item) => {
        assets.push(Array(indent).join(' ')+ `- [${item.short}](#${this.link(item.full)})`);
      });
    }

    /**
     * Iterate the categories to generate an asset structure
     *
     * @param {Object} what Object we're iterating
     * @param {Array} keys Keys of the object.
     * @private
     */
    const iterate = (what, keys) => {
      keys.forEach(function (key) {
        const more = Object.keys(what[key]);

        if (ASSETS in what[key]) item(what[key]);
        else if (more.length) assets.push(Array(indent).join(' ') + `- ${key}`);

        if (more.length) {
          indent = indent + 2;
          iterate(what[key], more);
          indent = indent - 2;
        }
      });
    }

    //
    // Generate the categories.
    //
    iterate(categories, Object.keys(categories));

    return [
      '## Table of Contents',
      '',
      '- [Bundle details](#bundle-details)',
      '- [Assets](#assets)',
      ...assets
    ].join('\n');
  }
}

//
// Expose the module.
//
module.exports = List;
