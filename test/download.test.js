'use strict'

/* global describe, it */
const path = require('path')

var request = require('supertest');
var after = require('after');
var assert = require('assert');
var Buffer = require('safe-buffer').Buffer


describe('Express.js res.download methods', () => {
	let server
	const app = require('restana')()
	it('should start the app', async () => {
		server = await app.start(~~process.env.PORT)
	})

	let compatibilityLayerPath = path.resolve('./index.js')
	let restanaExpressCompatibilityMod = require(compatibilityLayerPath)
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

	describe('res', function () {
		describe('.download(path)', function () {
			it('should transfer as an attachment', function (done) {

				app.get('/1/', function (req, res) {
					res.download('test/fixtures/user.html');
				});

				request(server)
					.get('/1/')
					.expect('Content-Type', 'text/html; charset=UTF-8')
					.expect('Content-Disposition', 'attachment; filename="user.html"')
					.expect(200, '<p>{{user.name}}</p>', done)
			})
		})
		describe('.download(path, filename)', function () {
			it('should provide an alternate filename', function (done) {

				app.get('/2/', function (req, res) {
					res.download('test/fixtures/user.html', 'document');
				});

				request(server)
					.get('/2/')
					.expect('Content-Type', 'text/html; charset=UTF-8')
					.expect('Content-Disposition', 'attachment; filename="document"')
					.expect(200, done)
			})
		})
		describe('.download(path, fn)', function () {
			it('should invoke the callback', function (done) {
				
				var cb = after(2, done);

				app.get('/3/', function (req, res) {
					res.download('test/fixtures/user.html', cb);
				});

				request(server)
					.get('/3/')
					.expect('Content-Type', 'text/html; charset=UTF-8')
					.expect('Content-Disposition', 'attachment; filename="user.html"')
					.expect(200, cb);
			})
		})

		describe('.download(path, filename, fn)', function () {
			it('should invoke the callback', function (done) {
				
				var cb = after(2, done);

				app.get('/4/', function (req, res) {
					res.download('test/fixtures/user.html', 'document', done);
				});

				request(server)
					.get('/4/')
					.expect('Content-Type', 'text/html; charset=UTF-8')
					.expect('Content-Disposition', 'attachment; filename="document"')
					.expect(200, cb);
			})
		})

		describe('.download(path, filename, options, fn)', function () {
			it('should invoke the callback', function (done) {
				
				var cb = after(2, done)
				var options = {}

				app.get('/5/', function (req, res) {
					res.download('test/fixtures/user.html', 'document', options, done)
				})

				request(server)
					.get('/5/')
					.expect(200)
					.expect('Content-Type', 'text/html; charset=UTF-8')
					.expect('Content-Disposition', 'attachment; filename="document"')
					.end(cb)
			})

			it('should allow options to res.sendFile()', function (done) {
				

				app.get('/6/', function (req, res) {
					res.download('test/fixtures/.name', 'document', {
						dotfiles: 'allow',
						maxAge: '4h'
					})
				})

				request(server)
					.get('/6/')
					.expect(200)
					.expect('Content-Disposition', 'attachment; filename="document"')
					.expect('Cache-Control', 'public, max-age=14400')
					.expect(shouldHaveBody(Buffer.from('tobi')))
					.end(done)
			})

			describe('when options.headers contains Content-Disposition', function () {
				it('should be ignored', function (done) {
					

					app.get('/7/', function (req, res) {
						res.download('test/fixtures/user.html', 'document', {
							headers: {
								'Content-Type': 'text/x-custom',
								'Content-Disposition': 'inline'
							}
						})
					})

					request(server)
						.get('/7/')
						.expect(200)
						.expect('Content-Type', 'text/x-custom')
						.expect('Content-Disposition', 'attachment; filename="document"')
						.end(done)
				})

				it('should be ignored case-insensitively', function (done) {
					

					app.get('/8/', function (req, res) {
						res.download('test/fixtures/user.html', 'document', {
							headers: {
								'content-type': 'text/x-custom',
								'content-disposition': 'inline'
							}
						})
					})

					request(server)
						.get('/8/')
						.expect(200)
						.expect('Content-Type', 'text/x-custom')
						.expect('Content-Disposition', 'attachment; filename="document"')
						.end(done)
				})
			})
		})

		describe('on failure', function () {
			it('should invoke the callback', function (done) {
				

				app.get('/9/', function (req, res, next) {
					res.download('test/fixtures/foobar.html', function (err) {
						if (!err) return next(new Error('expected error'));
						res.send('got ' + err.status + ' ' + err.code);
					});
				});

				request(server)
					.get('/9/')
					.expect(200, 'got 404 ENOENT', done);
			})

			it('should remove Content-Disposition', function (done) {
				

				app.get('/10/', function (req, res, next) {
					res.download('test/fixtures/foobar.html', function (err) {
						if (!err) return next(new Error('expected error'));
						res.end('failed');
					});
				});

				request(server)
					.get('/10/')
					.expect(shouldNotHaveHeader('Content-Disposition'))
					.expect(200, 'failed', done);
			})
		})
	})


	it('should successfully terminate the app', async () => {
		await app.close()
	})

})

function shouldHaveBody (buf) {
	return function (res) {
	  var body = !Buffer.isBuffer(res.body)
		? Buffer.from(res.text)
		: res.body
	  assert.ok(body, 'response has body')
	  assert.strictEqual(body.toString('hex'), buf.toString('hex'))
	}
  }
  
  function shouldNotHaveHeader(header) {
	return function (res) {
	  assert.ok(!(header.toLowerCase() in res.headers), 'should not have header ' + header);
	};
  }