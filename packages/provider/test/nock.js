import { encode, version } from 'asset-parser';
import * as fixture from './fixtures';
import route from 'nock-knock';
import nock from 'nock';

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
