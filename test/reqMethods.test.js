
var after = require('after');
var path = require('path')

var express = require('restana')
	, request = require('supertest')
	, assert = require('assert');
var onFinished = require('on-finished');


let startPort = parseInt(process.env.PORT)
var server_
let shallUnref = false

describe('req methods', async function () {
	afterEach(async () => {
		await server_.close().then(async () => {
			if (shallUnref) {
				await process._getActiveHandles().forEach(async (item) => {
					item.unref() // dirty trick for now
				})
			}
		})
	});
	describe('req.accepts family', async function () {


		describe('req.accepts', async function () {


			describe('.accepts(type)', async function () {

				it('should return true when Accept is not present', async function () {
					let appCreate = await appCreateFn();
					server_ = appCreate.app
					let app = appCreate.app

					app.use(function (req, res, next) {
						res.end(req.accepts('json') ? 'yes' : 'no');
					});

					request(appCreate.server)
						.get('/')
						.expect('yes');
				});

				it('should return true when present', async function () {

					let appCreate = await appCreateFn();
					server_ = appCreate.app
					let app = appCreate.app

					app.use(function (req, res, next) {
						res.end(req.accepts('json') ? 'yes' : 'no');
					});

					request(appCreate.server)
						.get('/')
						.set('Accept', 'application/json')
						.expect('yes');
				})

				it('should return false otherwise', async function () {

					let appCreate = await appCreateFn();
					server_ = appCreate.app
					let app = appCreate.app

					app.use(function (req, res, next) {
						res.end(req.accepts('json') ? 'yes' : 'no');
					});

					request(appCreate.server)
						.get('/')
						.set('Accept', 'text/html')
						.expect('no')
				});
			})

			it('should accept an argument list of type names', async function () {

				let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app

				app.use(function (req, res, next) {
					res.end(req.accepts('json', 'html'));
				});

				request(appCreate.server)
					.get('/')
					.set('Accept', 'application/json')
					.expect('json')
			});

			describe('.accepts(types)', async function () {
				it('should return the first when Accept is not present', async function () {

					let appCreate = await appCreateFn();
					server_ = appCreate.app
					let app = appCreate.app

					app.use(function (req, res, next) {
						res.end(req.accepts(['json', 'html']));
					});

					request(appCreate.server)
						.get('/')
						.expect('json');
				});

				it('should return the first acceptable type', async function () {

					let appCreate = await appCreateFn();
					server_ = appCreate.app
					let app = appCreate.app

					app.use(function (req, res, next) {
						res.end(req.accepts(['json', 'html']));
					});

					request(appCreate.server)
						.get('/')
						.set('Accept', 'text/html')
						.expect('json');
				});

				it('should return false when no match is made', async function () {

					let appCreate = await appCreateFn();
					server_ = appCreate.app
					let app = appCreate.app

					app.use(function (req, res, next) {
						res.end(req.accepts(['text/html', 'application/json']) ? 'yup' : 'nope');
					});

					request(appCreate.server)
						.get('/')
						.set('Accept', 'foo/bar, bar/baz')
						.expect('json');
				});
				it('should take quality into account', async function () {

					let appCreate = await appCreateFn();
					server_ = appCreate.app
					let app = appCreate.app

					app.use(function (req, res, next) {
						res.end(req.accepts(['text/html', 'application/json']));
					});

					request(appCreate.server)
						.get('/')
						.set('Accept', '*/html; q=.5, application/json')
						.expect('application/json');
				});
				it('should return the first acceptable type with canonical mime types', async function () {

					let appCreate = await appCreateFn();
					server_ = appCreate.app
					let app = appCreate.app

					app.use(function (req, res, next) {
						res.end(req.accepts(['application/json', 'text/html']));
					});
					request(appCreate.server)
						.get('/')
						.set('Accept', '*/html')
						.expect('text/html');
				});
			})

		})

		describe('req.acceptsCharsets', async function () {
			describe('.acceptsCharsets(type)', async function () {

				describe('when Accept-Charset is not present', async function () {
					it('should return true', async function () {
						let appCreate = await appCreateFn();
						server_ = appCreate.app
						let app = appCreate.app

						app.use(function (req, res, next) {
							res.end(req.acceptsCharsets('utf-8') ? 'yes' : 'no');
						});

						request(appCreate.server)
							.get('/')
							.expect('yes');
					})
				})

				describe('when Accept-Charset is present', async function () {
					it('should return true', async function () {
						let appCreate = await appCreateFn();
						server_ = appCreate.app
						let app = appCreate.app

						app.use(function (req, res, next) {
							res.end(req.acceptsCharsets('utf-8') ? 'yes' : 'no');
						});

						request(appCreate.server)
							.get('/')
							.set('Accept-Charset', 'foo, bar, utf-8')
							.expect('yes');
					})

					it('should return false otherwise', async function () {
						let appCreate = await appCreateFn();
						server_ = appCreate.app
						let app = appCreate.app

						app.use(function (req, res, next) {
							res.end(req.acceptsCharsets('utf-8') ? 'yes' : 'no');
						});

						request(appCreate.server)
							.get('/')
							.set('Accept-Charset', 'foo, bar')
							.expect('no');
					})
				})
			})
		})

		describe('req.acceptsEncodings', async function () {
			describe('.acceptsEncodings', async function () {
				it('should be true if encoding accepted', async function () {

					let appCreate = await appCreateFn();
					server_ = appCreate.app
					let app = appCreate.app

					app.use(function (req, res) {
						req.acceptsEncodings('gzip').should.be.ok()
						req.acceptsEncodings('deflate').should.be.ok()
						res.end();
					});

					request(appCreate.server)
						.get('/')
						.set('Accept-Encoding', ' gzip, deflate')
						.expect(200);
				})

				it('should be false if encoding not accepted', async function () {
					let appCreate = await appCreateFn();
					server_ = appCreate.app
					let app = appCreate.app

					app.use(function (req, res) {
						req.acceptsEncodings('bogus').should.not.be.ok()
						res.end();
					});

					request(appCreate.server)
						.get('/')
						.set('Accept-Encoding', ' gzip, deflate')
						.expect(200);
				})
			})
		})

		describe('req.acceptsLanguages', async function () {
			describe('.acceptsLanguages', async function () {
				it('should be true if language accepted', async function () {
					let appCreate = await appCreateFn();
					server_ = appCreate.app
					let app = appCreate.app

					app.use(function (req, res) {
						req.acceptsLanguages('en-us').should.be.ok()
						req.acceptsLanguages('en').should.be.ok()
						res.end();
					});

					request(appCreate.server)
						.get('/')
						.set('Accept-Language', 'en;q=.5, en-us')
						.expect(200);
				})

				it('should be false if language not accepted', async function () {
					let appCreate = await appCreateFn();
					server_ = appCreate.app
					let app = appCreate.app

					app.use(function (req, res) {
						req.acceptsLanguages('es').should.not.be.ok()
						res.end();
					});

					request(appCreate.server)
						.get('/')
						.set('Accept-Language', 'en;q=.5, en-us')
						.expect(200);
				})

				describe('when Accept-Language is not present', async function () {
					it('should always return true', async function () {
						let appCreate = await appCreateFn();
						server_ = appCreate.app
						let app = appCreate.app

						app.use(function (req, res) {
							req.acceptsLanguages('en').should.be.ok()
							req.acceptsLanguages('es').should.be.ok()
							req.acceptsLanguages('jp').should.be.ok()
							res.end();
						});

						request(appCreate.server)
							.get('/')
							.expect(200);
					})
				})
			})
		})
	})
	describe('req.get', async function () {
		describe('.get(field)', async function () {
			it('should return the header field value', async function () {
				let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app;

				app.use(function (req, res) {
					assert(req.get('Something-Else') === undefined);
					res.end(req.get('Content-Type'));
				});

				request(appCreate.server)
					.post('/')
					.set('Content-Type', 'application/json')
					.expect('application/json');
			})

			it('should special-case Referer', async function () {
				let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app;

				app.use(function (req, res) {
					res.end(req.get('Referer'));
				});

				request(appCreate.server)
					.post('/')
					.set('Referrer', 'http://foobar.com')
					.expect('http://foobar.com');
			})

			it('should throw missing header name', async function () {
				let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app

				app.use(function (req, res) {
					res.end(req.get())
				})

				request(appCreate.server)
					.get('/')
					.expect(500, /TypeError: name argument is required to req.get/)
			})

			it('should throw for non-string header name', async function () {
				let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app

				app.use(function (req, res) {
					res.end(req.get(42))
				})

				request(appCreate.server)
					.get('/')
					.expect(500, /TypeError: name must be a string to req.get/)
			})
		})
	})
	describe('req.param', async function () {
		describe('.param(name, default)', async function () {
			it('should use the default value unless defined', async function () {
				let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app

				app.use(function (req, res) {
					res.end(req.param('name', 'tj'));
				});

				request(appCreate.server)
					.get('/')
					.expect('tj');
			})
		})

		describe('.param(name)', async function () {
			it('should check req.query', async function () {
				let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app

				app.use(function (req, res) {
					res.end(req.param('name'));
				});

				request(appCreate.server)
					.get('/?name=tj')
					.expect('tj');
			})

			it('should check req.body', async function () {
				let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app

				app.use(function (req, res) {
					res.end(req.param('name'));
				});

				request(appCreate.server)
					.post('/')
					.send({ name: 'tj' })
					.expect('tj');
			})

			it('should check req.params', async function () {
				let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app

				app.get('/user/:name', async function (req, res) {
					res.end(req.param('filter') + req.param('name'));
				});

				request(appCreate.server)
					.get('/user/tj')
					.expect('undefinedtj');
			})
		})
	})

	describe('req.is', async function() {
		describe('req.is()', async function () {
			describe('when given a mime type', async function () {
			  it('should return the type when matching', async function () {
				let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app
		  
				app.use(function (req, res) {
				  res.json(req.is('application/json'))
				})
		  
				request(appCreate.server)
				.post('/')
				.type('application/json')
				.send('{}')
				.expect(200, '"application/json"')
			  })
		  
			  it('should return false when not matching', async function () {
				let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app
		  
				app.use(function (req, res) {
				  res.json(req.is('image/jpeg'))
				})
		  
				request(appCreate.server)
				.post('/')
				.type('application/json')
				.send('{}')
				.expect(200, 'false')
			  })
		  
			  it('should ignore charset', async function () {
				let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app
		  
				app.use(function (req, res) {
				  res.json(req.is('application/json'))
				})
		  
				request(appCreate.server)
				.post('/')
				.type('application/json; charset=UTF-8')
				.send('{}')
				.expect(200, '"application/json"')
			  })
			})
		  
			describe('when content-type is not present', async function(){
			  it('should return false', async function () {
				let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app
		  
				app.use(function (req, res) {
				  res.json(req.is('application/json'))
				})
		  
				request(appCreate.server)
				.post('/')
				.send('{}')
				.expect(200, 'false')
			  })
			})
		  
			describe('when given an extension', async function(){
			  it('should lookup the mime type', async function () {
				let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app
		  
				app.use(function (req, res) {
				  res.json(req.is('json'))
				})
		  
				request(appCreate.server)
				.post('/')
				.type('application/json')
				.send('{}')
				.expect(200, '"json"')
			  })
			})
		  
			describe('when given */subtype', async function(){
			  it('should return the full type when matching', async function () {
				let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app
		  
				app.use(function (req, res) {
				  res.json(req.is('*/json'))
				})
		  
				request(appCreate.server)
				.post('/')
				.type('application/json')
				.send('{}')
				.expect(200, '"application/json"')
			  })
		  
			  it('should return false when not matching', async function () {
				let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app
		  
				app.use(function (req, res) {
				  res.json(req.is('*/html'))
				})
		  
				request(appCreate.server)
				.post('/')
				.type('application/json')
				.send('{}')
				.expect(200, 'false')
			  })
		  
			  it('should ignore charset', async function () {
				let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app
		  
				app.use(function (req, res) {
				  res.json(req.is('*/json'))
				})
		  
				request(appCreate.server)
				.post('/')
				.type('application/json; charset=UTF-8')
				.send('{}')
				.expect(200, '"application/json"')
			  })
			})
		  
			describe('when given type/*', async function(){
			  it('should return the full type when matching', async function () {
				let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app
		  
				app.use(function (req, res) {
				  res.json(req.is('application/*'))
				})
		  
				request(appCreate.server)
				.post('/')
				.type('application/json')
				.send('{}')
				.expect(200, '"application/json"')
			  })
		  
			  it('should return false when not matching', async function () {
				let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app
		  
				app.use(function (req, res) {
				  res.json(req.is('text/*'))
				})
		  
				request(appCreate.server)
				.post('/')
				.type('application/json')
				.send('{}')
				.expect(200, 'false')
			  })
		  
			  it('should ignore charset', async function () {
				let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app
		  
				app.use(function (req, res) {
				  res.json(req.is('application/*'))
				})
		  
				request(appCreate.server)
				.post('/')
				.type('application/json; charset=UTF-8')
				.send('{}')
				.expect(200, '"application/json"')
			  })
			})
		  })
		  
	})

	describe('req.range', async function() {
		describe('.range(size)', async function(){
			it('should return parsed ranges', async function() {
			  let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app
		
			  app.use(function (req, res) {
				res.json(req.range(120))
			  })
		
			  request(appCreate.server)
			  .get('/')
			  .set('Range', 'bytes=0-50,51-100')
			  .expect(200, '[{"start":0,"end":50},{"start":51,"end":100}]')
			})
		
			it('should cap to the given size', async function() {
			  let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app
		
			  app.use(function (req, res) {
				res.json(req.range(75))
			  })
		
			  request(appCreate.server)
			  .get('/')
			  .set('Range', 'bytes=0-100')
			  .expect(200, '[{"start":0,"end":74}]')
			})
		
			it('should cap to the given size when open-ended', async function() {
			  let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app
		
			  app.use(function (req, res) {
				res.json(req.range(75))
			  })
		
			  request(appCreate.server)
			  .get('/')
			  .set('Range', 'bytes=0-')
			  .expect(200, '[{"start":0,"end":74}]')
			})
		
			it('should have a .type', async function() {
			  let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app
		
			  app.use(function (req, res) {
				res.json(req.range(120).type)
			  })
		
			  request(appCreate.server)
			  .get('/')
			  .set('Range', 'bytes=0-100')
			  .expect(200, '"bytes"')
			})
		
			it('should accept any type', async function() {
			  let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app
		
			  app.use(function (req, res) {
				res.json(req.range(120).type)
			  })
		
			  request(appCreate.server)
			  .get('/')
			  .set('Range', 'users=0-2')
			  .expect(200, '"users"')
			})
		
			it('should return undefined if no range', async function() {
			  let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app
		
			  app.use(function (req, res) {
				res.send(String(req.range(120)))
			  })
		
			  request(appCreate.server)
			  .get('/')
			  .expect(200, 'undefined')
			})
		  })
		
		  describe('.range(size, options)', async function(){
			describe('with "combine: true" option', async function(){
			  it('should return combined ranges', async function() {
				let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app
		
				app.use(function (req, res) {
				  res.json(req.range(120, {
					combine: true
				  }))
				})
		
				request(appCreate.server)
				.get('/')
				.set('Range', 'bytes=0-50,51-100')
				.expect(200, '[{"start":0,"end":100}]')
			  })
			})
		  })
	})

})


async function appCreateFn() {
	var app_ = express();
	let server = await app_.start(startPort)
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
	app_.use(restanaExpressCompatibility.middleware)
	return { app: app_, server: server };
}