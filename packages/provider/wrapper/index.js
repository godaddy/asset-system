import diagnostics from 'diagnostics';
import PropTypes from 'prop-types';
import React from 'react';
import Svg from 'svgs';

//
// Setup our debug util.
//
const debug = diagnostics('asset:provider:wrapper');

/**
 * Wraps svg content with some default Svg properties.
 *
 * @param {Object} props Properties.
 * @returns {Svg} The wrapped Svg.
 * @private
 */
export default function SvgWrapper(props) {
  const attributes = { ...props };

  //
  // If we're given a viewBox we want to make sure that we preserveAspectRatio
  // correctly so set it to `meet`.
  //
  if (props.viewBox) {
    debug('props have viewBox, adding preserveAspectRatio');
    attributes.viewBox = props.viewBox;
    attributes.preserveAspectRatio = 'meet';
  }

  return (
    <Svg { ...attributes }>
      { props.children }
    </Svg>
  );
}

/**
 * Force validation for some default properties that will be required to render
 * assets.
 *
 * Width and Height are required because we to prevent layout changes, so a pre
 * existing height/width needs to be known.
 *
 * @type {Object}
 * @private
 */
SvgWrapper.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  viewBox: PropTypes.string,
  children: PropTypes.element,
  title: PropTypes.string
};
