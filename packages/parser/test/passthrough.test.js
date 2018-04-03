import { Pass, Through } from '../passthrough';
import { describe, it } from 'mocha';
import { shallow } from 'enzyme';
import assume from 'assume';
import React from 'react';

describe('passthrough', function () {
  let wrapper;
  let pass;

  describe('<Pass />', function () {
    function setup(props = {}) {
      wrapper = shallow(<Pass { ...props }><div /></Pass>);
      pass = wrapper.instance();
    }

    it('exported as function', function () {
      assume(Pass).is.a('function');
    });

    describe('#modify', function () {
      it('is a function', function () {
        setup();

        assume(pass.modify).is.a('function');
      });

      it('returns the modifiers', function () {
        const modify = { name: () => {} };
        const props = { foo: 'bar', bar: 'foo', modify };

        setup(props);
        assume(pass.modify()).equals(modify);
      });

      it('is shared through React context', function () {
        setup();

        assume(pass.getChildContext().modify).equals(pass.modify);
      });
    });

    describe('#pass', function () {
      it('is a function', function () {
        setup();

        assume(pass.pass).is.a('function');
      });

      it('passes the received props throught he pass function', function () {
        const props = { foo: 'bar', bar: 'foo' };
        setup(props);

        assume(pass.pass()).deep.equals(props);
      });

      it('is shared through React context', function () {
        setup();

        assume(pass.getChildContext().pass).equals(pass.pass);
      });
    });
  });

  describe('<Through />', function () {
    function setup(props, data = {}, modify = {}) {
      wrapper = shallow(<Through { ...props }><div/></ Through>, {
        context: {
          modify: function () {
            return modify;
          },
          pass: function () {
            return data;
          }
        }
      });
    }

    it('exported as a function', function () {
      assume(Through).is.a('function');
    });

    it('only allows a single component', function (next) {
      try {
        shallow(<Through><div/><div /></Through>, {
          context: {
            modify: function () {
              return {};
            },
            pass: function () {
              return {};
            }
          }
        });
      } catch (e) {
        assume(e.message).contains('single React element');
        return next();
      }
    });

    it('passes the props to the child component', function () {
      setup({ className: 'bar' });

      assume(wrapper.first()).to.have.tagName('div');
      assume(wrapper.first()).to.have.className('bar');
    });

    it('calls the modify functions with attributes', function () {
      setup({}, { className: 'red' }, {
        className: [(attributes) => {
          assume(attributes).is.a('object');
          attributes.className = 'blue';
        }]
      });

      assume(wrapper.first()).to.have.className('blue');
    });

    it('only triggers the modifier if we have a matching property', function () {
      setup({}, { className: 'red' }, {
        another: [(attributes) => {
          throw new Error('I should never be called');
        }],
        className: [(attributes) => {
          assume(attributes).is.a('object');
          attributes.className = 'blue';
        }]
      });

      assume(wrapper.first()).to.have.className('blue');
    });

    it('triggers all assigned modifiers for a given property', function () {
      setup({}, { className: 'red' }, {
        className: [(attributes) => {
          assume(attributes).is.a('object');
          attributes.className = 'blue';
        }, (attributes) => {
          assume(attributes.className).equals('blue');
          attributes.id = 'foo';
        }]
      });

      assume(wrapper.html()).to.contain('<div class="blue" id="foo"></div>');
    });

    it('calls all modifiers for matching props', function () {
      setup({}, { className: 'red', id: 'foo' }, {
        className: [(attributes) => {
          assume(attributes).is.a('object');
          attributes.className = 'blue';
        }],
        id: [(attributes, props) => {
          assume(attributes.className).equals('blue');
          attributes.id = props.id;
        }]
      });

      assume(wrapper.html()).to.contain('<div class="blue" id="foo"></div>');
    });

    it('receives the props as arguments', function (next) {
      const cows = { cows: 'moo' };

      setup({ className: 'red' }, cows, {
        cows: [(attributes, props) => {
          assume(attributes).is.a('object');
          assume(props).is.a('object');
          assume(props).deep.equals(cows);

          next();
        }]
      });

      assume(wrapper.html()).to.contain('<div class="red"></div>');
    });

    it('receives the child as arguments', function (next) {
      setup({}, { trigger: 'red' }, {
        trigger: [(attributes, props, child) => {
          assume(child.props).is.a('object');
          assume(child.type).equals('div');

          next();
        }]
      });
    });

    it('can change the child component', function () {
      setup({ className: 'red' }, { trigger: 'blue' }, {
        trigger: [(attributes, props, child) => {
          assume(child.props).is.a('object');
          assume(child.type).equals('div');

          return (
            <span>changed</span>
          );
        }]
      });

      assume(wrapper.html()).to.contain('<span class="red">changed</span>');
    });
  });
});
