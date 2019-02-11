import diagnostics from 'diagnostics';
import { G, Path } from 'svgs';
import React from 'react';

//
// Setup our debug util.
//
const debug = diagnostics('asset:provider:wrapper');

/**
 * Renders a default fallback SVG.
 *
 * @param {Object} props Addition props for the Svg element.
 * @returns {React.Element} Fallback SVG.
 * @public
 */
export default function Fallback(props) {
  debug('rendering the fallback');

  /*eslint-disable */
  return (
    <svg viewBox='0 0 128 64'>
      <G fill='#CCC'>
        <Path d='M86,13.85H42a5,5,0,0,0-5,5v26.3a5,5,0,0,0,5,5H86a5,5,0,0,0,5-5V18.85A5,5,0,0,0,86,13.85Zm-44,2H86a3,3,0,0,1,3,3v23L73.33,26.18a1,1,0,0,0-1.41,0L58.2,39.92l-8-8a1,1,0,0,0-1.42,0L39,41.8V18.85A3,3,0,0,1,42,15.85Zm44,32.3H42a3,3,0,0,1-3-3v-.52L49.54,34.06,60.31,44.87a1,1,0,0,0,1.42,0,1,1,0,0,0,0-1.42l-2.11-2.12,13-13L89,44.63h0v.52A3,3,0,0,1,86,48.15Z'/>
        <Path d='M58.21,30.07A5.24,5.24,0,1,0,53,24.84,5.24,5.24,0,0,0,58.21,30.07Zm0-8.47A3.24,3.24,0,1,1,55,24.84,3.24,3.24,0,0,1,58.21,21.6Z'/>
      </G>
    </svg>
  );
  /* eslint-enable */
}
