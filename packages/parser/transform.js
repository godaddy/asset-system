import { Through } from './passthrough';
import diagnostics from 'diagnostics';
import * as svgs from 'svgs';
import React from 'react';

//
// Setup our debug util.
//
const debug = diagnostics('asset:parser:transform');

/**
 * Figure out the type of what.
 *
 * @param {Mixed} what Thing we need figure the type of.
 * @returns {String} The type of what.
 * @private
 */
function type(what) {
  return Object.prototype.toString.call(what).slice(8, -1).toLowerCase();
}

/**
 * Transforms the SVG data in to actual Svgs SVG elements.
 *
 * @param {Object} data The SVG data for a single asset.
 * @param {String} version Version number of the specification.
 * @returns {Array} Array containing the new React elements.
 * @public
 */
export default function transform(data, version) {
  let props = {};
  let key = 0;

  /**
   * Transform a row in to an actual component.
   *
   * @param {Array} row Row that needs to be transformed.
   * @returns {React.Element|null} Actual component.
   * @private
   */
  function create(row = []) {
    const Component = svgs[row[0]];
    let attributes = {};
    let children;

    if (!Component) return row[0];

    //
    // Figure out if the 2nd row is attributes. If not it should be
    // considered as children instead.
    //
    if (row[1]) {
      switch (type(row[1])) {
        case 'array':
          children = row[1].map(create);
          break;

        case 'object':
          attributes = row[1];
          break;

        default:
          children = row[1];
      }
    }

    if (!children && row[2]) {
      if (Array.isArray(row[2])) children = row[2].map(create);
      else children = row[2];
    }

    //
    // Note: The attributes that we spread on the Component are **not**
    // used as the Through component will clone the child component and
    // override the properties. If we do not spread the properties we can
    // get prop-type warnings because required props as missing when we
    // **create** the component initially, but before it's rendered it does
    // receive all props.
    //
    return (
      <Through { ...attributes } key={ `${row[0]}-${key++}` }>
        <Component { ...attributes }>
          { children }
        </Component>
      </Through>
    );
  }

  //
  // Optimization: If we're given an SVG element, we need to extract it and
  //
  if (data[0] === 'Svg') {
    props = data[1];

    if (Array.isArray(props)) {
      data = props;
      props = {};
    } else {
      data = data[2];
    }

    debug('extracted props for Svg', props);
  }

  debug(`transforming payload according to specification(${version})`);
  return {
    svg: data.map(create),
    props
  };
}
