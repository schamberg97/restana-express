'use strict'

/* global describe, it */
const path = require('path')
const request = require('supertest')
const expect = require('chai').expect



describe('Express.js res.location methods', () => {
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

	describe('.location(url)', function(){
		it('should set the header', function(done){
		  
	
		  service.get('/1/', function(req, res){
			res.location('http://google.com').end();
		  });
	
		  request(server)
		  .get('/1/')
		  .expect('Location', 'http://google.com')
		  .expect(200, done)
		})
	
		it('should encode "url"', function (done) {
		  
		  service.get('/2/', function(req, res){
			res.location('https://google.com?q=\u2603 §10').end()
		  })
	
		  request(server)
		  .get('/2/')
		  .expect('Location', 'https://google.com?q=%E2%98%83%20%C2%A710')
		  .expect(200, done)
		})
	
		it('should not touch already-encoded sequences in "url"', function (done) {
		  
	
		  service.get('/3/', function(req, res){
			res.location('https://google.com?q=%A710').end()
		  })
	
		  request(server)
		  .get('/3/')
		  .expect('Location', 'https://google.com?q=%A710')
		  .expect(200, done)
		})
	
		describe('when url is "back"', function () {
		  it('should set location from "Referer" header', function (done) {
			
	
			service.get('/4/', function(req, res){
			  res.location('back').end()
			})
	
			request(server)
			.get('/4/')
			.set('Referer', '/some/page.html')
			.expect('Location', '/some/page.html')
			.expect(200, done)
		  })
	
		  it('should set location from "Referrer" header', function (done) {
			
	
			service.get('/5/', function(req, res){
			  res.location('back').end()
			})
	
			request(server)
			.get('/5/')
			.set('Referrer', '/some/page.html')
			.expect('Location', '/some/page.html')
			.expect(200, done)
		  })
	
		  it('should prefer "Referrer" header', function (done) {
			
	
			service.get('/6/', function(req, res){
			  res.location('back').end()
			})
	
			request(server)
			.get('/6/')
			.set('Referer', '/some/page1.html')
			.set('Referrer', '/some/page2.html')
			.expect('Location', '/some/page2.html')
			.expect(200, done)
		  })
	
		  it('should set the header to "/" without referrer', function (done) {
			
	
			service.get('/7/', function(req, res){
			  res.location('back').end()
			})
	
			request(server)
			.get('/7/')
			.expect('Location', '/')
			.expect(200, done)
		  })
		})
	  })


	it('should successfully terminate the service', async () => {
		await service.close()
	})

	

})