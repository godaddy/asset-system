import { fixtures } from 'asset-test';
import { describe, it } from 'mocha';
import dimensions from './index.js';
import { load } from 'cheerio';
import assume from 'assume';
import path from 'path';
import fs from 'fs';

describe('dimensions', function () {
  function prepare(file) {

    // eslint-disable-next-line
    const source = fs.readFileSync(file, 'utf-8');
    const tree = load(source, { decodeEntities: false });

    return { file, source, tree };
  }

  it('extracts the viewBox from the svg', async function () {
    const godaddy = path.join(fixtures, 'godaddy.svg');
    const item = prepare(godaddy);

    const result = await dimensions(item);

    assume(result).is.a('object');
    assume(result.viewBox).equals('0 0 127 55.2');
    assume(result.x).equals(0);
    assume(result.y).equals(0);
    assume(result.width).equals(127);
    assume(result.height).equals(55.2);
  });

  it('extracts the full viewBox by rendering headless', async function () {
    const tiger = path.join(fixtures, 'tiger.svg');
    const item = prepare(tiger);

    const result = await dimensions(item);

    assume(result.viewBox).equals('16.072998046875 55.626800537109375 493.87451171875 509.1741638183594');
    assume(result.x).equals(16.072998046875);
    assume(result.y).equals(55.626800537109375);
    assume(result.width).equals(493.87451171875);
    assume(result.height).equals(509.1741638183594);
  });
});
