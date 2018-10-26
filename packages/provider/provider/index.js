import { Component, Children } from 'react';
import AssetParser from 'asset-parser';
import diagnostics from 'diagnostics';
import Fallback from '../fallback';
import PropTypes from 'prop-types';
import Remote from './remote';

//
// Setup our debug util.
//
const debug = diagnostics('asset:provider');

//
// Our actual Parser and Fetcher logic
//
export const parser = new AssetParser();
const remote = new Remote();

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

    this.modifiers = this.modifiers.bind(this);
    this.getItem = this.getItem.bind(this);
    this.empty = this.empty.bind(this);

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
    if (!this.mounted) return debug('root component no longer mounted');

    this.setState(state, () => {
      if (!this.mounted) return debug('root component no longer mounted');

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
    const { timeout, method, format, uri, parser } = this.props;

    this.saveState({ readyState: READYSTATES.LOADING }, () => {
      debug('set readyState to LOADING');

      this.resolve(uri, (err, url) => {
        if (err) return this.saveState({ readyState: READYSTATES.LOADED, error: err, svgs: {} }, fn);

        remote.fetch({ timeout, method, format, uri: url }, parser, (error, svgs) => {
          debug('set readyState to LOADED', error, svgs);

          this.saveState({ readyState: READYSTATES.LOADED, error, svgs }, fn);
        });
      })
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
      this.getItem(...args);
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

    //
    // Fetching resulted in an error, instead of displaying content we're
    // returing our fallback SVG but not without telling the consumer about the
    // error.
    //
    if (error) {
      debug('previous fetching resulted in an error, returing Fallback', error);
      return fn(error, this.getFallback());
    }

    if (!(name in svgs)) {
      if (typeof this.context.getItem === 'function') {
        debug(`the supplied name(${name}) was not found in our bundle, attempting parent provider`);
        return this.context.getItem(name, fn);
      }

      debug(`the supplied name(${name}) does not exist in downloaded svgs bundle`);
      return fn(new Error('Unknown SVG requested'), this.getFallback());
    }

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
   * Gets the fallback component for the provider.
   * @returns {Object} The fallback component
   * @private
   */
  getFallback() {
    return this.props.fallback || this.context.Fallback || Fallback
  }

  /**
   * This will introduce new properties into React's `this.context` so names
   * must be picked carefully as this namespace is shared between the whole
   * React eco system.
   *
   * @returns {Object} Data that ends up in `this.context`.
   * @private
   */
  getChildContext() {
    return {
      Fallback: this.getFallback(), // Allows easy sharing of fallback SVG.
      getItem: this.getItem,        // Get a new item from the SVG parsed cache.
      modifiers: this.modifiers     // List of properties that trigger modifiers.
    };
  }

  /**
   * Render all the child components.
   *
   * @returns {Array} Childeren that get need to get rendered.
   * @private
   */
  render() {
    const child = typeof this.context.getItem === 'function';
    const state = Object.keys(READYSTATES)[this.state.readyState - 1];
    debug(`rendering <Provider state={${state}}>, we are`, child ? 'a child of another <Provider>' : 'the absolute root');

    return this.props.children;
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
  method: PropTypes.string,
  timeout: PropTypes.number,
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
  timeout: 10000,
  method: 'GET',
  parser
};

/**
 * PropTypes that are used for the React Context validation. The const is
 * exported so the Asset component can dependent on it and use the same
 * PropTypes.
 *
 * @type {Object}
 * @private
 */
export const context = {
  modifiers: PropTypes.func,
  Fallback: PropTypes.func,
  getItem: PropTypes.func
};

//
// Actually assign the stored context properties.
//
Provider.contextTypes = context;
Provider.childContextTypes = context;
