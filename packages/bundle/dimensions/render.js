import puppeteer from 'puppeteer';
import diagnostics from 'diagnostics';

const debug = diagnostics('asset:bundle:render');

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

  //
  // Holy freaking hacks batman!
  //
  // The `page.setContent` API is not working because it doesn't correctly
  // wait until the page is loaded before you can interact with it's contents.
  // That means that if you are taking screenshots, or basically waiting
  // for a visual rendering of the page it will result in an empty page.
  //
  // The current suggest work around is to use `page.goto` with a dataurl.
  // Yup. Sad face.
  //
  // See https://github.com/GoogleChrome/puppeteer/issues/728
  //
  await page.goto(`data:text/html, ${html}`, { waitUntil: 'networkidle0' });

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
