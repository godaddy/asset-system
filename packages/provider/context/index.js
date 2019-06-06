import React, { Component, createContext } from 'react';
import Fallback from '../fallback';

const { Provider, Consumer } = createContext({
  modifiers: () => ([]),
  getItem: [],
  Fallback
});

/**
 * Flatten the consumer and receiver data into a single array.
 *
 * @param {Array|Function} consumer
 * @param {Array|Function} receiver
 * @returns {Array}
 * @public
 */
function flatten(consumer, receiver) {
  return [].concat(consumer).concat(receiver).filter((value, index, all) => {
    return value && all.indexOf(value) === index;
  });
}

/**
 * Prosumer is a provider combined with a consumer, so you can inherit from
 * for your provider.
 *
 * @param {Object} props The props.
 * @public
 */
function ProSumer({ children, fallback, getItem, modifiers }) {
  return (
    <Consumer>
    {
      (context) => (
        <Provider value={{
          Fallback: fallback || context.Fallback || Fallback,
          modifiers: modifiers || context.modifiers,
          getItem: flatten(getItem, context.getItem)
        }}>
          { children }
        </Provider>
      )
    }
    </Consumer>
  );
}

/**
 * Wraps the a given component with the Consumer and applies the Context as
 * props.
 *
 * @param {Component} Component The component that needs to receive the context
 * @returns {Component} The Consumer wrapped component.
 * @public
 */
function withContext(Component) {
  const forward = React.forwardRef((props, ref) => (
    <Consumer>
    {
      (context) => (
        <Component ref={ ref } { ...context } { ...props }  />
      )
    }
    </Consumer>
  ));

  forward.displayName = `${Component.name}(consumer)`;
  return forward;
}

export {
  withContext,
  ProSumer,
  Provider,
  Consumer
}
