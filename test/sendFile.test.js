
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
var server
let shallUnref = false

describe('res', function () {

  afterEach(async () => {
    await server_.close().then(async () => {
      if (shallUnref) {
        await process._getActiveHandles().forEach(async (item) => {
          item.unref() // dirty trick for now
        })
      }
    })
  });
  describe('.sendFile(path)', async function () {

    it('should error missing path', function (done) {
      appCreateFn().then((resolve, reject) => {
        if (resolve) {
          server_ = resolve.app
          server = resolve.server
          let app = resolve.app

        }

        request(server)
          .get('/')
          .expect(500, /path.*required/, done)
      })


    });

    it('should error for non-string path', function (done) {

      appCreateFn(42).then((resolve, reject) => {
        if (resolve) {
          server_ = resolve.app
          server = resolve.server
          let app = resolve.app

        }

        request(server)
          .get('/')
          .expect(500, (err, res) => {
            done(assert.strictEqual(res.body.message, "path must be a string to res.sendFile"))
          })
      })


    })

    it('should transfer a file', function (done) {

      appCreateFn(path.resolve(fixtures, 'name.txt')).then((resolve, reject) => {
        if (resolve) {
          server_ = resolve.app
          server = resolve.server
          let app = resolve.app

        }

        request(server)
          .get('/')
          .expect(200, 'tobi', done);
      });
    })



    it('should transfer a file with special characters in string', function (done) {
      appCreateFn(path.resolve(fixtures, '% of dogs.txt')).then((resolve, reject) => {
        if (resolve) {
          server_ = resolve.app
          server = resolve.server
          let app = resolve.app

        }

        request(server)
          .get('/')
          .expect(200, '20%', done);
      });

    });

    it('should include ETag', function (done) {

      appCreateFn(path.resolve(fixtures, 'name.txt')).then((resolve, reject) => {
        if (resolve) {
          server_ = resolve.app
          server = resolve.server
          let app = resolve.app

        }

        request(server)
          .get('/')
          .expect('ETag', /^(?:W\/)?"[^"]+"$/)
          .expect(200, 'tobi', done);
      });
    });

    it('should 304 when ETag matches', function (done) {

      appCreateFn(path.resolve(fixtures, 'name.txt')).then((resolve, reject) => {
        if (resolve) {
          server_ = resolve.app
          server = resolve.server
          let app = resolve.app

        }

        request(server)
          .get('/')
          .expect('ETag', /^(?:W\/)?"[^"]+"$/)
          .expect(200, 'tobi', function (err, res) {
            if (err) return done(err);
            var etag = res.headers.etag;
            request(server)
              .get('/')
              .set('If-None-Match', etag)
              .expect(304, done);
          });
      });

    });

    it('should 404 for directory', function (done) {

      appCreateFn(path.resolve(fixtures, 'blog')).then((resolve, reject) => {
        if (resolve) {
          server_ = resolve.app
          server = resolve.server
          let app = resolve.app

        }
        request(server)
          .get('/')
          .expect(404, done);
      });

    });

    it('should 404 when not found', function (done) {
      appCreateFn(path.resolve(fixtures, 'blog')).then((resolve, reject) => {
        if (resolve) {
          server_ = resolve.app
          server = resolve.server
          let app = resolve.app
          app.use(function (req, res) {
            res.statusCode = 200;
            res.send('no!');
          });
        }

        request(server)
          .get('/')
          .expect(404, done);
      });

    });

    it('should not override manual content-types', function (done) {
      //shallUnref = true
      appCreateFn(null,null,null,true).then((resolve, reject) => {
        if (resolve) {
          server_ = resolve.app
          server = resolve.server
          let app = resolve.app
          app.use(function (req, res) {
            res.contentType('application/x-bogus');
            res.sendFile(path.resolve(fixtures, 'name.txt'));
          });
        }

        request(server)
          .get('/')
          .expect('Content-Type', 'application/x-bogus', done)
      })

    })
  })
  // More express tests need to be ported, but for now - it's sufficient
})

//describe('res.sendFile closing server', function(done) {
//
//})



async function appCreateFn(path, options, fn, noDefaultAppUse) {
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
  if (!noDefaultAppUse) {
    app.use(function (req, res) {
      res.sendFile(path, options, fn);
    });
  }
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
