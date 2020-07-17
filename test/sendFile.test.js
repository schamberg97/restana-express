
var after = require('after');
var path = require('path')
var Buffer = require('safe-buffer').Buffer
var express = require('restana')
  , request = require('supertest')
  , assert = require('assert');
var onFinished = require('on-finished');
var path = require('path');
var should = require('should');
var fixtures = path.join(__dirname, '../test/fixtures');
var utils = require('../test/support/utils');

let startPort = parseInt(process.env.PORT)
var server_
let shallUnref = false

describe('res', function () {

  afterEach (async () => {
    await server_.close().then(async() => {
      if (shallUnref) {
        await process._getActiveHandles().forEach(async(item) => {
          item.unref() // dirty trick for now
        })
      }
    })
  });
  describe('.sendFile(path)', async function () {

    it('should error missing path', async function () {
      let appCreate = await appCreateFn();
      server_ = appCreate.app

      request(appCreate.server)
        .get('/')
        .expect(500, /path.*required/)
    });

    it('should error for non-string path', async function () {
      
      let appCreate = await appCreateFn(42);
      server_ = appCreate.app

      request(appCreate.server)
        .get('/')
        .expect(500, /TypeError: path must be a string to res.sendFile/)
    })

    it('should transfer a file', async function () {
      
      let appCreate = await appCreateFn(path.resolve(fixtures, 'name.txt'));
      server_ = appCreate.app

      request(appCreate.server)
        .get('/')
        .expect(200, 'tobi');
    });

    it('should transfer a file with special characters in string', async function () {
      
      let appCreate = await appCreateFn(path.resolve(fixtures, '% of dogs.txt'));
      server_ = appCreate.app

      request(appCreate.server)
        .get('/')
        .expect(200, '20%');
    });

    it('should include ETag', async function () {
      
      let appCreate = await appCreateFn(path.resolve(fixtures, 'name.txt'));
      server_ = appCreate.app

      request(appCreate.server)
        .get('/')
        .expect('ETag', /^(?:W\/)?"[^"]+"$/)
        .expect(200, 'tobi');
    });

    it('should 304 when ETag matches', async function () {
      
      var appCreate = await appCreateFn(path.resolve(fixtures, 'name.txt'));
      server_ = appCreate.app

      request(appCreate.server)
        .get('/')
        .expect('ETag', /^(?:W\/)?"[^"]+"$/)
        .expect(200, 'tobi', function (err, res) {
          if (err) throw new Error(err);
          var etag = res.headers.etag;
          request(appCreate.server)
            .get('/')
            .set('If-None-Match', etag)
            .expect(304);
        });
    });

    it('should 404 for directory', async function () {
      
      var appCreate = await appCreateFn(path.resolve(fixtures, 'blog'));
      server_ = appCreate.app

      request(appCreate.server)
        .get('/')
        .expect(404);
    });

    it('should 404 when not found', async function () {
      var appCreate = await appCreateFn(path.resolve(fixtures, 'does-no-exist'));
      server_ = appCreate.app

      appCreate.app.use(function (req, res) {
        res.statusCode = 200;
        res.send('no!');
      });

      request(appCreate.server)
        .get('/')
        .expect(404);
    });

    it('should not override manual content-types', async function () {
      shallUnref = true
      var appCreate = await appCreateFn();
      server_ = appCreate.app

      appCreate.app.use(function (req, res) {
        res.contentType('application/x-bogus');
        res.sendFile(path.resolve(fixtures, 'name.txt'));
      });

      request(appCreate.server)
        .get('/')
        .expect('Content-Type', 'application/x-bogus')
    })
  })
  // More express tests need to be ported, but for now - it's sufficient
})

//describe('res.sendFile closing server', function(done) {
//
//})



async function appCreateFn(path, options, fn) {
  var app = express();
  let server = await app.start(startPort)
  let restanaExpressCompatibilityMod = require(require('path').resolve(__dirname + '/../index.js'))
  let restanaExpressCompatibility = new restanaExpressCompatibilityMod({
    res: {
      toUse: 'all',
      render: {
        views: process.env.VIEWS_LOCATION,
        renderExt: '.pug',
        renderEngine: 'pug',
        //renderFunction: "__express"
      }
    },
    req: {
      toUse: 'all',
      proxy: true,
      proxyTrust: 'all'
    }
  })
  app.use(restanaExpressCompatibility.middleware)
  app.use(function (req, res) {
    res.sendFile(path, options, fn);
  });
  //startPort = startPort + 1
  return { app: app, server: server };
}

function shouldHaveBody(buf) {
  return function (res) {
    var body = !Buffer.isBuffer(res.body)
      ? Buffer.from(res.text)
      : res.body
    assert.ok(body, 'response has body')
    assert.strictEqual(body.toString('hex'), buf.toString('hex'))
  }
}
