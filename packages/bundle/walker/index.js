import diagnostics from 'diagnostics';
import camelCase from 'camel-case';

//
// Setup our debug util.
//
const debug = diagnostics('asset:bundle:walker');

/**
 * Weird component names from svgs/react-native-svg that can't really be
 * transformed automatically using the componentName function.
 *
 * Naming things is hard..
 *
 * @type {Object}
 * @private
 */
const names = {
  tspan: 'TSpan'  // Not judging here but LOL WAT ARE YOU DOING.
};

/**
 * Transforms a given tagName to a `svgs` and `react-native-svg` compatible
 * component name.
 *
 * @param {String} tagName The node's tagName.
 * @returns {String} The transformed string.
 * @private
 */
export function componentName(tagName) {
  if (names[tagName]) return names[tagName];

  const first = tagName.charAt(0).toUpperCase();
  return first + tagName.slice(1);
}

/**
 * List of properties that need to be renamed in order to be compatible in
 * React.
 *
 * @type {Object}
 * @private
 */
const rename = {
  'class': 'className'
};

/**
 * Transform attribute names to their correct JavaScript equivs.
 *
 * @param {Object} attr Attributes that needs to be transformed
 * @returns {Object} Transformed attributes.
 * @private
 */
export function attributes(attr) {
  return Object.keys(attr).reduce(function reduce(memo, key) {
    const name = rename[key] ? rename[key] : camelCase(key);
    let value = attr[key];

    if (!isNaN(+value)) value = +value;

    memo[name] = value;
    return memo;
  }, {});
}

/**
 * Walk the DOM tree and generate the required structures.
 *
 * @param {Object} svg Information of a single SVG asset.
 * @param {Object} modify Additional modification hooks.
 * @param {Function} fn Error first completion callback.
 * @private
 */
export default function walker(svg, modify, fn) {
  const { tree } = svg;

  /**
   * Iterate over all the children and transform them into the required
   * structure.
   *
   * @param {Object} root DOM root node.
   * @returns {Array} Parsed structure.
   * @private
   */
  function iterate(root) {
    const node = [];
    const element = tree(root);
    const attr = element.attr();
    const children = element.children();

    //
    // Transform the name of the tag to be a component.
    //
    let name = componentName(root.tagName);
    let attrs = {};

    //
    // Transform attributes to actual DOM properties.
    //
    if (attr && Object.keys(attr).length) {
      attrs = attributes(attr);
    }

    //
    // Edge case for the svg element, we want to NUKE all the Attributes
    // and introduce our new viewBox property if it exists.
    //
    if (name === 'Svg' && svg.viewBox) {
      debug(`introducing viewBox(${svg.viewBox}) on svg(${svg.name})`);
      attrs = { viewBox: svg.viewBox };
    }

    //
    // Process the modification hooks. So they can alter attributes or even
    // complete components.
    //
    Object.keys(modify).forEach((key) => {
      name = modify[key](attrs, element, name) || name;
    });

    //
    // All transformation have been completed, we can start assembling the
    // required structure:
    //
    // [ComponentName, { optional attributes }, [ optional children ]]
    //
    node.push(name);
    if (Object.keys(attrs).length) node.push(attrs)
    if (children.length) node.push(children.get().map(iterate));

    return node;
  }

  svg.struc = tree('svg').get().map(iterate)[0];
  fn(null, svg);
}
