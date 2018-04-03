import { create } from '../../../test/fixtures';
import { describe, it } from 'mocha';
import { mount } from 'enzyme';
import * as svgs from 'svgs';
import Asset from '../asset';
import assume from 'assume';
import React from 'react';

const fixture = create(svgs, React);
const Svg = svgs.Svg;

describe('Asset', function () {
  let asset;

  function setup(name, hooks) {
    asset = new Asset(fixture[name].structure, hooks);
  }

  it('is exported as a function', function () {
    assume(Asset).is.a('function');
  });

  it('does not transform the asset by default', function () {
    setup('complex');

    assume(asset.data).equals(fixture.complex.structure);
    assume(asset.parsed).is.a('null');
  });

  describe('#render', function () {
    it('parses the data if its not parsed before', function () {
      setup('complex');

      asset.render();
      const parsed = asset.parsed;

      assume(parsed).is.not.a('null');

      asset.data = fixture.g.structure;
      asset.render();

      assume(asset.parsed).equals(parsed);
    });

    it('returns a <Pass> component', function () {
      setup('childs');

      const result = asset.render();
      const wrapper = mount(<Svg { ...result.props }>{ result.svg }</Svg>);

      assume(mount(fixture.childs.output).html()).contains(wrapper.html());
    });

    it('passes the changes to the <Pass /> component', function () {
      setup('green', {
        'color': [function modify(attributes, props) {
          if (!attributes.fill) return;

          attributes.fill = props.color;
        }]
      });

      const result = asset.render({ color: 'red' });
      const wrapper = mount(<Svg { ...result.props }>{ result.svg }</Svg>);

      assume(wrapper.html()).to.contain('<g fill="red"></g>');
    });
  });
});
