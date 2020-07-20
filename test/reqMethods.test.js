
var after = require('after');
var path = require('path')

var express = require('restana')
	, request = require('supertest')
	, assert = require('assert');
var onFinished = require('on-finished');


let startPort = parseInt(process.env.PORT)
var server_
var server
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

				it('should return true when Accept is not present', function (done) {
					appCreateFn().then((resolve, reject) => {
						if (resolve) {
							server_ = resolve.app
							server = resolve.server
							let app = resolve.app

							app.use(function (req, res, next) {
								res.end(req.accepts('json') ? 'yes' : 'no');
							});
						}
						request(server)
							.get('/')
							.expect('yes', done);
					})

				});

				it('should return true when present', function (done) {

					appCreateFn().then((resolve, reject) => {
						if (resolve) {
							server_ = resolve.app
							server = resolve.server
							let app = resolve.app

							app.use(function (req, res, next) {
								res.end(req.accepts('json') ? 'yes' : 'no');
							});
						}
						request(server)
							.get('/')
							.set('Accept', 'application/json')
							.expect('yes', done);
					})


				})

				it('should return false otherwise', function (done) {

					appCreateFn().then((resolve, reject) => {
						if (resolve) {
							server_ = resolve.app
							server = resolve.server
							let app = resolve.app

							app.use(function (req, res, next) {
								res.end(req.accepts('json') ? 'yes' : 'no');
							});
						}
						request(server)
							.get('/')
							.set('Accept', 'text/html')
							.expect('no', done)
					})


				});
			})

			it('should accept an argument list of type names', function (done) {

				appCreateFn().then((resolve, reject) => {
					if (resolve) {
						server_ = resolve.app
						server = resolve.server
						let app = resolve.app

						app.use(function (req, res, next) {
							res.end(req.accepts('json', 'html'));
						});
					}
					request(server)
						.get('/')
						.set('Accept', 'application/json')
						.expect('json', done)
				})

			});

			describe('.accepts(types)', async function () {
				it('should return the first when Accept is not present', function (done) {

					appCreateFn().then((resolve, reject) => {
						if (resolve) {
							server_ = resolve.app
							server = resolve.server
							let app = resolve.app

							app.use(function (req, res, next) {
								res.end(req.accepts('json', 'html'));
							});
						}
						request(server)
							.get('/')
							.expect('json', done);
					})


				});

				it('should return the first acceptable type', function (done) {

					appCreateFn().then((resolve, reject) => {
						if (resolve) {
							server_ = resolve.app
							server = resolve.server
							let app = resolve.app

							app.use(function (req, res, next) {
								res.end(req.accepts('json', 'html'));
							});
						}
						request(server)
							.get('/')
							.set('Accept', 'text/html')
							.expect('html', done);
					})


				});

				it('should return false when no match is made', function (done) {

					appCreateFn().then((resolve, reject) => {
						if (resolve) {
							server_ = resolve.app
							server = resolve.server
							let app = resolve.app

							app.use(function (req, res, next) {
								res.end(req.accepts(['text/html', 'application/json']) ? 'yup' : 'nope');
							});
						}
						request(server)
							.get('/')
							.set('Accept', 'foo/bar, bar/baz')
							.expect('nope', done);
					})

				});

				it('should take quality into account', function (done) {

					appCreateFn().then((resolve, reject) => {
						if (resolve) {
							server_ = resolve.app
							server = resolve.server
							let app = resolve.app

							app.use(function (req, res, next) {
								res.end(req.accepts(['text/html', 'application/json']));
							});
						}
						request(server)
							.get('/')
							.set('Accept', '*/html; q=.5, application/json')
							.expect('application/json', done);
					})




				});
				it('should return the first acceptable type with canonical mime types', function (done) {

					appCreateFn().then((resolve, reject) => {
						if (resolve) {
							server_ = resolve.app
							server = resolve.server
							let app = resolve.app

							app.use(function (req, res, next) {
								res.end(req.accepts(['application/json', 'text/html']));
							});
						}
						request(server)
							.get('/')
							.set('Accept', '*/html')
							.expect('text/html', done);
					})

				});
			})

		})

		describe('req.acceptsCharsets', async function () {
			describe('.acceptsCharsets(type)', async function () {

				describe('when Accept-Charset is not present', async function () {
					it('should return true', function (done) {
						appCreateFn().then((resolve, reject) => {
							if (resolve) {
								server_ = resolve.app
								server = resolve.server
								let app = resolve.app

								app.use(function (req, res, next) {
									res.end(req.acceptsCharsets('utf-8') ? 'yes' : 'no');
								});
							}
							request(server)
								.get('/')
								.expect('yes', done);
						})

					})
				})

				describe('when Accept-Charset is present', async function () {
					it('should return true', function (done) {
						appCreateFn().then((resolve, reject) => {
							if (resolve) {
								server_ = resolve.app
								server = resolve.server
								let app = resolve.app

								app.use(function (req, res, next) {
									res.end(req.acceptsCharsets('utf-8') ? 'yes' : 'no');
								});
							}
							request(server)
								.get('/')
								.set('Accept-Charset', 'foo, bar, utf-8')
								.expect('yes', done);
						})

					})

					it('should return false otherwise', function (done) {
						appCreateFn().then((resolve, reject) => {
							if (resolve) {
								server_ = resolve.app
								server = resolve.server
								let app = resolve.app

								app.use(function (req, res, next) {
									res.end(req.acceptsCharsets('utf-8') ? 'yes' : 'no');
								});
							}
							request(server)
								.get('/')
								.set('Accept-Charset', 'foo, bar')
								.expect('no', done);
						})

					})
				})
			})
		})

		describe('req.acceptsEncodings', async function () {
			describe('.acceptsEncodings', async function () {
				it('should be true if encoding accepted', function (done) {

					appCreateFn().then((resolve, reject) => {
						if (resolve) {
							server_ = resolve.app
							server = resolve.server
							let app = resolve.app

							app.use(function (req, res) {
								req.acceptsEncodings('gzip').should.be.ok()
								req.acceptsEncodings('deflate').should.be.ok()
								res.end();
							});
						}
						request(server)
							.get('/')
							.set('Accept-Encoding', ' gzip, deflate')
							.expect(200, done);
					})


				})

				it('should be false if encoding not accepted', function (done) {
					appCreateFn().then((resolve, reject) => {
						if (resolve) {
							server_ = resolve.app
							server = resolve.server
							let app = resolve.app

							app.use(function (req, res) {
								req.acceptsEncodings('bogus').should.not.be.ok()
								res.end();
							});
						}
						request(server)
							.get('/')
							.set('Accept-Encoding', ' gzip, deflate')
							.expect(200, done);
					})

				})
			})
		})

		describe('req.acceptsLanguages', async function () {
			describe('.acceptsLanguages', async function () {
				it('should be true if language accepted', function (done) {
					appCreateFn().then((resolve, reject) => {
						if (resolve) {
							server_ = resolve.app
							server = resolve.server
							let app = resolve.app

							app.use(function (req, res) {
								req.acceptsLanguages('en-us').should.be.ok()
								req.acceptsLanguages('en').should.be.ok()
								res.end();
							});
						}
						request(server)
							.get('/')
							.set('Accept-Language', 'en;q=.5, en-us')
							.expect(200, done);
					})

				})

				it('should be false if language not accepted', function (done) {
					appCreateFn().then((resolve, reject) => {
						if (resolve) {
							server_ = resolve.app
							server = resolve.server
							let app = resolve.app

							app.use(function (req, res) {
								req.acceptsLanguages('es').should.not.be.ok()
								res.end();
							});
						}
						request(server)
							.get('/')
							.set('Accept-Language', 'en;q=.5, en-us')
							.expect(200, done);
					})

				})

				describe('when Accept-Language is not present', async function () {
					it('should always return true', function (done) {
						appCreateFn().then((resolve, reject) => {
							if (resolve) {
								server_ = resolve.app
								server = resolve.server
								let app = resolve.app

								app.use(function (req, res) {
									req.acceptsLanguages('en').should.be.ok()
									req.acceptsLanguages('es').should.be.ok()
									req.acceptsLanguages('jp').should.be.ok()
									res.end();
								});
							}
							request(server)
								.get('/')
								.expect(200, done);
						})
					})
				})
			})
		})
	})
	describe('req.get', async function () {
		describe('.get(field)', async function () {
			it('should return the header field value', function (done) {
				appCreateFn().then((resolve, reject) => {
					if (resolve) {
						server_ = resolve.app
						server = resolve.server
						let app = resolve.app

						app.use(function (req, res) {
							assert(req.get('Something-Else') === undefined);
							res.end(req.get('Content-Type'));
						});
					}
					request(server)
						.post('/')
						.set('Content-Type', 'application/json')
						.expect('application/json', done);
				})

			})

			it('should special-case Referer', function (done) {
				appCreateFn().then((resolve, reject) => {
					if (resolve) {
						server_ = resolve.app
						server = resolve.server
						let app = resolve.app

						app.use(function (req, res) {
							res.end(req.get('Referer'));
						});
					}
					request(server)
						.post('/')
						.set('Referrer', 'http://foobar.com')
						.expect('http://foobar.com', done);
				})

			})

			it('should throw missing header name', function (done) {
				appCreateFn().then((resolve, reject) => {
					if (resolve) {
						server_ = resolve.app
						server = resolve.server
						let app = resolve.app

						app.use(function (req, res) {
							res.end(req.get())
						})
					}
					request(server)
						.get('/')
						//.expect(500, /TypeError: name argument is required to req.get/, done)
						.expect(500, (err, res) => {
							done(assert.strictEqual(res.body.message, "name argument is required to req.get"))
						})
				})

			})

			it('should throw for non-string header name', function (done) {
				appCreateFn().then((resolve, reject) => {
					if (resolve) {
						server_ = resolve.app
						server = resolve.server
						let app = resolve.app

						app.use(function (req, res) {
							res.end(req.get(42))
						})
					}
					request(server)
						.get('/')
						//.expect(500, /TypeError: name must be a string to req.get/, done)
						.expect(500, (err, res) => {
							done(assert.strictEqual(res.body.message, "name must be a string to req.get"))
						})
				})

			})
		})
	})
	describe('req.param', async function () {
		describe('.param(name, default)', async function () {
			it('should use the default value unless defined', function (done) {
				appCreateFn().then((resolve, reject) => {
					if (resolve) {
						server_ = resolve.app
						server = resolve.server
						let app = resolve.app

						app.use(function (req, res) {
							res.end(req.param('name', 'tj'));
						});
					}
					request(server)
						.get('/')
						.expect('tj', done);
				})

			})
		})

		describe('.param(name)', async function () {
			it('should check req.query', function (done) {
				appCreateFn().then((resolve, reject) => {
					if (resolve) {
						server_ = resolve.app
						server = resolve.server
						let app = resolve.app

						app.use(function (req, res) {
							res.end(req.param('name'));
						});
					}
					request(server)
						.get('/?name=tj')
						.expect('tj', done);
				})

			})

			it('should check req.body', function (done) {
				appCreateFn().then((resolve, reject) => {
					if (resolve) {
						server_ = resolve.app
						server = resolve.server
						let app = resolve.app
						const bodyParser = require('body-parser')
						app.use(bodyParser.json())

						app.use(function (req, res) {
							res.end(req.param('name'));
						});
					}
					request(server)
						.post('/')
						.send({ name: 'tj' })
						.expect('tj', done);
				})

			})

			it('should check req.params', function (done) {
				appCreateFn().then((resolve, reject) => {
					if (resolve) {
						server_ = resolve.app
						server = resolve.server
						let app = resolve.app

						app.get('/user/:name', async function (req, res) {
							res.end(req.param('filter') + req.param('name'));
						});
					}
					request(server)
						.get('/user/tj')
						.expect('undefinedtj', done);
				})

			})
		})
	})

	describe('req.is', async function () {
		describe('req.is()', async function () {
			describe('when given a mime type', async function () {
				it('should return the type when matching', function (done) {
					appCreateFn().then((resolve, reject) => {
						if (resolve) {
							server_ = resolve.app
							server = resolve.server
							let app = resolve.app

							app.use(function (req, res) {
								res.json(req.is('application/json'))
							})
						}
						request(server)
							.post('/')
							.type('application/json')
							.send('{}')
							.expect(200, '"application/json"', done)
					})

				})

				it('should return false when not matching', function (done) {
					appCreateFn().then((resolve, reject) => {
						if (resolve) {
							server_ = resolve.app
							server = resolve.server
							let app = resolve.app

							app.use(function (req, res) {
								res.json(req.is('image/jpeg'))
							})
						}
						request(server)
							.post('/')
							.type('application/json')
							.send('{}')
							.expect(200, 'false', done)
					})

				})

				it('should ignore charset', function (done) {
					appCreateFn().then((resolve, reject) => {
						if (resolve) {
							server_ = resolve.app
							server = resolve.server
							let app = resolve.app

							app.use(function (req, res) {
								res.json(req.is('application/json'))
							})
						}
						request(server)
							.post('/')
							.type('application/json; charset=UTF-8')
							.send('{}')
							.expect(200, '"application/json"', done)
					})

				})
			})

			describe('when content-type is not present', async function () {
				it('should return false', function (done) {
					appCreateFn().then((resolve, reject) => {
						if (resolve) {
							server_ = resolve.app
							server = resolve.server
							let app = resolve.app

							app.use(function (req, res) {
								res.json(req.is('application/json'))
							})
						}
						request(server)
							.post('/')
							.send('{}')
							.expect(200, 'false', done)
					})

				})
			})

			describe('when given an extension', async function () {
				it('should lookup the mime type', function (done) {
					appCreateFn().then((resolve, reject) => {
						if (resolve) {
							server_ = resolve.app
							server = resolve.server
							let app = resolve.app

							app.use(function (req, res) {
								res.json(req.is('json'))
							})

						}
						request(server)
							.post('/')
							.type('application/json')
							.send('{}')
							.expect(200, '"json"', done)
					})

				})
			})

			describe('when given */subtype', async function () {
				it('should return the full type when matching', function (done) {
					appCreateFn().then((resolve, reject) => {
						if (resolve) {
							server_ = resolve.app
							server = resolve.server
							let app = resolve.app

							app.use(function (req, res) {
								res.json(req.is('*/json'))
							})

						}
						request(server)
							.post('/')
							.type('application/json')
							.send('{}')
							.expect(200, '"application/json"', done)
					})


				})

				it('should return false when not matching', function (done) {
					appCreateFn().then((resolve, reject) => {
						if (resolve) {
							server_ = resolve.app
							server = resolve.server
							let app = resolve.app

							app.use(function (req, res) {
								res.json(req.is('*/html'))
							})

						}
						request(server)
							.post('/')
							.type('application/json')
							.send('{}')
							.expect(200, 'false', done)
					})

				})

				it('should ignore charset', function (done) {
					appCreateFn().then((resolve, reject) => {
						if (resolve) {
							server_ = resolve.app
							server = resolve.server
							let app = resolve.app

							app.use(function (req, res) {
								res.json(req.is('*/json'))
							})

						}
						request(server)
							.post('/')
							.type('application/json; charset=UTF-8')
							.send('{}')
							.expect(200, '"application/json"', done)
					})

				})
			})

			describe('when given type/*', async function () {
				it('should return the full type when matching', function (done) {
					appCreateFn().then((resolve, reject) => {
						if (resolve) {
							server_ = resolve.app
							server = resolve.server
							let app = resolve.app

							app.use(function (req, res) {
								res.json(req.is('application/*'))
							})

						}

						request(server)
							.post('/')
							.type('application/json')
							.send('{}')
							.expect(200, '"application/json"', done)
					})

				})

				it('should return false when not matching', function (done) {
					appCreateFn().then((resolve, reject) => {
						if (resolve) {
							server_ = resolve.app
							server = resolve.server
							let app = resolve.app

							app.use(function (req, res) {
								res.json(req.is('text/*'))
							})

						}

						request(server)
							.post('/')
							.type('application/json')
							.send('{}')
							.expect(200, 'false', done)
					})

				})

				it('should ignore charset', function (done) {
					appCreateFn().then((resolve, reject) => {
						if (resolve) {
							server_ = resolve.app
							server = resolve.server
							let app = resolve.app

							app.use(function (req, res) {
								res.json(req.is('application/*'))
							})

						}

						request(server)
							.post('/')
							.type('application/json; charset=UTF-8')
							.send('{}')
							.expect(200, '"application/json"', done)
					})

				})
			})
		})

	})

	describe('req.range', async function () {
		describe('.range(size)', async function () {
			it('should return parsed ranges', function (done) {
				appCreateFn().then((resolve, reject) => {
					if (resolve) {
						server_ = resolve.app
						server = resolve.server
						let app = resolve.app

						app.use(function (req, res) {
							res.json(req.range(120))
						})

					}

					request(server)
						.get('/')
						.set('Range', 'bytes=0-50,51-100')
						.expect(200, '[{"start":0,"end":50},{"start":51,"end":100}]', done)
				})

			})

			it('should cap to the given size', function (done) {
				appCreateFn().then((resolve, reject) => {
					if (resolve) {
						server_ = resolve.app
						server = resolve.server
						let app = resolve.app

						app.use(function (req, res) {
							res.json(req.range(75))
						})

					}

					request(server)
						.get('/')
						.set('Range', 'bytes=0-100')
						.expect(200, '[{"start":0,"end":74}]', done)
				})

			})

			it('should cap to the given size when open-ended', function (done) {
				appCreateFn().then((resolve, reject) => {
					if (resolve) {
						server_ = resolve.app
						server = resolve.server
						let app = resolve.app

						app.use(function (req, res) {
							res.json(req.range(75))
						})

					}

					request(server)
						.get('/')
						.set('Range', 'bytes=0-')
						.expect(200, '[{"start":0,"end":74}]', done)
				})

			})

			it('should have a .type', function (done) {
				appCreateFn().then((resolve, reject) => {
					if (resolve) {
						server_ = resolve.app
						server = resolve.server
						let app = resolve.app

						app.use(function (req, res) {
							res.json(req.range(120).type)
						})

					}

					request(server)
						.get('/')
						.set('Range', 'bytes=0-100')
						.expect(200, '"bytes"', done)
				})

			})

			it('should accept any type', function (done) {
				appCreateFn().then((resolve, reject) => {
					if (resolve) {
						server_ = resolve.app
						server = resolve.server
						let app = resolve.app

						app.use(function (req, res) {
							res.json(req.range(120).type)
						})

					}

					request(server)
						.get('/')
						.set('Range', 'users=0-2')
						.expect(200, '"users"', done)
				})

			})

			it('should return undefined if no range', function (done) {
				appCreateFn().then((resolve, reject) => {
					if (resolve) {
						server_ = resolve.app
						server = resolve.server
						let app = resolve.app

						app.use(function (req, res) {
							res.send(String(req.range(120)))
						})

					}

					request(server)
						.get('/')
						.expect(200, 'undefined', done)
				})

			})
		})

		describe('.range(size, options)', async function () {
			describe('with "combine: true" option', async function () {
				it('should return combined ranges', function (done) {
					appCreateFn().then((resolve, reject) => {
						if (resolve) {
							server_ = resolve.app
							server = resolve.server
							let app = resolve.app

							app.use(function (req, res) {
								res.json(req.range(120, {
									combine: true
								}))
							})

						}

						request(server)
							.get('/')
							.set('Range', 'bytes=0-50,51-100')
							.expect(200, '[{"start":0,"end":100}]', done)
					})
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