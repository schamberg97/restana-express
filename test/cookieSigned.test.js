'use strict'

/* global describe, it */
const path = require('path')
const request = require('supertest')
const expect = require('chai').expect
var cookieParser = require('cookie-parser')
var cookie = require('cookie')



describe('Signed cookie', () => {
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

	service.use('/cookie/signed/fail/*', restanaExpressCompatibility.middleware)
	
	service.use('/cookie/signed/success/*', restanaExpressCompatibility.middleware)
	service.use('/cookie/signed/success/*', cookieParser('foo bar baz'))

	service.get('/cookie/signed/success/1', (req, res) => {
		res.cookie('user', { name: 'tobi' }, { signed: true }).end();
	})
	service.get('/cookie/signed/success/2', (req, res) => {
		res.cookie('name', 'tobi', { signed: true }).end();
	})

	service.get('/cookie/signed/fail/1', function (req, res) {
		res.cookie('name', 'tobi', { signed: true }).end();
	});

	describe('signed', function () {
		it('should generate a signed JSON cookie', function (done) {
			request(server)
				.get('/cookie/signed/success/1')
				.end(function (err, res) {
					var val = res.headers['set-cookie'][0];
					val = cookie.parse(val.split('.')[0]);
					expect(val.user).to.equal('s:j:{"name":"tobi"}');
					done();
				})
		})
	})
	describe('signed without secret', function () {
		it('should throw an error', function (done) {

			request(server)
				.get('/cookie/signed/fail/1')
				.expect(500, /secret\S+ required for signed cookies/, done);
		})
	})

	describe('.signedCookie(name, string)', function(){
		it('should set a signed cookie', function(done){
  
		  request(server)
		  .get('/cookie/signed/success/2')
		  .expect('Set-Cookie', 'name=s%3Atobi.xJjV2iZ6EI7C8E5kzwbfA9PVLl1ZR07UTnuTgQQ4EnQ; Path=/')
		  .expect(200, (err) => {
				server.close()
				done(err)
		   })
		})
	})
	

})