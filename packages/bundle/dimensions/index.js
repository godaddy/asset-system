import diagnostics from 'diagnostics';
import render from './render';

const debug = diagnostics('asset:bundle:dimensions');

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
  debug(`The ${svg.name} does not have viewBox information, rendering`);
  render(svg.data.replace(/<svg[^<]+?>/g, '<svg>'), function (bb) {
    setImmediate(function escapePromiseHell() {
      viewBox(bb);
    });
  });
}
