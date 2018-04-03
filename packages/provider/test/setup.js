import { encode, version } from 'asset-parser';
import Adapter from 'enzyme-adapter-react-16';
import * as fixture from './fixtures';
import { configure } from 'enzyme';
import route from 'nock-knock';
import { JSDOM } from 'jsdom';
import nock from 'nock';

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
// Setup Nock for our asset loading tests.
//
nock('http://example.com')
  .get('/500')
  .times(Infinity)
  .reply(500)
  .get('/404')
  .times(Infinity)
  .reply(404)
  .get(route('/:fixture/bundle.svgs'))
  .times(Infinity)
  .delay(10)
  .reply(200, function (uri, body, fn) {
    const name = uri.split('/')[1];
    const data = fixture[name];

    encode(version || '0.1.0', data, fn);
  });
