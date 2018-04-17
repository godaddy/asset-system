/* eslint max-nested-callbacks: ["error", 10]*/

import Provider, { Asset, context, Fallback, READYSTATES, parser as p } from '../index';
import { describe, it, beforeEach } from 'mocha';
import { shallow } from 'enzyme';
import assume from 'assume';
import React from 'react';

describe('Provider', function () {
  let provider;
  let wrapper;

  const parser = {
    parse: function parser(format, data, fn) {
      fn(null, {});
    },
    modifiers: p.modifiers.bind(p)
  };

  beforeEach(function () {
    wrapper = shallow(
      <Provider uri='http://example.com/500' parser={ parser }>
        <div>Example</div>
      </Provider>
    );

    provider = wrapper.instance();
  });

  describe('#fetch', function () {
    it('sets the state to LOADING', function () {
      assume(provider.state.readyState).equals(READYSTATES.NOPE);

      provider.fetch(() => {});

      //
      // Sketchy assertion, because state updates are async, this start
      // failing in future updates of React.
      //
      assume(provider.state.readyState).equals(READYSTATES.LOADING);
    });

    it('calls the callback once done with final state update', function (next) {
      assume(provider.state.error).is.a('null');

      provider.fetch(() => {
        assume(provider.state.readyState).equals(READYSTATES.LOADED);
        assume(provider.state.error).is.a('error');
        assume(provider.state.svgs).is.a('object');

        next();
      });
    });

    it('props.url can be a function that returns the URL', function (next) {
      function uri(done) {
        assume(done).is.a('function');
        assume(provider.state.url).is.a('null');

        done(null, 'http://example.com/500');

        setTimeout(function () {
          assume(provider.state.url).is.a('string');
          assume(provider.state.url).equals('http://example.com/500');

          next();
        }, 10);
      }

      wrapper = shallow(
        <Provider uri={ uri } parser={ parser }>
        <Asset name='example' width='100' height='100' />
        </Provider>
      );

      provider = wrapper.instance();
      provider.fetch(() => {});
    });

    it('executes props.url function in the same context as the component', function (next) {
      function uri(done) {
        done(null, 'http://example.com/500');

        assume(this.props).is.a('object');
        assume(this).equals(provider);

        next();
      }

      wrapper = shallow(
        <Provider uri={ uri } parser={ parser }>
        <Asset name='example' width='100' height='100' />
        </Provider>
      );

      provider = wrapper.instance();
      provider.fetch(() => {});
    });

    it('only calls props.url once to prevent multiple async URL lookups', function (next) {
      function uri(done) {
        assume(done).is.a('function');
        assume(provider.state.url).is.a('null');

        done(null, 'http://example.com/500');

        setTimeout(function () {
          assume(provider.state.url).is.a('string');
          assume(provider.state.url).equals('http://example.com/500');

          next();

          //
          // The extra fetch calls here are intentionally here, if the function
          // is executed multiple times, we will call the mocha next callback
          // multiple times which will result in an error.
          //
          provider.fetch(() => {});
          provider.fetch(() => {});
          provider.fetch(() => {});
        }, 10);
      }

      wrapper = shallow(
        <Provider uri={ uri } parser={ parser }>
        <Asset name='example' width='100' height='100' />
        </Provider>
      );

      provider = wrapper.instance();
      provider.fetch(() => {});
    });

    it('sets readyState to LOADED if URL resolving failed', function (next) {
      function uri(done) {
        const failure = new Error('Failed to resolve URL in a timely manner');
        done(failure);

        setTimeout(function () {
          assume(provider.state.readyState).equals(READYSTATES.LOADED);
          assume(provider.state.error).equals(failure);
          assume(provider.state.svgs).is.a('object');

          next();
        }, 10);
      }

      wrapper = shallow(
        <Provider uri={ uri } parser={ parser }>
        <Asset name='example' width='100' height='100' />
        </Provider>
      );

      provider = wrapper.instance();
      provider.fetch(() => {});
    });
  });

  describe('#modifiers', function () {
    it('returns an array', function () {
      assume(provider.modifiers()).is.a('array');
    });

    it('returns the names of the props which have modifiers', function () {
      p.modify('fill', () => {});
      p.modify('color', () => {});

      assume(provider.modifiers()).deep.equal(['fill', 'color']);
    });
  });

  describe('#getItem', function () {
    it('queues the action if we are currently fetching a resource', function () {
      assume(provider.queue).is.length(0);

      provider.getItem('what', () => {});

      assume(provider.queue).is.length(1);
      assume(provider.queue[0][0]).equals('what');
    });

    it('starts fetching when we havent started fetching yet', function () {
      assume(provider.queue).is.length(0);
      assume(provider.state.readyState).equals(READYSTATES.NOPE);

      provider.getItem('what', () => {});

      assume(provider.state.readyState).equals(READYSTATES.LOADING);
      assume(provider.queue).is.length(1);
    });

    it('clears the queue after fetching is done', function (next) {
      provider.getItem('what', (err, data) => {
        assume(provider.queue).is.length(1);
        assume(provider.queue[0][0]).equals('what');

        assume(provider.state.readyState).equals(READYSTATES.LOADED);

        assume(err).is.a('error');
        assume(data).equals(Fallback);

        setTimeout(() => {
          assume(provider.queue).is.length(0);
          next();
        }, 0);
      });
    });

    it('returns the fallback and error in case of error state', function (next) {
      provider.state.readyState = READYSTATES.LOADED;
      provider.state.error = new Error('Something went wrong');

      provider.getItem('name', (err, data) => {
        assume(err).is.a('error');
        assume(err.message).equals('Something went wrong');

        assume(data).equals(Fallback);

        next();
      });
    });

    it('returns the fallback and error when receiving an unknown name', function (next) {
      provider.state.readyState = READYSTATES.LOADED;

      provider.getItem('name', (err, data) => {
        assume(err).is.a('error');
        assume(err.message).equals('Unknown SVG requested');

        assume(data).equals(Fallback);

        next();
      });
    });

    it('returns the stored svg', function (next) {
      provider.state.readyState = READYSTATES.LOADED;
      provider.state.svgs = {
        name: 'data'
      };

      provider.getItem('name', (err, data) => {
        assume(err).is.a('null');
        assume(data).equals('data');

        next();
      });
    });
  });

  describe('.context', function () {
    it('shares the getItem method with the consumers', function () {
      const childContext = provider.getChildContext();

      assume(childContext).is.a('object');
      assume(childContext.getItem).equals(provider.getItem);
    });

    it('shares the modifiers method with the consumers', function () {
      const childContext = provider.getChildContext();

      assume(childContext).is.a('object');
      assume(childContext.modifiers).equals(provider.modifiers);
    });

    it('shares the Fallback svg with consumers', function () {
      const childContext = provider.getChildContext();

      assume(childContext).is.a('object');
      assume(childContext.Fallback).equals(Fallback);
    });

    describe('{ context }', function () {
      it('shares its context proptypes', function () {
        assume(context).is.a('object');

        assume(Provider.contextTypes).equals(context);
        assume(Provider.childContextTypes).equals(context);
      });
    });
  });
});
