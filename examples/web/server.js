import assets from '../../test/fixtures/index.js';
import config from './webpack.config.js';
import Bundle from 'asset-bundle';
import MemoryFS from 'memory-fs';
import webpack from 'webpack';
import http from 'http';
import path from 'path';
import fs from 'fs';

//
// Setup fake file system for WebPack for the client code.
//
const fsys = new MemoryFS();

/**
 * Serve the bundle.svgs.
 *
 * @param {Request} req HTTP request.
 * @param {Response} res HTTP response.
 * @private
 */
function svgs(req, res) {
  const bundle = new Bundle(
    req.url.slice(1, -5).split('-').map(function map(name) {
      return assets[name];
    })
  );

  bundle.run(function (err, output) {
    if (err) throw err;

    res.setHeader('Content-Length', Buffer(output).length);
    res.writeHead(200, { 'Content-Type': 'text/plain' });

    res.end(output);
  });
}

/**
 * Serve the index.html
 *
 * @param {Request} req HTTP request.
 * @param {Response} res HTTP response.
 * @private
 */
function html(req, res) {
  fs.readFile(path.join(__dirname, 'index.html'), function read(err, file) {
    if (err) throw err;

    res.setHeader('Content-Length', file.length);
    res.writeHead(200, { 'Content-Type': 'text/html' });

    res.end(file);
  });
}

/**
 * Serve the index.js client bundle.
 *
 * @param {Request} req HTTP request.
 * @param {Response} res HTTP response.
 * @private
 */
function client(req, res) {
  const compiler = webpack(config);
  compiler.outputFileSystem = fsys;

  compiler.run((err, stats) => {
    const file = fsys.readFileSync(path.join(__dirname, 'dist', 'client.js'));

    res.setHeader('Content-Length', file.length);
    res.writeHead(200, { 'Content-Type': 'text/javascript' });

    res.end(file);
  });
}

//
// Poor or lazy man's HTTP file server. Don't do this, it's bad.
//
const server = http.createServer((req, res) => {
  console.log('received request for url', req.url);
  const ext = path.extname(req.url);

  switch(ext) {
    case '.svgs':
      svgs(req, res);
    break;

    case '.js':
      client(req, res);
    break;

    default:
      html(req, res);
  }
}).listen(8080);

//
// Output some information that we're live, ready to go.
//
console.log('Example server is running on http://localhost:8080');
