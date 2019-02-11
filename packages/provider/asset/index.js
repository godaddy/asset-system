import React, { Component, Children } from 'react';
import diagnostics from 'diagnostics';
import { context } from '../provider';
import PropTypes from 'prop-types';
import Svg from '../wrapper';
import { Rect } from 'svgs';
import rip from 'rip-out';

/**
 * We don't want a pure number, a string value that represents a number
 * is fine as well
 *
 * @type {PropTypes}
 * @private
 */
const numeric = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.number
]).isRequired;

/**
 * Validation of the props.
 *
 * @type {Object}
 * @private
 */
const propTypes = {
  height: numeric,
  width: numeric,
  children: PropTypes.element,
  onLoadStart: PropTypes.func,
  onLoadEnd: PropTypes.func,
  onError: PropTypes.func,
  onLoad: PropTypes.func,
  title: PropTypes.string,
  name: PropTypes.string,
  data: PropTypes.object
};

/**
 * List of properties that we know should **not** end up as properties.
 *
 * @type {Array}
 * @private
 */
const knownProps = Object.keys(propTypes);

/**
 * Asset renders an SVG image through it's parent Provider component.
 *
 * @constructor
 * @public
 */
export default class Asset extends Component {
  constructor() {
    super(...arguments);

    this.debug = diagnostics('asset:provider:asset:' + this.props.name);
    this.mounted = false;                 // Indication if we're mounted.
    this.state = {
      svg: this.props.data || null,       // The svg children.
      props: {}                           // Props for the Svg element.
    };
  }

  /**
   * Triggers an event for the asset.
   *
   * @param {...args} string Names of the events that need to be triggered.
   * @param {Mixed} data Argument for the events, should not be a string.
   * @private
   */
  trigger(...args) {
    const data = typeof args[args.length - 1] !== 'string' ? args.pop() : null;

    args.forEach((name) => {
      const handler = this.props['on' + name];
      if (typeof handler === 'function') handler.call(this, data);
    });
  }

  /**
   * Ask for the SVG resource as we're about be displayed if no svgs are loaded
   * yet, this should start the fetch.
   *
   * @private
   */
  componentWillMount() {
    this.mounted = true;
    this.fetch(this.props);
  }

  /**
   * The component will be removed from the DOM. We do not want to process any
   * data from an async operation anymore.
   *
   * @private
   */
  componentWillUnmount() {
    this.debug('unmounting asset');
    this.mounted = false;
  }

  /**
   * Process prop changes.
   *
   * @param {Object} nextProps New props that we received.
   * @private
   */
  componentWillReceiveProps(nextProps) {
    this.debug('receiving new props', nextProps);
    this.fetch(nextProps);
  }

  /**
   * Fetch the asset through the parent provided context.
   *
   * @param {Object} props Properties that are used for rendering.
   * @returns {Undefined} Nope, nothing.
   * @private
   */
  fetch(props) {
    const name = props.name;

    if (props.data) return this.trigger('LoadStart', 'Load', 'LoadEnd');

    this.trigger('LoadStart');
    this.context.getItem(name, (err, svg) => {
      if (!this.mounted) return this.debug('asset is nolong mounted, ignoring getItem');

      if (err) {
        this.debug('failed to retrieve asset from context', err);
        this.trigger('LoadEnd', 'Error', err);
        return this.setState({ svg: svg });
      }

      this.setState({ ...svg.render(props) }, () => {
        this.trigger('LoadEnd', 'Load');
      });
    });
  }

  /**
   * Renders a placeholder for when the Asset is still loading it's SVG data.
   *
   * @returns {Component} The component that needs to be rendered instead.
   * @private
   */
  loading() {
    const { children, width, height } = this.props;

    //
    // Developer has provided us with a custom fallback for when assets are
    // still loading, use that instead of our automatically generated
    // placeholder.
    //
    if (children) {
      this.debug('still loading, rendering child component');
      return Children.only(children);
    }

    //
    // We want to prevent the browser from having to re-adjust the layout of the
    // page once the asset is loaded. So we are going to return an SVG that is
    // exactly the same size as the resulting SVG. So in an ideal situation,
    // when the asset is loaded, the browser only need to repaint the asset
    // instead of the whole browser window because pixels have moved.
    //
    this.debug('still loading, rendering transparent rect');
    return (
      <Svg { ...this.attributes() }>
        <Rect y={ 0 } x={ 0 } opacity={ 0 } width={ width } height={ height } />
      </Svg>
    );
  }

  /**
   * Generate the the attributes that are allowed on SVG elements. We want to be
   * able to proxy things like `onClick` and `style` so these elements.
   *
   * @param {Object} props Addition props for the Svg element.
   * @returns {Object} props that need to be spread on the Svg element.
   * @private
   */
  attributes(props = {}) {
    const attributes = rip(
      { ...this.props, ...props },
      ...this.context.modifiers(),
      ...knownProps
    );

    return {
      ...attributes,

      width: this.props.width,
      height: this.props.height,
      title: this.props.title
    };
  }

  /**
   * Render the actual Asset / SVG contents.
   *
   * @returns {Component} SVG.
   * @private
   */
  render() {
    const { svg, props } = this.state;

    //
    // We haven't received our data yet, so we're still loading.
    //
    if (!svg) return this.loading();
    this.debug('asset fully loaded, rendering what ever state we are in');

    //
    // In case of being given a Component constructor, we're going to render
    // it so we get actual React Element's instead. e.g. in the case of our
    // Fallback asset.
    //
    if (typeof svg === 'function') {
      const Fallback = svg;

      return (
        <Svg { ...this.attributes(props) }>
          <Fallback />
        </Svg>
      );
    }

    return (
      <Svg { ...this.attributes(props) }>
        { svg }
      </Svg>
    );
  }
}

/**
 * Validation of the props.
 *
 * @type {Object}
 * @private
 */
Asset.propTypes = propTypes;

/**
 * Instruct React what context types we're expecting.
 *
 * @type {Object}
 * @private
 */
Asset.contextTypes = context;
