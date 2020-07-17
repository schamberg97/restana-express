
const express = require('restana')
	, request = require('supertest');
var utils = require('../test/support/utils');
var path = require('path')
let compatibilityLayerPath = path.resolve('./index.js')
let restanaExpressCompatibilityMod = require(compatibilityLayerPath)
let compatibilityLayerPathSettings = {
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
}
var server_

describe('res', function () {
	afterEach(() => server_.close());
	describe('.vary(str)', function () {
		it('should set the Content-Type based on a filename', function (done) {
			var app = express();
			let restanaExpressCompatibility = new restanaExpressCompatibilityMod(compatibilityLayerPathSettings)
			app.use(restanaExpressCompatibility.middleware)

			app.use(function (req, res) {
				res.type('foo.js').end('var name = "tj";');
			});

			let server = app.start(~~process.env.PORT)
			server.then((resolve) => {
				server_ = resolve
				request(resolve)
					.get('/')
					.expect('Content-Type', 'application/javascript; charset=utf-8')
					.end(done)
			})
		})

		describe('with no arguments', function () {
			it('should not set Vary', function (done) {
				var app = express();
				let restanaExpressCompatibility = new restanaExpressCompatibilityMod(compatibilityLayerPathSettings)
				app.use(restanaExpressCompatibility.middleware)

				app.use(function (req, res) {
					res.vary();
					res.end();
				});

				let server = app.start(~~process.env.PORT)
				server.then((resolve) => {
					server_ = resolve
					request(resolve)
						.get('/')
						.expect(utils.shouldNotHaveHeader('Vary'))
						.expect(200, done);
				})
			})
		})

		describe('with an empty array', function () {
			it('should not set Vary', function (done) {
				var app = express();
				let restanaExpressCompatibility = new restanaExpressCompatibilityMod(compatibilityLayerPathSettings)
				app.use(restanaExpressCompatibility.middleware)

				app.use(function (req, res) {
					res.vary([]);
					res.end();
				});

				let server = app.start(~~process.env.PORT)
				server.then((resolve) => {
					server_ = resolve
					request(resolve)
						.get('/')
						.expect(utils.shouldNotHaveHeader('Vary'))
						.expect(200, done);
				})
			})
		})

		describe('with an array', function () {
			it('should set the values', function (done) {
				var app = express();
				let restanaExpressCompatibility = new restanaExpressCompatibilityMod(compatibilityLayerPathSettings)
				app.use(restanaExpressCompatibility.middleware)

				app.use(function (req, res) {
					res.vary(['Accept', 'Accept-Language', 'Accept-Encoding']);
					res.end();
				});

				let server = app.start(~~process.env.PORT)
				server.then((resolve) => {
					server_ = resolve
					request(resolve)
						.get('/')
						.expect('Vary', 'Accept, Accept-Language, Accept-Encoding')
						.expect(200, done);
				})
			})
		})

		describe('with a string', function () {
			it('should set the value', function (done) {
				var app = express();
				let restanaExpressCompatibility = new restanaExpressCompatibilityMod(compatibilityLayerPathSettings)
				app.use(restanaExpressCompatibility.middleware)

				app.use(function (req, res) {
					res.vary('Accept');
					res.end();
				});

				let server = app.start(~~process.env.PORT)
				server.then((resolve) => {
					server_ = resolve
					request(resolve)
						.get('/')
						.expect('Vary', 'Accept')
						.expect(200, done);
				})
			})
		})

		describe('when the value is present', function () {
			it('should not add it again', function (done) {
				var app = express();
				let restanaExpressCompatibility = new restanaExpressCompatibilityMod(compatibilityLayerPathSettings)
				app.use(restanaExpressCompatibility.middleware)

				app.use(function (req, res) {
					res.vary('Accept');
					res.vary('Accept-Encoding');
					res.vary('Accept-Encoding');
					res.vary('Accept-Encoding');
					res.vary('Accept');
					res.end();
				});

				let server = app.start(~~process.env.PORT)
				server.then((resolve) => {
					server_ = resolve
					request(resolve)
						.get('/')
						.expect('Vary', 'Accept, Accept-Encoding')
						.expect(200, done);
				})
			})
		})
	})
})
