import { describe, it } from 'mocha';
import Fallback from '../fallback';
import { shallow } from 'enzyme';
import Asset from '../asset';
import { Text } from 'svgs';
import assume from 'assume';
import React from 'react';

describe('Asset', function () {
  const data = <Text>Context</Text>;
  let wrapper;
  let output;
  let asset;

  function setup(Component, props, render) {
    wrapper = shallow(<Component { ...props } />, {
      lifecycleExperimental: true,
      context: {
        modifiers: () => {
          return [];
        },
        getItem: (name, fn) => {
          if (render) return fn(null, { render });

          fn(null, {
            render: function () {
              return {
                svg: 'what',
                props: {}
              };
            }
          });
        }
      }
    });

    asset = wrapper.instance();
    output = wrapper.html();
  }

  describe('#loading', function () {
    it('renders the children if its still loading', function () {
      wrapper = shallow(
        <Asset width={ 100 } height={ 100 } name='example'>
          <div className='foo'>anything is allowed here</div>
        </Asset>, {
          context: {
            modifiers: () => {
              return [];
            },
            getItem: (name, fn) => {
              setTimeout(() => {
                fn(null, {
                  render: () => {
                    return {
                      svg: <Text>Loaded</Text>,
                      props: {}
                    };
                  }
                });
              }, 10);
            }
          }
        });

      output = wrapper.html();

      assume(output).equals('<div class="foo">anything is allowed here</div>');
    });

    it('displays a transparent rect in exactly the same size', function () {
      wrapper = shallow(
        <Asset width={ 100 } height={ 100 } name='example' />, {
          context: {
            modifiers: () => {
              return [];
            },
            getItem: (name, fn) => {
              setTimeout(() => {
                fn(null, {
                  render: () => {
                    return {
                      svg: <Text>Loaded</Text>,
                      props: {}
                    };
                  }
                });
              }, 10);
            }
          }
        });

      output = wrapper.html();

      assume(output).contains('<svg');
      assume(output).contains('<rect y="0" x="0" opacity="0" width="100" height="100">');
      assume(output).contains('</svg>');
    });
  });

  describe('data={ .. }', function () {
    it('does not fetch resources when data is provided manually', function () {
      setup(Asset, { data, width: 100, height: 100 }, () => {
        throw new Error('I should not render');
      });

      assume(asset.state.svg).equals(data);
    });

    it('renders the supplied data', function () {
      setup(Asset, { data, width: 100, height: 100 });

      assume(wrapper.first().name()).equals('SvgWrapper');
      assume(output).contains('<text>Context</text>');
      assume(output).contains('<svg');
      assume(output).contains('</svg>');
    });
  });

  describe('name={ .. }', function () {
    it('fetches the element from the context', function () {
      setup(Asset, { name: 'example', width: 100, height: 200 }, () => {
        return {
          svg: data,
          props: {}
        };
      });

      assume(output).contains('<svg');
      assume(output).contains('<text>Context</text>');
      assume(output).contains('</svg>');
    });

    it('renders the fallback SVG on errors', function () {
      wrapper = shallow(
        <Asset width={ 100 } height={ 100 } name='example' />, {
          context: {
            modifiers: () => {
              return [];
            },
            getItem: (name, fn) => {
              fn(new Error('unknown whatever error'), Fallback);
            }
          }
        });

      asset = wrapper.instance();
      output = wrapper.html();

      assume(asset.state.svg).equals(Fallback);

      assume(output).contains('<svg width="100" height="100">');
      assume(output).contains('<svg viewBox="0 0 128 64"');
      assume(output).contains('</svg>');
    });

    it('renders with viewBox if supplied', function () {
      setup(Asset, { name: 'example', width: 100, height: 200 }, () => {
        return {
          svg: data,
          props: { }
        };
      });

      assume(output).contains('<svg');
      assume(output).does.not.contain('viewBox="0 0 140 100"');
      assume(output).does.not.contain('preserveAspectRatio="xMidYMid meet"');
      assume(output).contains('<text>Context</text>');
      assume(output).contains('</svg>');

      setup(Asset, { name: 'example', width: 100, height: 200 }, () => {
        return {
          svg: data,
          props: { viewBox: '0 0 140 100' }
        };
      });

      assume(output).contains('<svg');
      assume(output).contains('viewBox="0 0 140 100"');
      assume(output).contains('preserveAspectRatio="xMidYMid meet"');
      assume(output).contains('<text>Context</text>');
      assume(output).contains('</svg>');
    });
  });

  describe('title={ .. }', function () {
    it('renders the asset with accessiblity information', function () {
      setup(Asset, { name: 'example', width: 100, height: 200, title: 'work work work' }, () => {
        return {
          svg: data,
          props: {}
        };
      });

      assume(output).contains('aria-label="[title]"');
      assume(output).contains('<title>work work work</title>');
    });
  });

  describe('#attributes', function () {
    function modify(modifiers) {
      wrapper = shallow(<Asset style={{}} onClick={ () => {} } name='foo' height={ 1 } width={ 1 } color='red' />, {
        lifecycleExperimental: true,
        context: {
          modifiers: () => {
            return modifiers;
          },
          getItem: (name, fn) => {
            fn(null, {
              render: function () {
                return {
                  svg: data,
                  props: {}
                };
              }
            });
          }
        }
      });

      asset = wrapper.instance();
    }

    it('removes all PropsTypes that should not be on SVG elements', function () {
      modify(['color']);

      const attributes = asset.attributes();

      assume(attributes).does.not.include('name');
      assume(attributes).does.not.include('color');
      assume(attributes).does.not.include('viewBox');
      assume(attributes).include('height');
      assume(attributes).include('width');
      assume(attributes).include('style');
      assume(attributes).include('title');
    });

    it('merges with the supplied props', function () {
      modify(['color']);

      const attributes = asset.attributes({ viewBox: '0 0 1 1' });

      assume(attributes).does.not.include('name');
      assume(attributes).does.not.include('color');
      assume(attributes).include('height');
      assume(attributes).include('width');
      assume(attributes).include('style');
      assume(attributes).include('title');
      assume(attributes).include('viewBox');
    });
  });

  describe('events', function () {
    it('invokes `onLoadStart` when an asset is starting to load', function (next) {
      setup(Asset, {
        onLoadStart: function () {
          assume(this).is.instanceOf(Asset);
          assume(this.state.svg).is.a('null');

          next();
        },
        width: 10,
        height: 10,
        name: 'foo'
      }, () => {
        return {
          svg: data,
          props: { viewBox: '0 0 140 100' }
        };
      });
    });

    it('invokes `onLoadStart` for `data=` assets', function (next) {
      setup(Asset, {
        onLoadStart: function () {
          assume(this).is.instanceOf(Asset);
          assume(this.state.svg).equals(data);

          next();
        },
        width: 10,
        height: 10,
        name: 'foo',
        data
      });
    });

    it('invokes `onLoad` when the asset is loaded', function (next) {
      setup(Asset, {
        onLoad: function () {
          assume(this).is.instanceOf(Asset);
          assume(this.state.svg).equals(data);

          next();
        },
        width: 10,
        height: 10,
        name: 'foo'
      }, () => {
        return {
          svg: data,
          props: { viewBox: '0 0 140 100' }
        };
      });
    });

    it('invokes `onLoad` for `data=` assets', function (next) {
      setup(Asset, {
        onLoad: function () {
          assume(this).is.instanceOf(Asset);
          assume(this.state.svg).equals(data);

          next();
        },
        width: 10,
        height: 10,
        data
      });
    });

    it('invokes `onError` when an asset fails to load', function (next) {
      const error = new Error('Example failure');
      function onError(err) {
        assume(this).is.instanceOf(Asset);
        assume(err).is.a('error');
        assume(err).equals(error);

        next();
      }

      shallow(<Asset name='foo' width={ 10 } height={ 10 } onError={ onError } />, {
        lifecycleExperimental: true,
        context: {
          getItem: (name, fn) => {
            fn(error);
          }
        }
      });
    });
  });

  describe('#componentWillReceiveProps', function () {
    it('updates rendered svg with the new changes', function () {
      const render = [
        (props) => {
          assume(props).is.a('object');
          assume(props.name).equals('foo');
          assume(props.foo).equals('foo');

          return {
            svg: data,
            props: {
              viewBox: '1 3 3 7'
            }
          };
        },
        (props) => {
          assume(props).is.a('object');
          assume(props.name).equals('foo');
          assume(props.foo).equals('bar');

          return {
            svg: data,
            props: {
              viewBox: '7 3 3 1'
            }
          };
        }
      ];

      setup(Asset, { name: 'foo', width: 10, height: 10, foo: 'bar' }, (...args) => {
        return render.pop()(...args);
      });

      assume(wrapper.html()).contains('viewBox="7 3 3 1"');

      wrapper.setProps({ foo: 'foo' });
      assume(wrapper.html()).contains('viewBox="1 3 3 7"');
      assume(wrapper.props().foo).equals('foo');
    });

    it('processes name changes', function (next) {
      const payload = {
        render: function () {
          return {
            svg: data,
            props: {}
          };
        }
      };

      const getItems = [
        (name, fn) => {
          assume(name).equals('bar');
          fn(null, payload);

          next();
        },
        (name, fn) => {
          assume(name).equals('foo');

          fn(null, payload);
        }
      ];

      wrapper = shallow(<Asset name='foo' width={ 10 } height={ 10 } />, {
        lifecycleExperimental: true,
        context: {
          modifiers: () => {
            return [];
          },
          getItem: (name, fn) => {
            getItems.pop()(name, fn);
          }
        }
      });

      wrapper.setProps({ name: 'bar' });
    });
  });
});
