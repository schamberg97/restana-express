
var after = require('after');
var path = require('path')

var express = require('restana')
	, request = require('supertest')
	, assert = require('assert');
var onFinished = require('on-finished');
const { expect } = require('chai');


let startPort = parseInt(process.env.PORT)
var server_
let shallUnref = false

describe('req properties', async function () {
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

	describe('.fresh', async function () {
		it('should return true when the resource is not modified', async function () {
			let appCreate = await appCreateFn();
			server_ = appCreate.app
			let app = appCreate.app
			var etag = '"12345"';

			app.use(function (req, res) {
				res.set('ETag', etag);
				res.send(req.fresh);
			});

			request(appCreate.server)
				.get('/')
				.set('If-None-Match', etag)
				.expect(304);
		})

		it('should return false when the resource is modified', async function () {
			let appCreate = await appCreateFn();
			server_ = appCreate.app
			let app = appCreate.app

			app.use(function (req, res) {
				res.set('ETag', '"123"');
				res.send(req.fresh);
			});

			request(appCreate.server)
				.get('/')
				.set('If-None-Match', '"12345"')
				.expect(200, 'false');
		})

		it('should return false without response headers', async function () {
			let appCreate = await appCreateFn();
			server_ = appCreate.app
			let app = appCreate.app

			app.use(function (req, res) {
				res.send(req.fresh);
			});

			request(appCreate.server)
				.get('/')
				.expect(200, 'false');
		})
	})

	describe('.hostname', async function () {
		it('should return the Host when present', async function () {
			let appCreate = await appCreateFn();
			server_ = appCreate.app
			let app = appCreate.app

			app.use(function (req, res) {
				res.end(req.hostname);
			});

			request(appCreate.server)
				.post('/')
				.set('Host', 'example.com')
				.expect('example.com');
		})

		it('should strip port number', async function () {
			let appCreate = await appCreateFn();
			server_ = appCreate.app
			let app = appCreate.app

			app.use(function (req, res) {
				res.end(req.hostname);
			});

			request(appCreate.server)
				.post('/')
				.set('Host', 'example.com:3000')
				.expect('example.com');
		})

		it('should return undefined otherwise', async function () {
			let appCreate = await appCreateFn();
			server_ = appCreate.app
			let app = appCreate.app

			app.use(function (req, res) {
				req.headers.host = null;
				res.end(String(req.hostname));
			});

			request(appCreate.server)
				.post('/')
				.expect('undefined');
		})

		it('should work with IPv6 Host', async function () {
			let appCreate = await appCreateFn();
			server_ = appCreate.app
			let app = appCreate.app

			app.use(function (req, res) {
				res.end(req.hostname);
			});

			request(appCreate.server)
				.post('/')
				.set('Host', '[::1]')
				.expect('[::1]');
		})

		it('should work with IPv6 Host and port', async function () {
			let appCreate = await appCreateFn();
			server_ = appCreate.app
			let app = appCreate.app

			app.use(function (req, res) {
				res.end(req.hostname);
			});

			request(appCreate.server)
				.post('/')
				.set('Host', '[::1]:3000')
				.expect('[::1]');
		})

		describe('when "trust proxy" is enabled', async function () {
			it('should respect X-Forwarded-Host', async function () {

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
				let appCreate = await appCreateFn(options);
				server_ = appCreate.app
				let app = appCreate.app



				app.use(function (req, res) {
					res.end(req.hostname);
				});

				request(appCreate.server)
					.get('/')
					.set('Host', 'localhost')
					.set('X-Forwarded-Host', 'example.com:3000')
					.expect('example.com');
			})

			it('should ignore X-Forwarded-Host if socket addr not trusted', async function () {


				let options = {
					res: {
						toUse: 'all'
					},
					req: {
						toUse: 'all',
						proxy: true,
						proxyTrust: '10.0.0.1'
					}
				}

				let appCreate = await appCreateFn(options);
				server_ = appCreate.app
				let app = appCreate.app

				app.use(function (req, res) {
					res.end(req.hostname);
				});

				request(appCreate.server)
					.get('/')
					.set('Host', 'localhost')
					.set('X-Forwarded-Host', 'example.com')
					.expect('localhost');
			})

			it('should default to Host', async function () {
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
				let appCreate = await appCreateFn(options);
				server_ = appCreate.app
				let app = appCreate.app

				app.use(function (req, res) {
					res.end(req.hostname);
				});

				request(appCreate.server)
					.get('/')
					.set('Host', 'example.com')
					.expect('example.com');
			})

			describe('when multiple X-Forwarded-Host', async function () {
				it('should use the first value', async function () {

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
					let appCreate = await appCreateFn(options);
					server_ = appCreate.app
					let app = appCreate.app

					app.use(function (req, res) {
						res.send(req.hostname)
					})

					request(appCreate.server)
						.get('/')
						.set('Host', 'localhost')
						.set('X-Forwarded-Host', 'example.com, foobar.com')
						.expect(200, 'example.com')
				})

				it('should remove OWS around comma', async function () {
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
					let appCreate = await appCreateFn(options);
					server_ = appCreate.app
					let app = appCreate.app

					app.use(function (req, res) {
						res.send(req.hostname)
					})

					request(appCreate.server)
						.get('/')
						.set('Host', 'localhost')
						.set('X-Forwarded-Host', 'example.com , foobar.com')
						.expect(200, 'example.com')
				})

				it('should strip port number', async function () {
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
					let appCreate = await appCreateFn(options);
					server_ = appCreate.app
					let app = appCreate.app

					app.use(function (req, res) {
						res.send(req.hostname)
					})

					request(appCreate.server)
						.get('/')
						.set('Host', 'localhost')
						.set('X-Forwarded-Host', 'example.com:8080 , foobar.com:8888')
						.expect(200, 'example.com')
				})
			})
		})

		describe('when "trust proxy" is disabled', async function () {
			it('should ignore X-Forwarded-Host', async function () {
				let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app

				app.use(function (req, res) {
					res.end(req.hostname);
				});

				request(appCreate.server)
					.get('/')
					.set('Host', 'localhost')
					.set('X-Forwarded-Host', 'evil')
					.expect('localhost');
			})
		})
	})
	describe('.ip', async function () {
		describe('when X-Forwarded-For is present', async function () {
			describe('when "trust proxy" is enabled', async function () {
				it('should return the client addr', async function () {

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

					let appCreate = await appCreateFn(options);
					server_ = appCreate.app
					let app = appCreate.app



					app.use(function (req, res, next) {
						res.send(req.ip);
					});

					request(appCreate.server)
						.get('/')
						.set('X-Forwarded-For', 'client, p1, p2')
						.expect('client');
				})

				it('should return the addr after trusted proxy', async function () {
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
					let appCreate = await appCreateFn(options);
					server_ = appCreate.app
					let app = appCreate.app



					app.use(function (req, res, next) {
						res.send(req.ip);
					});

					request(appCreate.server)
						.get('/')
						.set('X-Forwarded-For', 'client, p1, p2')
						.expect('p1');
				})

			})

			describe('when "trust proxy" is disabled', async function () {
				it('should return the remote address', async function () {
					let appCreate = await appCreateFn();
					server_ = appCreate.app
					let app = appCreate.app

					app.use(function (req, res, next) {
						res.send(req.ip);
					});

					var test = request(appCreate.server).get('/')
					test.set('X-Forwarded-For', 'client, p1, p2')
					test.expect(200).then(async (response) => {
						expect(getExpectedClientAddress(response.text))
					})
				})
			})
		})

		describe('when X-Forwarded-For is not present', async function () {
			it('should return the remote address', async function () {
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
				let appCreate = await appCreateFn(options);
				server_ = appCreate.app
				let app = appCreate.app



				app.use(function (req, res, next) {
					res.send(req.ip);
				});

				var test = request(appCreate.server).get('/')
				test.expect(200).then(async (response) => {
					expect(getExpectedClientAddress(response.text))
				})
			})
		})
	})

	describe('.ips', async function () {
		describe('when X-Forwarded-For is present', async function () {
			describe('when "trust proxy" is enabled', async function () {
				it('should return an array of the specified addresses', async function () {
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
					let appCreate = await appCreateFn(options);
					server_ = appCreate.app
					let app = appCreate.app

					app.use(function (req, res, next) {
						res.send(req.ips);
					});

					request(appCreate.server)
						.get('/')
						.set('X-Forwarded-For', 'client, p1, p2')
						.expect('["client","p1","p2"]');
				})

				it('should stop at first untrusted', async function () {
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
					let appCreate = await appCreateFn(options);
					server_ = appCreate.app
					let app = appCreate.app



					app.use(function (req, res, next) {
						res.send(req.ips);
					});

					request(appCreate.server)
						.get('/')
						.set('X-Forwarded-For', 'client, p1, p2')
						.expect('["p1","p2"]');
				})
			})

			describe('when "trust proxy" is disabled', async function () {
				it('should return an empty array', async function () {
					let appCreate = await appCreateFn();
					server_ = appCreate.app
					let app = appCreate.app

					app.use(function (req, res, next) {
						res.send(req.ips);
					});

					request(appCreate.server)
						.get('/')
						.set('X-Forwarded-For', 'client, p1, p2')
						.expect('[]');
				})
			})
		})

		describe('when X-Forwarded-For is not present', async function () {
			it('should return []', async function () {
				let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app

				app.use(function (req, res, next) {
					res.send(req.ips);
				});

				request(appCreate.server)
					.get('/')
					.expect('[]');
			})
		})
	})

	describe('.protocol', async function () {
		it('should return the protocol string', async function () {
			let appCreate = await appCreateFn();
			server_ = appCreate.app
			let app = appCreate.app

			app.use(function (req, res) {
				res.end(req.protocol);
			});

			request(appCreate.server)
				.get('/')
				.expect('http');
		})

		describe('when "trust proxy" is enabled', async function () {
			it('should respect X-Forwarded-Proto', async function () {
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
				let appCreate = await appCreateFn(options);
				server_ = appCreate.app
				let app = appCreate.app


				app.use(function (req, res) {
					res.end(req.protocol);
				});

				request(appCreate.server)
					.get('/')
					.set('X-Forwarded-Proto', 'https')
					.expect('https');
			})

			it('should default to the socket addr if X-Forwarded-Proto not present', async function () {
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
				let appCreate = await appCreateFn(options);
				server_ = appCreate.app
				let app = appCreate.app



				app.use(function (req, res) {
					req.connection.encrypted = true;
					res.end(req.protocol);
				});

				request(appCreate.server)
					.get('/')
					.expect('https');
			})

			it('should ignore X-Forwarded-Proto if socket addr not trusted', async function () {
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
				let appCreate = await appCreateFn(options);
				server_ = appCreate.app
				let app = appCreate.app

				app.use(function (req, res) {
					res.end(req.protocol);
				});

				request(appCreate.server)
					.get('/')
					.set('X-Forwarded-Proto', 'https')
					.expect('http');
			})

			it('should default to http', async function () {
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
				let appCreate = await appCreateFn(options);
				server_ = appCreate.app
				let app = appCreate.app

				app.use(function (req, res) {
					res.end(req.protocol);
				});

				request(appCreate.server)
					.get('/')
					.expect('http');
			})

			describe('when trusting hop count', async function () {
				it('should respect X-Forwarded-Proto', async function () {
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
					let appCreate = await appCreateFn(options);
					server_ = appCreate.app
					let app = appCreate.app

					app.use(function (req, res) {
						res.end(req.protocol);
					});

					request(appCreate.server)
						.get('/')
						.set('X-Forwarded-Proto', 'https')
						.expect('https');
				})
			})
		})

		describe('when "trust proxy" is disabled', async function () {
			it('should ignore X-Forwarded-Proto', async function () {
				let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app

				app.use(function (req, res) {
					res.end(req.protocol);
				});

				request(appCreate.server)
					.get('/')
					.set('X-Forwarded-Proto', 'https')
					.expect('http');
			})
		})
	})

	describe('.query', async function () {
		it('should default to {}', async function () {
			let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app
			
			request(appCreate.server)
				.get('/query/')
				.expect(200, '{}');
		});

		it('should default to parse complex keys', async function () {
			let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app

			request(appCreate.server)
				.get('/query/?user[name]=tj')
				.expect(200, '{"user":{"name":"tj"}}');
		});

		describe('when "query parser" is extended', async function () {
			it('should parse complex keys', async function () {
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
				let appCreate = await appCreateFn(options);
				server_ = appCreate.app
				let app = appCreate.app

				request(appCreate.server)
					.get('/query/?foo[0][bar]=baz&foo[0][fizz]=buzz&foo[]=done!')
					.expect(200, '{"foo":[{"bar":"baz","fizz":"buzz"},"done!"]}');
			});

			it('should parse parameters with dots', async function () {
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
				let appCreate = await appCreateFn(options);
				server_ = appCreate.app
				let app = appCreate.app

				request(appCreate.server)
					.get('/query/?user.name=tj')
					.expect(200, '{"user.name":"tj"}');
			});
		});

		describe('when "query parser" is simple', async function () {
			it('should not parse complex keys', async function () {
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
				let appCreate = await appCreateFn(options);
				server_ = appCreate.app
				let app = appCreate.app
				

				request(appCreate.server)
					.get('/query/?user%5Bname%5D=tj')
					.expect(200, '{"user[name]":"tj"}');
			});
		});

		describe('when "query parser" is a function', async function () {
			it('should parse using function', async function () {
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
				let appCreate = await appCreateFn(options);
				server_ = appCreate.app
				let app = appCreate.app

				request(appCreate.server)
					.get('/query/?user%5Bname%5D=tj')
					.expect(200, '{"length":17}');
			});
		});

		describe('when "query parser" disabled', async function () {
			it('should not parse query', async function () {
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
				let appCreate = await appCreateFn(options);
				server_ = appCreate.app
				let app = appCreate.app


				request(appCreate.server)
					.get('/query/?user%5Bname%5D=tj')
					.expect(200, '{}');
			});
		});

		describe('when "query parser" enabled', async function () {
			it('should not parse complex keys', async function () {
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
				let appCreate = await appCreateFn(options);
				server_ = appCreate.app
				let app = appCreate.app


				request(appCreate.server)
					.get('/query/?user%5Bname%5D=tj')
					.expect(200, '{"user[name]":"tj"}');
			});
		});

		describe('when "query parser fn" is missing', async function () {
			it('should act like "extended"', async function () {
				let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app

				app.use(function (req, res) {
					res.send(req.query);
				});

				request(appCreate.server)
					.get('/query/?user[name]=tj&user.name=tj')
					.expect(200, '{"user":{"name":"tj"},"user.name":"tj"}');
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
	describe('.secure', async function(){
		describe('when X-Forwarded-Proto is missing', async function(){
		  it('should return false when http', async function(){
			let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app
	
			app.get('/', async function(req, res){
			  res.send(req.secure ? 'yes' : 'no');
			});
	
			request(appCreate.server)
			.get('/')
			.expect('no')
		  })
		})
	  })
	
	  describe('.secure', async function(){
		describe('when X-Forwarded-Proto is present', async function(){
		  it('should return false when http', async function(){
			let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app
	
			app.get('/', async function(req, res){
			  res.send(req.secure ? 'yes' : 'no');
			});
	
			request(appCreate.server)
			.get('/')
			.set('X-Forwarded-Proto', 'https')
			.expect('no')
		  })
	
		  it('should return true when "trust proxy" is enabled', async function(){
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
			let appCreate = await appCreateFn(options);
				server_ = appCreate.app
				let app = appCreate.app
	
	
			app.get('/', async function(req, res){
			  res.send(req.secure ? 'yes' : 'no');
			});
	
			request(appCreate.server)
			.get('/')
			.set('X-Forwarded-Proto', 'https')
			.expect('yes')
		  })
	
		  it('should return false when initial proxy is http', async function(){
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
			let appCreate = await appCreateFn(options);
				server_ = appCreate.app
				let app = appCreate.app
		
			app.get('/', async function(req, res){
			  res.send(req.secure ? 'yes' : 'no');
			});
	
			request(appCreate.server)
			.get('/')
			.set('X-Forwarded-Proto', 'http, https')
			.expect('no')
		  })
	
		  it('should return true when initial proxy is https', async function(){
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
			let appCreate = await appCreateFn(options);
				server_ = appCreate.app
				let app = appCreate.app
	
	
			app.get('/', async function(req, res){
			  res.send(req.secure ? 'yes' : 'no');
			});
	
			request(appCreate.server)
			.get('/')
			.set('X-Forwarded-Proto', 'https, http')
			.expect('yes')
		  })
	
		  describe('when "trust proxy" trusting hop count', async function () {
			it('should respect X-Forwarded-Proto', async function () {
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
				let appCreate = await appCreateFn(options);
				server_ = appCreate.app
				let app = appCreate.app
	
			 
	
			  app.get('/', async function (req, res) {
				res.send(req.secure ? 'yes' : 'no');
			  });
	
			  request(appCreate.server)
			  .get('/')
			  .set('X-Forwarded-Proto', 'https')
			  .expect('yes')
			})
		  })
		})
	  })
	  describe('.stale', async function(){
		it('should return false when the resource is not modified', async function(){
		  let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app
		  var etag = '"12345"';
	
		  app.use(function(req, res){
			res.set('ETag', etag);
			res.send(req.stale);
		  });
	
		  request(appCreate.server)
		  .get('/')
		  .set('If-None-Match', etag)
		  .expect(304);
		})
	
		it('should return true when the resource is modified', async function(){
		  let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app
	
		  app.use(function(req, res){
			res.set('ETag', '"123"');
			res.send(req.stale);
		  });
	
		  request(appCreate.server)
		  .get('/')
		  .set('If-None-Match', '"12345"')
		  .expect(200, 'true');
		})
	
		it('should return true without response headers', async function(){
		  let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app
	
		  app.use(function(req, res){
			res.send(req.stale);
		  });
	
		  request(appCreate.server)
		  .get('/')
		  .expect(200, 'true');
		})
	  })

	  describe('.subdomains', async function(){
		describe('when present', async function(){
		  it('should return an array', async function(){
			let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app
	
			app.use(function(req, res){
			  res.send(req.subdomains);
			});
	
			request(appCreate.server)
			.get('/')
			.set('Host', 'tobi.ferrets.example.com')
			.expect(200, ['ferrets', 'tobi']);
		  })
	
		  it('should work with IPv4 address', async function(){
			let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app
	
			app.use(function(req, res){
			  res.send(req.subdomains);
			});
	
			request(appCreate.server)
			.get('/')
			.set('Host', '127.0.0.1')
			.expect(200, []);
		  })
	
		  it('should work with IPv6 address', async function(){
			let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app
	
			app.use(function(req, res){
			  res.send(req.subdomains);
			});
	
			request(appCreate.server)
			.get('/')
			.set('Host', '[::1]')
			.expect(200, []);
		  })
		})
	
		describe('otherwise', async function(){
		  it('should return an empty array', async function(){
			let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app
	
			app.use(function(req, res){
			  res.send(req.subdomains);
			});
	
			request(appCreate.server)
			.get('/')
			.set('Host', 'example.com')
			.expect(200, []);
		  })
		})
	
		describe('with no host', async function(){
		  it('should return an empty array', async function(){
			let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app
	
			app.use(function(req, res){
			  req.headers.host = null;
			  res.send(req.subdomains);
			});
	
			request(appCreate.server)
			.get('/')
			.expect(200, []);
		  })
		})
	
		describe('with trusted X-Forwarded-Host', function () {
		  it('should return an array', async function() {
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
			let appCreate = await appCreateFn(options);
				server_ = appCreate.app
				let app = appCreate.app
			
				app.use(function (req, res) {
			  res.send(req.subdomains);
			});
	
			request(appCreate.server)
			.get('/')
			.set('X-Forwarded-Host', 'tobi.ferrets.example.com')
			.expect(200, ['ferrets', 'tobi']);
		  })
		})
	
		describe('when subdomain offset is set', async function(){
		  describe('when subdomain offset is zero', async function(){
			it('should return an array with the whole domain', async function(){
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
				let appCreate = await appCreateFn(options);
				server_ = appCreate.app
				let app = appCreate.app
	
			  app.use(function(req, res){
				res.send(req.subdomains);
			  });
	
			  request(appCreate.server)
			  .get('/')
			  .set('Host', 'tobi.ferrets.sub.example.com')
			  .expect(200, ['com', 'example', 'sub', 'ferrets', 'tobi']);
			})
	
			it('should return an array with the whole IPv4', async function() {
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
				let appCreate = await appCreateFn(options);
				server_ = appCreate.app
				let app = appCreate.app
	
			  app.use(function(req, res){
				res.send(req.subdomains);
			  });
	
			  request(appCreate.server)
			  .get('/')
			  .set('Host', '127.0.0.1')
			  .expect(200, ['127.0.0.1']);
			})
	
			it('should return an array with the whole IPv6', async function() {
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
				let appCreate = await appCreateFn(options);
				server_ = appCreate.app
				let app = appCreate.app
	
			  app.use(function(req, res){
				res.send(req.subdomains);
			  });
	
			  request(appCreate.server)
			  .get('/')
			  .set('Host', '[::1]')
			  .expect(200, ['[::1]']);
			})
		  })
	
		  describe('when present', async function(){
			it('should return an array', async function(){
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
			  let appCreate = await appCreateFn(options);
				server_ = appCreate.app
				let app = appCreate.app
	
			  app.use(function(req, res){
				res.send(req.subdomains);
			  });
	
			  request(appCreate.server)
			  .get('/')
			  .set('Host', 'tobi.ferrets.sub.example.com')
			  .expect(200, ['ferrets', 'tobi']);
			})
		  })
	
		  describe('otherwise', async function(){
			it('should return an empty array', async function(){
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
			  let appCreate = await appCreateFn(options);
				server_ = appCreate.app
				let app = appCreate.app
	
			  app.use(function(req, res){
				res.send(req.subdomains);
			  });
	
			  request(appCreate.server)
			  .get('/')
			  .set('Host', 'sub.example.com')
			  .expect(200, []);
			})
		  })
		})
	  })

	  describe('.xhr', async function(){
		it('should return true when X-Requested-With is xmlhttprequest', async function(){
		  let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app
	
		  app.use(function(req, res){
			req.xhr.should.be.true()
			res.end();
		  });
	
		  request(appCreate.server)
		  .get('/')
		  .set('X-Requested-With', 'xmlhttprequest')
		  .expect(200)
		})
	
		it('should case-insensitive', async function(){
		  let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app
	
		  app.use(function(req, res){
			req.xhr.should.be.true()
			res.end();
		  });
	
		  request(appCreate.server)
		  .get('/')
		  .set('X-Requested-With', 'XMLHttpRequest')
		  .expect(200)
		})
	
		it('should return false otherwise', async function(){
		  let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app
	
		  app.use(function(req, res){
			req.xhr.should.be.false()
			res.end();
		  });
	
		  request(appCreate.server)
		  .get('/')
		  .set('X-Requested-With', 'blahblah')
		  .expect(200)
		})
	
		it('should return false when not present', async function(){
		  let appCreate = await appCreateFn();
				server_ = appCreate.app
				let app = appCreate.app
	
		  app.use(function(req, res){
			req.xhr.should.be.false()
			res.end();
		  });
	
		  request(appCreate.server)
		  .get('/')
		  .expect(200)
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
	let server = await app_.start(startPort)
	let restanaExpressCompatibilityMod = require(require('path').resolve(__dirname + '/../index.js'))
	let restanaExpressCompatibility = new restanaExpressCompatibilityMod(options)
	app_.use(restanaExpressCompatibility.middleware)
	app_.get('/query/', (req,res) => {
		res.send(req.query);
	})
	return { app: app_, server: server };
}



/**
 * Get the local client address depending on AF_NET of server
 */

function getExpectedClientAddress(server) {
	return server.address().address === '::'
		? '::ffff:127.0.0.1'
		: '127.0.0.1';
}