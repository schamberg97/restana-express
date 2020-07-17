
const express = require('restana')
var request = require('supertest');
const expect = require('chai').expect
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
	afterEach (() => server_.close());
	describe('.set(field, value)', function () {
		
		it('should set the response header field', function (done) {
			var app = express();
			let restanaExpressCompatibility = new restanaExpressCompatibilityMod(compatibilityLayerPathSettings)
			app.use(restanaExpressCompatibility.middleware)
			app.use(function (req, res) {
				res.set('Content-Type', 'text/x-foo; charset=utf-8').end();
			});
			
			let server = app.start(~~process.env.PORT)
			server.then((resolve)=> {
				server_ = resolve
				request(resolve)
					.get('/')
					.expect('Content-Type', 'text/x-foo; charset=utf-8')
					.end(done);
			})
			
		})

		it('should coerce to a string', function (done) {
			var app = express();
			let restanaExpressCompatibility = new restanaExpressCompatibilityMod(compatibilityLayerPathSettings)
			app.use(restanaExpressCompatibility.middleware)

			app.use(function (req, res) {
				res.set('X-Number', 123);
				res.end(typeof res.get('X-Number'));
			});

			let server = app.start(~~process.env.PORT)
			server.then((resolve)=> {
				server_ = resolve
				request(resolve)
					.get('/')
					.expect('X-Number', '123')
					.expect(200, 'string', done);
			})
		})

	})

	describe('.set(field, values)', function () {
		it('should set multiple response header fields', function (done) {
			var app = express();
			let restanaExpressCompatibility = new restanaExpressCompatibilityMod(compatibilityLayerPathSettings)
			app.use(restanaExpressCompatibility.middleware)

			app.use(function (req, res) {
				res.set('Set-Cookie', ["type=ninja", "language=javascript"]);
				res.send(res.get('Set-Cookie'));
			});
			let server = app.start(~~process.env.PORT)
			server.then((resolve)=> {
				server_ = resolve
				request(resolve)
					.get('/')
					.expect('["type=ninja","language=javascript"]', done);
			})
		})

		it('should coerce to an array of strings', function (done) {
			var app = express();
			let restanaExpressCompatibility = new restanaExpressCompatibilityMod(compatibilityLayerPathSettings)
			app.use(restanaExpressCompatibility.middleware)

			app.use(function (req, res) {
				res.set('X-Numbers', [123, 456]);
				res.end(JSON.stringify(res.get('X-Numbers')));
			});
			
			let server = app.start(~~process.env.PORT)
			server.then((resolve)=> {
				server_ = resolve
				request(resolve)
					.get('/')
					.expect('X-Numbers', '123, 456')
					.expect(200, '["123","456"]', done);
			})
		})

		it('should not set a charset of one is already set', function (done) {
			var app = express();

			let restanaExpressCompatibility = new restanaExpressCompatibilityMod(compatibilityLayerPathSettings)
			app.use(restanaExpressCompatibility.middleware)

			app.use(function (req, res) {
				res.set('Content-Type', 'text/html; charset=lol');
				res.end();
			});
			let server = app.start(~~process.env.PORT)
			server.then((resolve)=> {
				server_ = resolve
				request(resolve)
					.get('/')
					.expect('Content-Type', 'text/html; charset=lol')
					.expect(200, done);
			})
		})


		it('should throw when Content-Type is an array', async function () {
			var app = express()

			let restanaExpressCompatibility = new restanaExpressCompatibilityMod(compatibilityLayerPathSettings)
			app.use(restanaExpressCompatibility.middleware)


			app.use(function (req, res) {
				res.set('Content-Type', ['text/html'])
				res.end()
			});

			let server = app.start(~~process.env.PORT)
			server.then((resolve)=> {
				server_ = resolve
				request(resolve)
					.get('/')
					.expect(500)
					.then((res) => {
						expect(res.body.code).to.equal(500)
						expect(res.body.message).to.equal("Content-Type cannot be set to an Array")
					})
			})
		})

	})

	describe('.set(object)', function () {
		it('should set multiple fields', function (done) {
			var app = express();

			let restanaExpressCompatibility = new restanaExpressCompatibilityMod(compatibilityLayerPathSettings)
			app.use(restanaExpressCompatibility.middleware)


			app.use(function (req, res) {
				res.set({
					'X-Foo': 'bar',
					'X-Bar': 'baz'
				}).end();
			});

			let server = app.start(~~process.env.PORT)
			server.then((resolve)=> {
				server_ = resolve
				request(resolve)
					.get('/')
					.expect('X-Foo', 'bar')
					.expect('X-Bar', 'baz')
					.end(done);
			})
		})

		it('should coerce to a string', function (done) {
			var app = express();

			let restanaExpressCompatibility = new restanaExpressCompatibilityMod(compatibilityLayerPathSettings)
			app.use(restanaExpressCompatibility.middleware)


			app.use(function (req, res) {
				res.set({ 'X-Number': 123 });
				res.end(typeof res.get('X-Number'));
			});

			let server = app.start(~~process.env.PORT)
			server.then((resolve)=> {
				server_ = resolve
				request(resolve)
					.get('/')
					.expect('X-Number', '123')
					.expect(200, 'string', done);
			})
		})
	})
})
