import Provider, { Asset, parser } from 'asset-provider';
import React, { Component } from 'react';
import { render } from 'react-dom';

//
// Add a small modifier for the assets, each time we see the `pants` property
// on an <Asset /> this parser will be called for all paths, circles and what
// not that was used to create the svg.
//
// We know that homer's pants is #669BC7 so we can target that fill color
// and override it with the given value.
//
parser.modify('pants', function (attr, prop, child) {
  if (attr.fill !== '#669BC7') return;

  attr.fill = prop.pants;
});

class Example extends Component {
  render() {
    return (
      <Provider uri='/godaddy.svgs'>
        <div>
          <h1>Rendering a godaddy asset</h1>

          <Asset name='godaddy' width={100} height={100}>
            <strong>Loading text</strong>
          </Asset>

          <Provider uri='/homer-tiger.svgs'>
            <Asset name='homer' width={100} height={300} pants="red" />
            <Asset name='homer' width={100} height={300} />
            <Asset name='tiger' width={300} height={300} />
            <Asset name='godaddy' width={300} height={300} />
          </Provider>
        </div>
      </Provider>
    );
  }
}

render(<Example />, document.getElementById('example'))
