import { Component, Children } from 'react';
import AssetParser from 'asset-parser';
import diagnostics from 'diagnostics';
import { ProSumer } from '../context';
import PropTypes from 'prop-types';
import remote from './remote';
import React from 'react';

//
// Setup our debug util.
//
const debug = diagnostics('asset:provider');

//
// Our actual Parser and Fetcher logic
//
export const parser = new AssetParser();

/**
 * Various of readyStates of the Provider.
 *
 * @type {Number}
 * @private
 */
export const READYSTATES = {
  NOPE: 1,
  LOADING: 2,
  LOADED: 3
};

/**
 * Provides SVG for nested <Asset /> components.
 *
 * @constructor
 * @public
 */
export default class Provider extends Component {
  constructor() {
    super(...arguments);

    this.mounted = true;              // Tracks if this component is unmounted
    this.queue = [];
    this.state = {
      readyState: READYSTATES.NOPE,   // Current readyState of fetching.
      error: null,                    // Fetching resulted in an error.
      url: null,                      // Resolved URL.
      svgs: {}                        // List of parsed SVG's.
    };

    ['modifiers', 'getItem', 'empty'].forEach((key) => {
      this[key] = this[key].bind(this);
    });

    //
    // Start fetching the specified URI instantly instead of waiting for an
    // <Asset /> to reference it.
    //
    if (this.props.preload) {
      debug('props indicated preloading, starting fetch');
      this.fetch(this.empty);
    }
  }

  /**
   * Handle the destruction of the component.
   *
   * @private
   */
  componentWillUnmount() {
    this.mounted = false;
    this.queue.length = 0;
  }

  /**
   * A safer alternative to `setState` as this takes the current mounted state
   * of the component in to account to prevent potential race conditions.
   *
   * @param {Object} state State that needs to be set.
   * @param {Function} fn Completion callback when state is set.
   * @private
   */
  saveState(state, fn) {
    const me = this; // capture the context to be used in the function below
    if (!me.mounted) return debug('root component no longer mounted');

    me.setState(state, function () {
      if (!me.mounted) return debug('root component no longer mounted');

      fn(...arguments);
    });
  }

  /**
   * Resolve a given URL, as it could be that we're given a URL function
   *
   * @param {String|Function} uri URI we need to fetch.
   * @param {Function} fn Completion callback.
   * @private
   */
  resolve(uri, fn) {
    //
    // Optimization:
    //
    // We are storing the resolved url in the state of the component to prevent
    // multiple lookups of the bundle URL. We really don't know how many calls
    // the given function does, so we want the assume the worse case scenario
    // here, and cache the result for all other .fetch/.resolve calls.
    //
    if (this.state.url) return fn(null, this.state.url);

    if (typeof uri === 'string') {
      return this.saveState({ url: uri }, () => {
        fn(null, uri);
      });
    }

    uri.call(this, (err, url) => {
      if (err) return fn(err);

      this.saveState({ url }, () => {
        fn(null, url);
      });
    });
  }

  /**
   * Start fetching the specified URI.
   *
   * @param {Function} fn Completion callback.
   * @private
   */
  fetch(fn) {
    const { format, uri, parser } = this.props;

    this.saveState({ readyState: READYSTATES.LOADING }, () => {
      debug('set readyState to LOADING');

      this.resolve(uri, (err, url) => {
        if (err) return this.saveState({
          readyState: READYSTATES.LOADED,
          error: err,
          svgs: {}
        }, fn);

        remote({ format, url }, parser, (error, svgs) => {
          debug('set readyState to LOADED', error, svgs);

          this.saveState({ readyState: READYSTATES.LOADED, error, svgs }, fn);
        });
      });
    });
  }

  /**
   * Empty the queue, and re-start the `getItem` requests that were queued.
   *
   * @private
   */
  empty() {
    debug(`emptying our getItem queue(${this.queue.length})`);

    this.queue.forEach((args) => {
      this.getItem.apply(this, args);
    });

    this.queue.length = 0;
  }

  /**
   * Get a image from the Svg bundle.
   *
   * @param {String} name Name of the Svg that we need to display.
   * @param {Function} fn Completion callback.
   * @returns {Undefined} Nope.
   * @private
   */
  getItem(name, fn) {
    const { readyState, error, svgs } = this.state;

    //
    // Data is not loaded yet, or this could be the first time fetching these
    // assets. Queue that stuffs, and start fetching data as needed.
    //
    if (readyState !== READYSTATES.LOADED) {
      this.queue.push([name, fn]);

      if (readyState === READYSTATES.NOPE) {
        debug('readyState is still NOPE, starting first fetch');
        this.fetch(this.empty);
      }

      return;
    }

    if (error) return fn(error);

    if (!(name in svgs)) return fn(new Error('Unknown SVG requested'));

    debug(`passing svg[${name}] to callback`);
    fn(null, svgs[name]);
  }

  /**
   * List of properties that we have modifiers for.
   *
   * @returns {Array} Properties.
   * @public
   */
  modifiers() {
    return this.props.parser.modifiers();
  }

  /**
   * Render all the child components.
   *
   * @returns {Array} Childeren that get need to get rendered.
   * @private
   */
  render() {
    return (
      <ProSumer getItem={ this.getItem } modifiers={ this.modifiers } fallback={ this.props.fallback }>
        { this.props.children }
      </ProSumer>
    );
  }
}

/**
 * PropType validation to ensure correct usage of this module.
 *
 * @type {Object}
 * @private
 */
Provider.propTypes = {
  parser: PropTypes.oneOfType([
    PropTypes.instanceOf(AssetParser),
    PropTypes.object
  ]).isRequired,
  uri: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.func
  ]).isRequired,
  preload: PropTypes.bool,
  children: PropTypes.node,
  format: PropTypes.oneOf(['single', 'bundle']),
  fallback: PropTypes.func
};

/**
 * Default properties for the component. In our case we supply it a parser by
 * default.
 *
 * @type {Object}
 * @private
 */
Provider.defaultProps = {
  format: 'bundle',
  preload: false,
  parser
};
