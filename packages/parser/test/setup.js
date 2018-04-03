import Adapter from 'enzyme-adapter-react-16';
import assumeEnzyme from 'assume-enzyme';
import { configure } from 'enzyme';
import { JSDOM } from 'jsdom';
import assume from 'assume';

//
// Configure Enzyme
//
configure({ adapter: new Adapter() });

//
// Setup JSDOM environment in Node.
//
const jsdom = new JSDOM('<!doctype html><html><body></body></html>');
const { window } = jsdom;

function copyProps(src, target) {
  const props = Object.getOwnPropertyNames(src)
    .filter(prop => typeof target[prop] === 'undefined')
    .reduce((result, prop) => ({
      ...result,
      [prop]: Object.getOwnPropertyDescriptor(src, prop)
    }), {});
  Object.defineProperties(target, props);
}

global.window = window;
global.document = window.document;
global.navigator = {
  userAgent: 'node.js'
};

copyProps(window, global);

//
// Configure assume for Enzyme
//
assume.use(assumeEnzyme);
