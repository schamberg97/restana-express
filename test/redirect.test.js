'use strict'

/* global describe, it */
const path = require('path')
const request = require('supertest')

var assert = require('assert')
var utils = require('../test/support/utils');



describe('Express.js res.redirect methods', () => {
	let server
	const app = require('restana')()
	it('should start the service', async () => {
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
	describe('.redirect(url)', function () {
		it('should default to a 302 redirect', function (done) {
			

			app.get('/1/', function (req, res) {
				res.redirect('http://google.com');
			});

			request(server)
				.get('/1/')
				.expect('location', 'http://google.com')
				.expect(302, done)
		})

		it('should encode "url"', function (done) {
			

			app.get('/2/', function (req, res) {
				res.redirect('https://google.com?q=\u2603 §10')
			})

			request(server)
				.get('/2/')
				.expect('Location', 'https://google.com?q=%E2%98%83%20%C2%A710')
				.expect(302, done)
		})

		it('should not touch already-encoded sequences in "url"', function (done) {
			

			app.get('/3/', function (req, res) {
				res.redirect('https://google.com?q=%A710')
			})

			request(server)
				.get('/3/')
				.expect('Location', 'https://google.com?q=%A710')
				.expect(302, done)
		})
	})

	describe('.redirect(status, url)', function () {
		it('should set the response status', function (done) {
			

			app.get('/4/', function (req, res) {
				res.redirect(303, 'http://google.com');
			});

			request(server)
				.get('/4/')
				.expect('Location', 'http://google.com')
				.expect(303, done)
		})
	})

	describe('.redirect(url, status)', function () {
		it('should set the response status', function (done) {
			

			app.get('/5/', function (req, res) {
				res.redirect('http://google.com', 303);
			});

			request(server)
				.get('/5/')
				.expect('Location', 'http://google.com')
				.expect(303, done)
		})
	})

	describe('when the request method is HEAD', function () {
		it('should ignore the body', function (done) {
			

			app.get('/6/', function (req, res) {
				res.redirect('http://google.com');
			});

			request(server)
				.head('/6/')
				.expect(302)
				.expect('Location', 'http://google.com')
				.expect(shouldNotHaveBody())
				.end(done)
		})
	})

	describe('when accepting html', function () {
		it('should respond with html', function (done) {
			

			app.get('/7/', function (req, res) {
				res.redirect('http://google.com');
			});

			request(server)
				.get('/7/')
				.set('Accept', 'text/html')
				.expect('Content-Type', /html/)
				.expect('Location', 'http://google.com')
				.expect(302, '<p>Found. Redirecting to <a href="http://google.com">http://google.com</a></p>', done)
		})

		it('should escape the url', function (done) {
			

			app.get('/8/', function (req, res) {
				res.redirect('<la\'me>');
			});

			request(server)
				.get('/8/')
				.set('Host', 'http://example.com')
				.set('Accept', 'text/html')
				.expect('Content-Type', /html/)
				.expect('Location', '%3Cla\'me%3E')
				.expect(302, '<p>Found. Redirecting to <a href="%3Cla&#39;me%3E">%3Cla&#39;me%3E</a></p>', done)
		})

		it('should include the redirect type', function (done) {
			

			app.get('/9/', function (req, res) {
				res.redirect(301, 'http://google.com');
			});

			request(server)
				.get('/9/')
				.set('Accept', 'text/html')
				.expect('Content-Type', /html/)
				.expect('Location', 'http://google.com')
				.expect(301, '<p>Moved Permanently. Redirecting to <a href="http://google.com">http://google.com</a></p>', done);
		})
	})

	describe('when accepting text', function () {
		it('should respond with text', function (done) {
			

			app.get('/10/', function (req, res) {
				res.redirect('http://google.com');
			});

			request(server)
				.get('/10/')
				.set('Accept', 'text/plain, */*')
				.expect('Content-Type', /plain/)
				.expect('Location', 'http://google.com')
				.expect(302, 'Found. Redirecting to http://google.com', done)
		})

		it('should encode the url', function (done) {
			

			app.get('/11/', function (req, res) {
				res.redirect('http://example.com/?param=<script>alert("hax");</script>');
			});

			request(server)
				.get('/11/')
				.set('Host', 'http://example.com')
				.set('Accept', 'text/plain, */*')
				.expect('Content-Type', /plain/)
				.expect('Location', 'http://example.com/?param=%3Cscript%3Ealert(%22hax%22);%3C/script%3E')
				.expect(302, 'Found. Redirecting to http://example.com/?param=%3Cscript%3Ealert(%22hax%22);%3C/script%3E', done)
		})

		it('should include the redirect type', function (done) {
			

			app.get('/12/', function (req, res) {
				res.redirect(301, 'http://google.com');
			});

			request(server)
				.get('/12/')
				.set('Accept', 'text/plain, */*')
				.expect('Content-Type', /plain/)
				.expect('Location', 'http://google.com')
				.expect(301, 'Moved Permanently. Redirecting to http://google.com', done);
		})
	})

	describe('when accepting neither text or html', function () {
		it('should respond with an empty body', function (done) {
			

			app.get('/13/', function (req, res) {
				res.redirect('http://google.com');
			});

			request(server)
				.get('/13/')
				.set('Accept', 'application/octet-stream')
				.expect('location', 'http://google.com')
				.expect(utils.shouldNotHaveHeader('Content-Type'))
				.expect('content-length', '0')
				.expect(302)
				.expect(shouldNotHaveBody())
				.end(done)
		})
	})


	it('should successfully terminate the service', async () => {
		await app.close()
	})



})

function shouldNotHaveBody() {
	return function (res) {
		assert.ok(res.text === '' || res.text === undefined)
	}
}
