
const express = require('restana')
	, request = require('supertest');
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
	describe('.type(str)', function () {
		it('should set the Content-Type based on a filename', function (done) {
			var app = express();
			let restanaExpressCompatibility = new restanaExpressCompatibilityMod(compatibilityLayerPathSettings)
			app.use(restanaExpressCompatibility.middleware)
			app.use(function (req, res) {
				res.type('foo.js').end('var name = "tj";');
			});

			let server = app.start(~~process.env.PORT)
			server.then((resolve)=> {
				server_ = resolve
				request(resolve)
					.get('/')
					.expect('Content-Type', 'application/javascript; charset=utf-8')
					.end(done)
			})
		})

		it('should default to application/octet-stream', function (done) {
			var app = express();

			let restanaExpressCompatibility = new restanaExpressCompatibilityMod(compatibilityLayerPathSettings)
			app.use(restanaExpressCompatibility.middleware)

			app.use(function (req, res) {
				res.type('rawr').end('var name = "tj";');
			});

			let server = app.start(~~process.env.PORT)
			server.then((resolve)=> {
				server_ = resolve
				request(resolve)
					.get('/')
					.expect('Content-Type', 'application/octet-stream', done);
			})
		})

		it('should set the Content-Type with type/subtype', function (done) {
			var app = express();

			let restanaExpressCompatibility = new restanaExpressCompatibilityMod(compatibilityLayerPathSettings)
			app.use(restanaExpressCompatibility.middleware)

			app.use(function (req, res) {
				res.type('application/vnd.amazon.ebook')
					.end('var name = "tj";');
			});
			let server = app.start(~~process.env.PORT)
			server.then((resolve)=> {
				server_ = resolve
				request(resolve)
					.get('/')
					.expect('Content-Type', 'application/vnd.amazon.ebook', done);
			})
		})
	})
})
