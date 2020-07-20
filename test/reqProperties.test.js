
var after = require('after');
var path = require('path')

var express = require('restana')
	, request = require('supertest')
	, assert = require('assert');
var onFinished = require('on-finished');
const { expect } = require('chai');


let startPort = parseInt(process.env.PORT)
var server_
var server
let shallUnref = false

describe('req properties', function () {
	afterEach(async () => {
		if (server_ !== null) {
			await server_.close().then(async () => {
				if (shallUnref) {
					await process._getActiveHandles().forEach(async (item) => {
						item.unref() // dirty trick for now
					})
				}
			})
		}
	});

	describe('.fresh', function () {
		it('should return true when the resource is not modified', function (done) {
			appCreateFn().then((resolve, reject) => {
				if (resolve) {
					server_ = resolve.app
					server = resolve.server
					let app = resolve.app
					var etag = '"12345"';

					app.use(function (req, res) {
						res.set('ETag', etag);
						res.send(req.fresh);
					});

				}
				request(server)
					.get('/')
					.set('If-None-Match', etag)
					.expect(304, done)
			})



		})

		it('should return false when the resource is modified', function (done) {
			appCreateFn().then((resolve, reject) => {
				if (resolve) {
					server_ = resolve.app
					server = resolve.server
					let app = resolve.app

					app.use(function (req, res) {
						res.set('ETag', '"123"');
						res.send(req.fresh);
					});

				}
				request(server)
					.get('/')
					.set('If-None-Match', '"12345"')
					.expect(200, 'false', done);
			})

		})

		it('should return false without response headers', function (done) {

			appCreateFn().then((resolve, reject) => {
				if (resolve) {
					server_ = resolve.app
					server = resolve.server
					let app = resolve.app

					app.use(function (req, res) {
						res.send(req.fresh);
					});



				}
				request(server)
					.get('/')
					.expect(200, 'false', done);
			})
		})
	})

	describe('.hostname', function () {
		it('should return the Host when present', function (done) {

			appCreateFn().then((resolve, reject) => {
				if (resolve) {
					server_ = resolve.app
					server = resolve.server
					let app = resolve.app

					app.use(function (req, res) {
						res.end(req.hostname);
					});



				}
				request(server)
					.post('/')
					.set('Host', 'example.com')
					.expect('example.com', done);
			})
		})

		it('should strip port number', function (done) {

			appCreateFn().then((resolve, reject) => {
				if (resolve) {
					server_ = resolve.app
					server = resolve.server
					let app = resolve.app

					app.use(function (req, res) {
						res.end(req.hostname);
					});



				}
				request(server)
					.post('/')
					.set('Host', 'example.com:3000')
					.expect('example.com', done);
			})
		})

		it('should return undefined otherwise', function (done) {

			appCreateFn().then((resolve, reject) => {
				if (resolve) {
					server_ = resolve.app
					server = resolve.server
					let app = resolve.app

					app.use(function (req, res) {
						req.headers.host = null;
						res.end(String(req.hostname));
					});



				}
				request(server)
					.post('/')
					.expect('undefined', done);
			})
		})

		it('should work with IPv6 Host', function (done) {


			appCreateFn().then((resolve, reject) => {
				if (resolve) {
					server_ = resolve.app
					server = resolve.server
					let app = resolve.app

					app.use(function (req, res) {
						res.end(req.hostname);
					});

				}

				request(server)
					.post('/')
					.set('Host', '[::1]')
					.expect('[::1]', done);
			})
		})

		it('should work with IPv6 Host and port', function (done) {

			appCreateFn().then((resolve, reject) => {
				if (resolve) {
					server_ = resolve.app
					server = resolve.server
					let app = resolve.app

					app.use(function (req, res) {
						res.end(req.hostname);
					});

				}

				request(server)
					.post('/')
					.set('Host', '[::1]:3000')
					.expect('[::1]', done);
			})
		})

		describe('when "trust proxy" is enabled', function () {
			it('should respect X-Forwarded-Host', function (done) {

				let options = {
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


				appCreateFn(options).then((resolve, reject) => {
					if (resolve) {
						server_ = resolve.app
						server = resolve.server
						let app = resolve.app
						app.use(function (req, res) {
							res.end(req.hostname);
						});

					}

					request(server)
						.get('/')
						.set('Host', 'localhost')
						.set('X-Forwarded-Host', 'example.com:3000')
						.expect('example.com', done);
				})
			})

			it('should ignore X-Forwarded-Host if socket addr not trusted', function (done) {


				let options = {
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
						proxyTrust: '10.0.0.1'
					}
				}

				appCreateFn(options).then((resolve, reject) => {
					if (resolve) {
						server_ = resolve.app
						server = resolve.server
						let app = resolve.app
						app.use(function (req, res) {
							res.end(req.hostname);
						});

					}

					request(server)
						.get('/')
						.set('Host', 'localhost')
						.set('X-Forwarded-Host', 'example.com')
						.expect('localhost', done);
				})


			})

			it('should default to Host', function (done) {
				let options = {
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

				appCreateFn(options).then((resolve, reject) => {
					if (resolve) {
						server_ = resolve.app
						server = resolve.server
						let app = resolve.app
						app.use(function (req, res) {
							res.end(req.hostname);
						});
					}
					request(server)
						.get('/')
						.set('Host', 'example.com')
						.expect('example.com', done);
				})


			})

			describe('when multiple X-Forwarded-Host', async function () {
				it('should use the first value', function (done) {

					let options = {
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
					appCreateFn(options).then((resolve, reject) => {
						if (resolve) {
							server_ = resolve.app
							server = resolve.server
							let app = resolve.app
							app.use(function (req, res) {
								res.end(req.hostname);
							});
						}
						request(server)
							.get('/')
							.set('Host', 'localhost')
							.set('X-Forwarded-Host', 'example.com, foobar.com')
							.expect(200, 'example.com', done)
					})


				})

				it('should remove OWS around comma', function (done) {
					let options = {
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

					appCreateFn(options).then((resolve, reject) => {
						if (resolve) {
							server_ = resolve.app
							server = resolve.server
							let app = resolve.app
							app.use(function (req, res) {
								res.end(req.hostname);
							});
						}
						request(server)
							.get('/')
							.set('Host', 'localhost')
							.set('X-Forwarded-Host', 'example.com , foobar.com')
							.expect(200, 'example.com', done)
					})

				})

				it('should strip port number', function (done) {
					let options = {
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
					appCreateFn(options).then((resolve, reject) => {
						if (resolve) {
							server_ = resolve.app
							server = resolve.server
							let app = resolve.app
							app.use(function (req, res) {
								res.end(req.hostname);
							});
						}
						request(server)
							.get('/')
							.set('Host', 'localhost')
							.set('X-Forwarded-Host', 'example.com:8080 , foobar.com:8888')
							.expect(200, 'example.com', done)

					})


				})
			})
		})

		describe('when "trust proxy" is disabled', async function () {
			it('should ignore X-Forwarded-Host', function (done) {
				appCreateFn().then((resolve, reject) => {
					if (resolve) {
						server_ = resolve.app
						server = resolve.server
						let app = resolve.app
						app.use(function (req, res) {
							res.end(req.hostname);
						});
					}
					request(server)
						.get('/')
						.set('Host', 'localhost')
						.set('X-Forwarded-Host', 'evil')
						.expect('localhost', done);

				})


			})
		})
	})
	describe('.ip', async function () {
		describe('when X-Forwarded-For is present', async function () {
			describe('when "trust proxy" is enabled', async function () {
				it('should return the client addr', function (done) {

					let options = {
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

					appCreateFn(options).then((resolve, reject) => {
						if (resolve) {
							server_ = resolve.app
							server = resolve.server
							let app = resolve.app
							app.use(function (req, res, next) {
								res.send(req.ip);
							});
						}
						request(server)
							.get('/')
							.set('X-Forwarded-For', 'client, p1, p2')
							.expect('client', done);

					})

				})

				it('should return the addr after trusted proxy', function (done) {
					let options = {
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
							proxyTrust: 2
						}
					}
					appCreateFn(options).then((resolve, reject) => {
						if (resolve) {
							server_ = resolve.app
							server = resolve.server
							let app = resolve.app
							app.use(function (req, res, next) {
								res.send(req.ip);
							});
						}
						request(server).get('/')
							.set('X-Forwarded-For', 'client, p1, p2')
							.expect('p1', done);

					})

				})

			})

			describe('when "trust proxy" is disabled', async function () {
				it('should return the remote address', function (done) {
					appCreateFn().then((resolve, reject) => {
						if (resolve) {
							server_ = resolve.app
							server = resolve.server
							let app = resolve.app
							app.use(function (req, res, next) {
								res.send(req.ip);
							});
						}
						var test = request(server).get('/')
						test.set('X-Forwarded-For', 'client, p1, p2')
						test.expect(200, getExpectedClientAddress(server), done);

					})
				})
			})
		})

		describe('when X-Forwarded-For is not present', async function () {
			it('should return the remote address', function (done) {
				let options = {
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
				appCreateFn(options).then((resolve, reject) => {
					if (resolve) {
						server_ = resolve.app
						server = resolve.server
						let app = resolve.app
						app.use(function (req, res, next) {
							res.send(req.ip);
						});
					}
					var test = request(server).get('/')
					test.expect(200, getExpectedClientAddress(server), done);
				})


			})
		})
	})

	describe('.ips', async function () {
		describe('when X-Forwarded-For is present', async function () {
			describe('when "trust proxy" is enabled', async function () {
				it('should return an array of the specified addresses', function (done) {
					let options = {
						res: {
							toUse: 'all',
							render: {
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
					appCreateFn(options).then((resolve, reject) => {
						if (resolve) {
							server_ = resolve.app
							server = resolve.server
							let app = resolve.app
							app.use(function (req, res, next) {
								res.send(req.ips);
							});
						}
						request(server)
							.get('/')
							.set('X-Forwarded-For', 'client, p1, p2')
							.expect('["client","p1","p2"]', done);

					})


				})

				it('should stop at first untrusted', function (done) {
					let options = {
						res: {
							toUse: 'all',
							render: {
								renderExt: '.pug',
								renderEngine: 'pug',
								//renderFunction: "__express"
							}
						},
						req: {
							toUse: 'all',
							proxyTrust: 2
						}
					}
					appCreateFn(options).then((resolve, reject) => {
						if (resolve) {
							server_ = resolve.app
							server = resolve.server
							let app = resolve.app
							app.use(function (req, res, next) {
								res.send(req.ips);
							});
						}
						request(server)
							.get('/')
							.set('X-Forwarded-For', 'client, p1, p2')
							.expect('["p1","p2"]', done);
					})



				})
			})

			describe('when "trust proxy" is disabled', async function () {
				it('should return an empty array', function (done) {
					appCreateFn().then((resolve, reject) => {
						if (resolve) {
							server_ = resolve.app
							server = resolve.server
							let app = resolve.app
							app.use(function (req, res, next) {
								res.send(req.ips);
							});
						}
						request(server)
							.get('/')
							.set('X-Forwarded-For', 'client, p1, p2')
							.expect('[]', done);
					})


				})
			})
		})

		describe('when X-Forwarded-For is not present', async function () {
			it('should return []', function (done) {
				appCreateFn().then((resolve, reject) => {
					if (resolve) {
						server_ = resolve.app
						server = resolve.server
						let app = resolve.app
						app.use(function (req, res, next) {
							res.send(req.ips);
						});
					}
					request(server)
						.get('/')
						.expect('[]', done);
				})

			})
		})
	})

	describe('.protocol', async function () {
		it('should return the protocol string', function (done) {
			appCreateFn().then((resolve, reject) => {
				if (resolve) {
					server_ = resolve.app
					server = resolve.server
					let app = resolve.app
					app.use(function (req, res) {
						res.end(req.protocol);
					});
				}
				request(server)
					.get('/')
					.expect('http', done);
			})




		})

		describe('when "trust proxy" is enabled', async function () {
			it('should respect X-Forwarded-Proto', function (done) {
				let options = {
					res: {
						toUse: 'all',
						render: {
						}
					},
					req: {
						toUse: 'all',
						proxyTrust: true
					}
				}
				appCreateFn(options).then((resolve, reject) => {
					if (resolve) {
						server_ = resolve.app
						server = resolve.server
						let app = resolve.app
						app.use(function (req, res) {
							res.end(req.protocol);
						});
					}
					request(server)
						.get('/')
						.set('X-Forwarded-Proto', 'https')
						.expect('https', done);
				})


			})

			it('should default to the socket addr if X-Forwarded-Proto not present', function (done) {
				let options = {
					res: {
						toUse: 'all',
						render: {
							renderExt: '.pug',
							renderEngine: 'pug',
							//renderFunction: "__express"
						}
					},
					req: {
						toUse: 'all',
						proxyTrust: true
					}
				}
				appCreateFn(options).then((resolve, reject) => {
					if (resolve) {
						server_ = resolve.app
						server = resolve.server
						let app = resolve.app
						app.use(function (req, res) {
							req.connection.encrypted = true;
							res.end(req.protocol);
						});
					}
					request(server)
						.get('/')
						.expect('https', done);
				})

			})

			it('should ignore X-Forwarded-Proto if socket addr not trusted', function (done) {
				let options = {
					res: {
						toUse: 'all',
						render: {
							renderExt: '.pug',
							renderEngine: 'pug',
							//renderFunction: "__express"
						}
					},
					req: {
						toUse: 'all',
						proxyTrust: '10.0.0.1'
					}
				}
				appCreateFn(options).then((resolve, reject) => {
					if (resolve) {
						server_ = resolve.app
						server = resolve.server
						let app = resolve.app
						app.use(function (req, res) {
							res.end(req.protocol);
						});
					}
					request(server)
						.get('/')
						.set('X-Forwarded-Proto', 'https')
						.expect('http', done);
				})
			})

			it('should default to http', function (done) {
				let options = {
					res: {
						toUse: 'all',
						render: {
							renderExt: '.pug',
							renderEngine: 'pug',
							//renderFunction: "__express"
						}
					},
					req: {
						toUse: 'all',
						proxyTrust: true
					}
				}
				appCreateFn(options).then((resolve, reject) => {
					if (resolve) {
						server_ = resolve.app
						server = resolve.server
						let app = resolve.app
						app.use(function (req, res) {
							res.end(req.protocol);
						});
					}
					request(server)
						.get('/')
						.expect('http', done);
				})


			})

			describe('when trusting hop count', async function () {
				it('should respect X-Forwarded-Proto', function (done) {
					let options = {
						res: {
							toUse: 'all',
							render: {
								renderExt: '.pug',
								renderEngine: 'pug',
								//renderFunction: "__express"
							}
						},
						req: {
							toUse: 'all',
							proxyTrust: 1
						}
					}
					appCreateFn(options).then((resolve, reject) => {
						if (resolve) {
							server_ = resolve.app
							server = resolve.server
							let app = resolve.app
							app.use(function (req, res) {
								res.end(req.protocol);
							});
						}
						request(server)
							.get('/')
							.set('X-Forwarded-Proto', 'https')
							.expect('https', done);
					})


				})
			})
		})

		describe('when "trust proxy" is disabled', async function () {
			it('should ignore X-Forwarded-Proto', function (done) {
				appCreateFn().then((resolve, reject) => {
					if (resolve) {
						server_ = resolve.app
						server = resolve.server
						let app = resolve.app
						app.use(function (req, res) {
							res.end(req.protocol);
						});
					}
					request(server)
						.get('/')
						.set('X-Forwarded-Proto', 'https')
						.expect('http', done);
				})


			})
		})
	})

	describe('.query', async function () {
		it('should default to {}', function (done) {
			appCreateFn().then((resolve, reject) => {
				if (resolve) {
					server_ = resolve.app
					server = resolve.server
					let app = resolve.app

				}
				request(server)
					.get('/query/')
					.expect(200, '{}', done);
			})


		});

		it('should default to parse complex keys', function (done) {
			appCreateFn().then((resolve, reject) => {
				if (resolve) {
					server_ = resolve.app
					server = resolve.server
					let app = resolve.app

				}
				request(server)
					.get('/query/?user[name]=tj')
					.expect(200, '{"user":{"name":"tj"}}', done);
			})


		});

		describe('when "query parser" is extended', async function () {
			it('should parse complex keys', function (done) {
				let options = {
					res: {
						toUse: 'all',
						render: {
							renderExt: '.pug',
							renderEngine: 'pug',
							//renderFunction: "__express"
						}
					},
					req: {
						toUse: 'all',
						queryParser: "extended"
					}
				}
				appCreateFn(options).then((resolve, reject) => {
					if (resolve) {
						server_ = resolve.app
						server = resolve.server
						let app = resolve.app

					}
					request(server)
						.get('/query/?foo[0][bar]=baz&foo[0][fizz]=buzz&foo[]=done!')
						.expect(200, '{"foo":[{"bar":"baz","fizz":"buzz"},"done!"]}', done);
				})


			});

			it('should parse parameters with dots', function (done) {
				let options = {
					res: {
						toUse: 'all',
						render: {
							renderExt: '.pug',
							renderEngine: 'pug',
							//renderFunction: "__express"
						}
					},
					req: {
						toUse: 'all',
						queryParser: "extended"
					}
				}
				appCreateFn(options).then((resolve, reject) => {
					if (resolve) {
						server_ = resolve.app
						server = resolve.server
						let app = resolve.app

					}
					request(server)
						.get('/query/?user.name=tj')
						.expect(200, '{"user.name":"tj"}', done);
				})


			});
		});

		describe('when "query parser" is simple', async function () {
			it('should not parse complex keys', function (done) {
				let options = {
					res: {
						toUse: 'all',
						render: {
							renderExt: '.pug',
							renderEngine: 'pug',
							//renderFunction: "__express"
						}
					},
					req: {
						toUse: 'all',
						queryParser: "simple"
					}
				}
				appCreateFn(options).then((resolve, reject) => {
					if (resolve) {
						server_ = resolve.app
						server = resolve.server
						let app = resolve.app

					}
					request(server)
						.get('/query/?user%5Bname%5D=tj')
						.expect(200, '{"user[name]":"tj"}', done);
				})



			});
		});

		describe('when "query parser" is a function', async function () {
			it('should parse using function', function (done) {
				let options = {
					res: {
						toUse: 'all',
						render: {
							renderExt: '.pug',
							renderEngine: 'pug',
							//renderFunction: "__express"
						}
					},
					req: {
						toUse: 'all',
						queryParser: function (str) {
							return { 'length': (str || '').length };
						}
					}
				}
				appCreateFn(options).then((resolve, reject) => {
					if (resolve) {
						server_ = resolve.app
						server = resolve.server
						let app = resolve.app

					}
					request(server)
						.get('/query/?user%5Bname%5D=tj')
						.expect(200, '{"length":17}', done);
				})


			});
		});

		describe('when "query parser" disabled', async function () {
			it('should not parse query', function (done) {
				let options = {
					res: {
						toUse: 'all',
						render: {
							renderExt: '.pug',
							renderEngine: 'pug',
							//renderFunction: "__express"
						}
					},
					req: {
						toUse: 'all',
						queryParser: false
					}
				}
				appCreateFn(options).then((resolve, reject) => {
					if (resolve) {
						server_ = resolve.app
						server = resolve.server
						let app = resolve.app

					}
					request(server)
						.get('/query/?user%5Bname%5D=tj')
						.expect(200, '{}', done);
				})



			});
		});

		describe('when "query parser" enabled', async function () {
			it('should not parse complex keys', function (done) {
				let options = {
					res: {
						toUse: 'all',
						render: {
							renderExt: '.pug',
							renderEngine: 'pug',
							//renderFunction: "__express"
						}
					},
					req: {
						toUse: 'all',
						queryParser: true
					}
				}
				appCreateFn(options).then((resolve, reject) => {
					if (resolve) {
						server_ = resolve.app
						server = resolve.server
						let app = resolve.app

					}
					request(server)
						.get('/query/?user%5Bname%5D=tj')
						.expect(200, '{"user[name]":"tj"}', done);
				})

			});
		});

		describe('when "query parser fn" is missing', async function () {
			it('should act like "extended"', function (done) {
				appCreateFn().then((resolve, reject) => {
					if (resolve) {
						server_ = resolve.app
						server = resolve.server
						let app = resolve.app

					}
					request(server)
						.get('/query/?user[name]=tj&user.name=tj')
						.expect(200, '{"user":{"name":"tj"},"user.name":"tj"}', done);
				})


			});
		});

		//describe('when "query parser" an unknown value', async function () {
		//	it('should throw', async function () {
		//		server_ = null
		//		let options = {
		//			res: {
		//				toUse: 'all',
		//				render: {
		//					renderExt: '.pug',
		//					renderEngine: 'pug',
		//					//renderFunction: "__express"
		//				}
		//			},
		//			req: {
		//				toUse: 'all',
		//				queryParser: "boogie-woogie"
		//			}
		//		}
		//		// should.throw(/unknown value.*query parser/);
		//		
		//	});
		//});

		// could not figure how to make this check

	})
	describe('.secure', async function () {
		describe('when X-Forwarded-Proto is missing', async function () {
			it('should return false when http', function (done) {
				appCreateFn().then((resolve, reject) => {
					if (resolve) {
						server_ = resolve.app
						server = resolve.server
						let app = resolve.app
						app.get('/', async function (req, res) {
							res.send(req.secure ? 'yes' : 'no');
						});
					}
					request(server)
						.get('/')
						.expect('no', done)
				})
			})
		})
	})

	describe('.secure', async function () {
		describe('when X-Forwarded-Proto is present', async function () {
			it('should return false when http', function (done) {


				appCreateFn().then((resolve, reject) => {
					if (resolve) {
						server_ = resolve.app
						server = resolve.server
						let app = resolve.app
						app.get('/', async function (req, res) {
							res.send(req.secure ? 'yes' : 'no');
						});
					}
					request(server)
						.get('/')
						.set('X-Forwarded-Proto', 'https')
						.expect('no', done)
				})
			})

			it('should return true when "trust proxy" is enabled', function (done) {
				let options = {
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
						proxyTrust: true
					}
				}
				appCreateFn(options).then((resolve, reject) => {
					if (resolve) {
						server_ = resolve.app
						server = resolve.server
						let app = resolve.app
						app.get('/', function(req, res){
							res.send(req.secure ? 'yes' : 'no');
						  });
					}
					request(server)
						.get('/')
						.set('X-Forwarded-Proto', 'https')
						.expect('yes', done)
				})


			})

			it('should return false when initial proxy is http', function (done) {
				let options = {
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
						proxyTrust: true
					}
				}
				appCreateFn(options).then((resolve, reject) => {
					if (resolve) {
						server_ = resolve.app
						server = resolve.server
						let app = resolve.app
						app.get('/', async function (req, res) {
							res.send(req.secure ? 'yes' : 'no');
						});
					}
					request(server)
						.get('/')
						.set('X-Forwarded-Proto', 'http, https')
						.expect('no', done)
				})


			})

			it('should return true when initial proxy is https', function (done) {
				let options = {
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
						proxyTrust: true
					}
				}
				appCreateFn(options).then((resolve, reject) => {
					if (resolve) {
						server_ = resolve.app
						server = resolve.server
						let app = resolve.app
						app.get('/', async function (req, res) {
							res.send(req.secure ? 'yes' : 'no');
						});
					}
					request(server)
						.get('/')
						.set('X-Forwarded-Proto', 'https, http')
						.expect('yes', done)
				})


			})

			describe('when "trust proxy" trusting hop count', async function () {
				it('should respect X-Forwarded-Proto', function (done) {
					let options = {
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
							proxyTrust: 1
						}
					}
					appCreateFn(options).then((resolve, reject) => {
						if (resolve) {
							server_ = resolve.app
							server = resolve.server
							let app = resolve.app
							app.get('/', async function (req, res) {
								res.send(req.secure ? 'yes' : 'no');
							});
						}
						request(server)
							.get('/')
							.set('X-Forwarded-Proto', 'https')
							.expect('yes', done)
					})


				})
			})
		})
	})
	describe('.stale', async function () {
		it('should return false when the resource is not modified', function (done) {
			appCreateFn().then((resolve, reject) => {
				if (resolve) {
					server_ = resolve.app
					server = resolve.server
					let app = resolve.app
					var etag = '"12345"';

					app.use(function (req, res) {
						res.set('ETag', etag);
						res.send(req.stale);
					});
				}
				request(server)
				.get('/')
				.set('If-None-Match', etag)
				.expect(304, done);
			})
			

			
		})

		it('should return true when the resource is modified', function (done) {
			appCreateFn().then((resolve, reject) => {
				if (resolve) {
					server_ = resolve.app
					server = resolve.server
					let app = resolve.app

					app.use(function (req, res) {
						res.set('ETag', '"123"');
						res.send(req.stale);
					});
				}
				request(server)
				.get('/')
				.set('If-None-Match', '"12345"')
				.expect(200, 'true', done);
			})

		})

		it('should return true without response headers',  function (done) {
			appCreateFn().then((resolve, reject) => {
				if (resolve) {
					server_ = resolve.app
					server = resolve.server
					let app = resolve.app

					app.use(function (req, res) {
						res.send(req.stale);
					});
				}
				request(server)
				.get('/')
				.expect(200, 'true', done);
			})
			
		})
	})

	describe('.subdomains', async function () {
		describe('when present', async function () {
			it('should return an array', function (done) {
				appCreateFn().then((resolve, reject) => {
					if (resolve) {
						server_ = resolve.app
						server = resolve.server
						let app = resolve.app
	
						app.use(function (req, res) {
							res.send(req.subdomains);
						});
					}
					request(server)
					.get('/')
					.set('Host', 'tobi.ferrets.example.com')
					.expect(200, ['ferrets', 'tobi'], done);
				})

				

				
			})

			it('should work with IPv4 address', function (done) {
				appCreateFn().then((resolve, reject) => {
					if (resolve) {
						server_ = resolve.app
						server = resolve.server
						let app = resolve.app
	
						app.use(function (req, res) {
							res.send(req.subdomains);
						});
					}
					request(server)
					.get('/')
					.set('Host', '127.0.0.1')
					.expect(200, [], done);
				})

				
			})

			it('should work with IPv6 address', function (done) {
				appCreateFn().then((resolve, reject) => {
					if (resolve) {
						server_ = resolve.app
						server = resolve.server
						let app = resolve.app
	
						app.use(function (req, res) {
							res.send(req.subdomains);
						});
					}
					request(server)
					.get('/')
					.set('Host', '[::1]')
					.expect(200, [], done);
				})

				
			})
		})

		describe('otherwise', async function () {
			it('should return an empty array', function (done) {
				appCreateFn().then((resolve, reject) => {
					if (resolve) {
						server_ = resolve.app
						server = resolve.server
						let app = resolve.app
	
						app.use(function (req, res) {
							res.send(req.subdomains);
						});
					}
					request(server)
					.get('/')
					.set('Host', 'example.com')
					.expect(200, [], done);
				})

				
			})
		})

		describe('with no host', async function () {
			it('should return an empty array',  function (done) {
				appCreateFn().then((resolve, reject) => {
					if (resolve) {
						server_ = resolve.app
						server = resolve.server
						let app = resolve.app
	
						app.use(function (req, res) {
							res.send(req.subdomains);
						});
					}
					request(server)
					.get('/')
					.expect(200, [], done);
				})

				
			})
		})

		describe('with trusted X-Forwarded-Host', function () {
			it('should return an array',  function (done) {
				let options = {
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
						proxyTrust: true
					}
				}
				appCreateFn(options).then((resolve, reject) => {
					if (resolve) {
						server_ = resolve.app
						server = resolve.server
						let app = resolve.app
	
						app.use(function (req, res) {
							res.send(req.subdomains);
						});
					}
					request(server)
					.get('/')
					.set('X-Forwarded-Host', 'tobi.ferrets.example.com')
					.expect(200, ['ferrets', 'tobi'], done);
				})

				
			})
		})

		describe('when subdomain offset is set', async function () {
			describe('when subdomain offset is zero', async function () {
				it('should return an array with the whole domain', function (done) {
					let options = {
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
							proxyTrust: true,
							subdomainsOffset: 0
						}
					}
					appCreateFn(options).then((resolve, reject) => {
						if (resolve) {
							server_ = resolve.app
							server = resolve.server
							let app = resolve.app
		
							app.use(function (req, res) {
								res.send(req.subdomains);
							});
						}
						request(server)
						.get('/')
						.set('Host', 'tobi.ferrets.sub.example.com')
						.expect(200, ['com', 'example', 'sub', 'ferrets', 'tobi'], done);
					})

					
				})

				it('should return an array with the whole IPv4', function (done) {
					let options = {
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
							proxyTrust: true,
							subdomainsOffset: 0
						}
					}
					appCreateFn(options).then((resolve, reject) => {
						if (resolve) {
							server_ = resolve.app
							server = resolve.server
							let app = resolve.app
		
							app.use(function (req, res) {
								res.send(req.subdomains);
							});
						}
						request(server)
						.get('/')
						.set('Host', '127.0.0.1')
						.expect(200, ['127.0.0.1'], done);
					})

					
				})

				it('should return an array with the whole IPv6',  function (done) {
					let options = {
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
							proxyTrust: true,
							subdomainsOffset: 0
						}
					}
					appCreateFn(options).then((resolve, reject) => {
						if (resolve) {
							server_ = resolve.app
							server = resolve.server
							let app = resolve.app
		
							app.use(function (req, res) {
								res.send(req.subdomains);
							});
						}
						request(server)
						.get('/')
						.set('Host', '[::1]')
						.expect(200, ['[::1]'], done);
					})

					
				})
			})

			describe('when present', async function () {
				it('should return an array',  function (done) {
					let options = {
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
							proxyTrust: true,
							subdomainsOffset: 3
						}
					}
					appCreateFn(options).then((resolve, reject) => {
						if (resolve) {
							server_ = resolve.app
							server = resolve.server
							let app = resolve.app
		
							app.use(function (req, res) {
								res.send(req.subdomains);
							});
						}
						request(server)
						.get('/')
						.set('Host', 'tobi.ferrets.sub.example.com')
						.expect(200, ['ferrets', 'tobi'], done);
					})

					
				})
			})

			describe('otherwise', async function () {
				it('should return an empty array', function (done) {
					let options = {
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
							proxyTrust: true,
							subdomainsOffset: 3
						}
					}
					appCreateFn(options).then((resolve, reject) => {
						if (resolve) {
							server_ = resolve.app
							server = resolve.server
							let app = resolve.app
		
							app.use(function (req, res) {
								res.send(req.subdomains);
							});
						}
						request(server)
						.get('/')
						.set('Host', 'sub.example.com')
						.expect(200, [], done);
					})

					
				})
			})
		})
	})

	describe('.xhr', async function () {
		it('should return true when X-Requested-With is xmlhttprequest', function (done) {
			appCreateFn().then((resolve, reject) => {
				if (resolve) {
					server_ = resolve.app
					server = resolve.server
					let app = resolve.app

					app.use(function (req, res) {
						req.xhr.should.be.true()
						res.end();
					});
				}
				request(server)
				.get('/')
				.set('X-Requested-With', 'xmlhttprequest')
				.expect(200,done)
			})
			
		})

		it('should case-insensitive', function (done) {
			appCreateFn().then((resolve, reject) => {
				if (resolve) {
					server_ = resolve.app
					server = resolve.server
					let app = resolve.app

					app.use(function (req, res) {
						req.xhr.should.be.true()
						res.end();
					});
				}
				request(server)
				.get('/')
				.set('X-Requested-With', 'XMLHttpRequest')
				.expect(200, done)
			})

			
		})

		it('should return false otherwise', function (done) {
			appCreateFn().then((resolve, reject) => {
				if (resolve) {
					server_ = resolve.app
					server = resolve.server
					let app = resolve.app

					app.use(function (req, res) {
						req.xhr.should.be.false()
						res.end();
					});
				}
				request(server)
				.get('/')
				.set('X-Requested-With', 'blahblah')
				.expect(200,done)
			})

			
		})

		it('should return false when not present',  function (done) {
			appCreateFn().then((resolve, reject) => {
				if (resolve) {
					server_ = resolve.app
					server = resolve.server
					let app = resolve.app

					app.use(function (req, res) {
						res.send(req.xhr)
						//req.xhr.should.be.false()
						//res.end();
					});
				}
				request(server)
				.get('/')
				.expect(200)
				.then((response) => {
					expect(response.text).to.equal("false")
					done();
				})
			})

			
		})
	})
})


async function appCreateFn(options) {
	if (!options) {
		options = {
			res: {
				toUse: 'all',
				render: {
					views: process.env.VIEWS_LOCATION,
					renderExt: '.pug',
					renderEngine: 'pug',
					queryParser: 'simple',
					//renderFunction: "__express"
				}
			},
			req: {
				toUse: 'all'
			}
		}
	}
	var app_ = express();
	server = await app_.start(startPort)
	let restanaExpressCompatibilityMod = require(require('path').resolve(__dirname + '/../index.js'))
	let restanaExpressCompatibility = new restanaExpressCompatibilityMod(options)
	app_.use(restanaExpressCompatibility.middleware)
	app_.get('/query/', (req, res) => {
		res.send(req.query);
	})
	return { app: app_, server: server };
}



/**
 * Get the local client address depending on AF_NET of server
 */

function getExpectedClientAddress(server) {
	let data = server.address()
	return data.address === '::'
		? '::ffff:127.0.0.1'
		: '127.0.0.1';
}