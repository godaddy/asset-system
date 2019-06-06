import { Pass } from 'passing-through';
import transform from '../transform';
import { describe, it } from 'mocha';
import { create } from 'asset-test';
import { mount } from 'enzyme';
import * as svgs from 'svgs';
import assume from 'assume';
import React from 'react';

const fixture = create(svgs, React);
const Text = svgs.Text;
const Svg = svgs.Svg;

describe('transform', function () {
  let wrapper;
  let output;

  function setup(data, hooks) {
    const { svg, props } = transform(data, hooks);
    wrapper = mount(<Pass><Svg { ...props }>{ svg }</Svg></Pass>);
    output = wrapper.html();
  }

  it('is exported as a function', function () {
    assume(transform).is.a('function');
  });

  it('transforms the first element of an array to component', function () {
    setup(fixture.g.structure);

    assume(wrapper).to.contain(fixture.g.output);
    assume(wrapper).to.not.contain(<Text />); // sanity check
  });

  it('applies the second element of the array as properties', function () {
    setup(fixture.green.structure);

    assume(wrapper).to.contain(fixture.green.output);
  });

  it('adds child components when an array is encountered', function () {
    setup(fixture.childs.structure);

    assume(output).to.contain(mount(fixture.childs.output).html());
  });

  it('complex deeply tested svgs', function () {
    setup(fixture.complex.structure);

    assume(output).to.contain(mount(fixture.complex.output).html());
  });

  it('returns props even when no svg with props is found in structure', function () {
    const result = transform([['Text', ['Hello']]]);

    assume(result.props).is.a('object');
    assume(result.props).has.length(0);
  });

  it('returns text when a component cannot be found', function () {
    const result = transform([['what']]).svg;
    assume(result).deep.equals(['what']);
  });

  it('extracts the Svg element from the structure and adds its props to props', function () {
    const result = transform(fixture.json.godaddy);

    assume(result.props).is.a('object');
    assume(result.props).has.length(1);
    assume(result.props.viewBox).equals('0 0 127 55.2');
  });
});
