import diagnostics from 'diagnostics';
import render from './render';

const debug = diagnostics('asset:bundle:dimensions');

/**
 * Really stupid simple warning output.
 *
 * @param {Array} lines The messages that needs to be spammed.
 * @private
 */
function warning(lines) {
  if (warning.warned) return;

  lines.unshift('');    // Extra whitespace at the start.
  lines.push('');       // Extra whitespace at the end.

  lines.forEach(function each(line) {
    console.error('asset-bundle:warning', line);
  });

  //
  // Prevent spamming of multiple error messages.
  //
  warning.warned = true;
}

/**
 * Ensure that we have dimension information from the read SVG so we can generate
 * a valid viewBox for the SVG.
 *
 * @param {Object} svg Our internal SVG object.
 * @param {Function} fn Error first completion callback.
 * @private
 */
export default function dimensions(svg, fn) {
  /**
   * Compile a viewBox from the given.
   *
   * @param {Object} details The width/height for the viewBox.
   * @private
   */
  function viewBox(details) {
    svg.viewBox = `${details.x || 0} ${details.y || 0} ${details.width} ${details.height}`;

    fn(null, svg);
  }

  const tree = svg.tree;
  const root = tree('svg');

  //
  // If we already have a valid viewBox attribute, we can just continue and
  // mind our own business.. This should satisfy 99% of the cases when designers
  // provide us with SVG exports from applications such as Illustrator, Sketch.
  //
  if (root.attr('viewBox')) {
    const parsed = root.attr('viewBox').split(/[ ,]+/g);

    return viewBox({
      x: parseFloat(parsed[0], 10),
      y: parseFloat(parsed[1], 10),
      width: parseFloat(parsed[2], 10),
      height: parseFloat(parsed[3], 10)
    });
  }

  //
  // While we have `svg.info` that can contain height and width, these values
  // are extracted directly from the svg width/height attributes are should
  // not be considered valid. For example, our homer.svg in fixtures is
  // actually: width: 457.2821960449219, height: 490.2278747558594 but the
  // info object (that originates from svgo) said 500x500.
  //
  // In all these cases, the best thing we can do is extract the bounding box
  // from the browser.
  //
  // In order to get the best render result we need to strip the whole <svg>
  // tag from the data and replace it with an empty once so the size is
  // determined based on the actual size of the svg, not by any other prop.
  //
  // The only problem here is that in order todo this we actually need to
  // download a full browser on the users device in order to get the correct
  // information. The `puppeteer` dependency can be up to 230mb that needs
  // to be downloaded on each installation. If the user doesn't manually install
  // this dependency, we will output a warning when we encounter an svg that
  // has `width` and `height` set as we cannot accurately measure it. And
  // in case of no width/height combo we will do a hard fail, forcing people
  // to install it.

  let puppeteer = true;
  try { require.resolve('puppeteer'); }
  catch (e) { puppeteer = false; }

  if (!puppeteer && (root.attr('width') && root.attr('height'))) {
    warning([
      'file: '+ svg.loc,
      '',
      'One of the svgs did not have a viewBox property, in order to correctly',
      'calculate this, we need use `puppeteer` for browser based detection.',
      'Please run the following command in the root of application.',
      '',
      'npm install --save puppeteer',
      '',
      'The bundle process will still continue but the results might be inaccurate'
    ]);

    return viewBox({
      width: root.attr('width'),
      height: root.attr('height')
    });
  }

  if (!puppeteer) throw new Error([
    'file: '+ svg.loc,
    '',
    'The supplied svg image does not have a `viewBox` or `width/height` combination.',
    'We are unable to extract or create a valid viewBox for this asset without the',
    'installation of `puppeteer`. Please run the following command:',
    '',
    'npm install --save puppeteer',
    '',
    'And run the bundle command again.'
  ].join('\n'))

  render(svg.data.replace(/<svg[^<]+?>/g, '<svg>'), function (bb) {
    setImmediate(function escapePromiseHell() {
      viewBox(bb);
    });
  });
}
