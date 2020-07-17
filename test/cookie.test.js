'use strict'

/* global describe, it */
const path = require('path')
const request = require('supertest')
const expect = require('chai').expect
var merge = require('utils-merge');




describe('Express.js cookie methods', () => {
	let server
	const service = require('restana')()
	it('should start the service', async () => {
		server = await service.start(~~process.env.PORT)
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
	service.use(restanaExpressCompatibility.middleware)

	describe('.cookie(name, object)', function () {
		it('should generate a JSON cookie', function (done) {


			service.get('/cookie/json/', function (req, res) {
				res.cookie('user', { name: 'tobi' }).end();
			});

			request(server)
				.get('/cookie/json/')
				.expect('Set-Cookie', 'user=j%3A%7B%22name%22%3A%22tobi%22%7D; Path=/')
				.expect(200, done)
		})
	})

	describe('.cookie(name, string)', function () {
		it('should set a cookie', function (done) {
			service.get('/cookie/', function (req, res) {
				res.cookie('name', 'tobi').end();
			});

			request(server)

				.get('/cookie/')
				.expect('Set-Cookie', 'name=tobi; Path=/')
				.expect(200, done)
		})

		it('should allow multiple calls', function (done) {

			service.get('/cookies/multiple', function (req, res) {
				res.cookie('name', 'tobi');
				res.cookie('age', 1);
				res.cookie('gender', '?');
				res.end();
			});
			request(server)
				.get('/cookies/multiple')
				.end(function (err, res) {
					var val = ['name=tobi; Path=/', 'age=1; Path=/', 'gender=%3F; Path=/'];
					expect(res.headers['set-cookie'].join(' ')).to.equal(val.join(' '))
					done();
				})
		})
	})

	describe('.cookie(name, string, options)', function(){
		it('should set params', function(done){
		  
	
		  service.get('/cookie/withOptions', function(req, res){
			res.cookie('name', 'tobi', { httpOnly: true, secure: true });
			res.end();
		  });
	
		  request(server)
		  .get('/cookie/withOptions')
		  .expect('Set-Cookie', 'name=tobi; Path=/; HttpOnly; Secure')
		  .expect(200, done)
		})
	
		describe('maxAge', function(){
		  it('should set relative expires', function(done){
			
	
			service.get('/cookie/maxAge/1/', function(req, res){
			  res.cookie('name', 'tobi', { maxAge: 1000 });
			  res.end();
			});
	
			request(server)
			.get('/cookie/maxAge/1/')
			.end(function(err, res){
				expect(res.headers['set-cookie'][0]).to.not.contain('Thu, 01 Jan 1970 00:00:01 GMT')
			  done();
			})
		  })
	
		  it('should set max-age', function(done){
			
	
			service.get('/cookie/maxAge/2/', function(req, res){
			  res.cookie('name', 'tobi', { maxAge: 1000 });
			  res.end();
			});
	
			request(server)
			.get('/cookie/maxAge/2/')
			.expect('Set-Cookie', /Max-Age=1/, done)
		  })
	
		  it('should not mutate the options object', function(done){
			
	
			var options = { maxAge: 1000 };
			var optionsCopy = merge({}, options);
	
			service.get('/cookie/notMutate/', function(req, res){
			  res.cookie('name', 'tobi', options)
			  res.json(options)
			});
	
			request(server)
			.get('/cookie/notMutate/')
			.expect(200, optionsCopy, (err) => {
				server.close()
				done(err)
			})
			
		  })
		})
	
	
	})

	it('should successfully terminate the service', async () => {
		await service.close()
	})



})