import diagnostics from 'diagnostics';

const debug = diagnostics('asset:bundle:render');

let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch (ex) {
  //
  // Ignore errors here since the consumer is notified
  // at run-time only in ./index.js
  //
}

/**
 * Extract height and width from an SVG by rendering it and extracting
 * the bounding box information.
 *
 * @param {String} svg The svg we want to render.
 * @param {Function} fn Completion callback.
 * @private
 */
export default async function render(svg, fn) {
  const html = `<!DOCTYPE html><html><head></head><body>${svg}</body></html>`;
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const loaded = page.waitForNavigation({ waitUntil: 'load' });

  await page.setContent(html);
  await loaded;

  //
  // Extract the bounding box information from the loaded SVG. The istanbul
  // ignore is of vital importance because the `evaluate` code is executed
  // in the headless chrome, not in this node process so it cannot access the
  // injected `cov_2feitg0dis` references.
  //
  /* istanbul ignore next */
  const dimensions = await page.evaluate(() => {
    //
    // Hacks part II, the sequel.
    //
    // Apparently you cannot directly return the bouding box information, no,
    // you need to extract the information from the resulting boundingBox
    // object, and then return it again. Because, serialization of data is hard
    // I guess.
    //
    const { width, height, x, y } = document.getElementsByTagName('svg')[0].getBBox();
    return { width, height, x, y };
  });

  debug('received dimensions', dimensions);
  await browser.close();

  fn(dimensions);
}
