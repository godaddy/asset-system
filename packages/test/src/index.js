import godaddy from '../godaddy.json';
import path from 'path';

/**
 * Location of the svgs.
 *
 * @type {Object}
 * @public
 */
const svgs = {
  godaddy: path.join(__dirname, '..', 'godaddy.svg'),
  homer: path.join(__dirname, '..', 'homer.svg'),
  tiger: path.join(__dirname, '..', 'tiger.svg'),
};

/**
 * Location of the fixtures.
 *
 * @type {String}
 * @public
 */
const fixtures = path.join(__dirname, '..');

/**
 * Create fixtures, because we really don't different dependencies for
 * React and Svgs as that will make `instanceOf` checks unreliable as they
 * might be imported from different locations.
 *
 * @param {Object} svgs The svgs library.
 * @param {React} React React
 * @returns {Object} Fixtures.
 * @public
 */
function create(svgs, React) {
  const { Svg, G, Text, Rect, Circle, TSpan } = svgs;

  return {
    json: { godaddy },
    g: {
      structure: [
        ['G']
      ],
      output: (
        <G />
      )
    },
    green: {
      structure: [
        ['G', { fill: 'green' }]
      ],
      output: (
        <G fill='green' />
      )
    },
    childs: {
      structure: [
        ['G', [
          ['Rect', { dy: 0, dx: 0 }],
          ['Circle', { dy: 0, dx: 0, radius: 0 }]
        ]
      ]],
      output: (
        <Svg>
          <G>
            <Rect dy={ 0 } dx={ 0 } />
            <Circle dy={ 0 } dx={ 0 } radius={ 0 } />
          </G>
        </Svg>
      )
    },
    complex: {
      structure: [
        ['G',
          [
            ['Text', { y: 20, dx: '5 5' }, [
              ['TSpan', { x: 10 }, 'tspan line 1'],
              ['TSpan', { x: 10, dy: 15 }, 'tspan line 2'],
              ['TSpan', { x: 10, dy: 15, dx: 10 }, 'tspan line 3']
            ]],
            ['Text', { x: 10, y: 60, fill: 'red', fontSize: 14 }, [
              ['TSpan', { dy: '5 10 20' }, '12345'],
              ['TSpan', { fill: 'blue', dy: 15, dx: '0 5 5' }, [
                ['TSpan', '6'],
                ['TSpan', '7']
              ]],
              ['TSpan', { dx: '0 10 20', dy: '0 20', fontWeight: 'bold', fontSize: 12 }, '89a']
            ]],
            ['Text', { y: 140, dx: '0 5 5', dy: '0 -5 -5' }, 'delta on text']
          ]
        ]
      ],
      output: (
        <Svg>
          <G>
            <Text y={ 20 } dx='5 5'>
              <TSpan x={ 10 } >tspan line 1</TSpan>
              <TSpan x={ 10 } dy={ 15 }>tspan line 2</TSpan>
              <TSpan x={ 10 } dx={ 10 } dy={ 15 }>tspan line 3</TSpan>
            </Text>
            <Text x={ 10 } y={ 60 } fill='red' fontSize={ 14 }>
              <TSpan dy='5 10 20' >12345</TSpan>
              <TSpan fill='blue' dy={ 15 } dx='0 5 5'>
                <TSpan>6</TSpan>
                <TSpan>7</TSpan>
              </TSpan>
              <TSpan dx='0 10 20' dy='0 20' fontWeight='bold' fontSize={ 12 }>89a</TSpan>
            </Text>
            <Text y={ 140 } dx='0 5 5' dy='0 -5 -5'>delta on text</Text>
          </G>
        </Svg>
      )
    }
  };
}

export {
  create,
  fixtures,
  svgs as default
}
