import { Component, cloneElement, Children, version } from 'react';
import diagnostics from 'diagnostics';
import PropTypes from 'prop-types';
import rip from 'rip-out';

//
// Setup our debug util.
//
const debug = diagnostics('asset:parser:passthrough');

/**
 * Detect which version of React we're using and if we can optimize
 * our render process.
 *
 * @type {Boolean}
 * @private
 */
const react16 = +version.slice(0, 2) >= 16;

/**
 * Context validation.
 *
 * @type {Object}
 * @private
 */
const context = {
  pass: PropTypes.func,
  modify: PropTypes.func
};

/**
 * Pass properties through context to child components so they can change
 * props on the fly.
 *
 * @constructor
 * @public
 */
export class Pass extends Component {
  constructor() {
    super(...arguments);

    this.pass = this.pass.bind(this);
    this.modify = this.modify.bind(this);
  }

  /**
   * Passes the properties of the Pass component to the Through component
   * as overrides.
   *
   * @returns {Object} props.
   * @private
   */
  pass() {
    return rip(this.props, 'children', 'modify');
  }

  /**
   * Get all the modifier functions.
   *
   * @returns {Object} Modifiers.
   * @private
   */
  modify() {
    return this.props.modify;
  }

  /**
   * Return a function that can pass through the props.
   *
   * @returns {Object} Object that exposes the `pass` function.
   * @private
   */
  getChildContext() {
    return {
      pass: this.pass,
      modify: this.modify
    };
  }

  /**
   * Render the children.
   *
   * @returns {React.Element|Array} The child.
   * @private
   */
  render() {
    if (react16) return this.props.children;

    return Children.only(this.props.children);
  }
}

/**
 * Validate that we've received all required properties in order to function.
 *
 * @type {Object}
 * @private
 */
Pass.propTypes = {
  children: PropTypes.node.isRequired,
  modify: PropTypes.object
};

/**
 * Default properties.
 *
 * @type {Object};
 */
Pass.defaultProps = {
  modify: {}
};

/**
 * Context validation.
 *
 * @type {Object}
 * @private
 */
Pass.childContextTypes = context;

/**
 * Preferres the passed through properties over their own supplied properties.
 *
 * @constructor
 * @public
 */
export class Through extends Component {
  render() {
    const { children, ...props } = this.props;
    const modify = this.context.modify();
    const passed = this.context.pass();
    const attributes = { ...props };

    //
    // Now that all attributes have been pre-modified, we can pass them into
    // any modifier function that has been specified to do any final
    // transformation.
    //
    let child = Children.only(children);

    Object.keys(passed).forEach((name) => {
      const modifiers = modify[name];
      if (!Array.isArray(modifiers)) return;

      debug(`found ${modifiers.length} modifiers for the ${name} prop`);

      modifiers.forEach(function makeitso(modifier) {
        child = modifier(attributes, passed, child) || child;
      });
    });

    return cloneElement(child, attributes);
  }
}

/**
 * Validate that we've received all required properties in order to function.
 *
 * @type {Object}
 * @private
 */
Through.propTypes = {
  children: PropTypes.node.isRequired
};

/**
 * Context validation.
 *
 * @type {Object}
 * @private
 */
Through.contextTypes = context;
