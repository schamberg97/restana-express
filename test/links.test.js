'use strict'

/* global describe, it */
const path = require('path')
const request = require('supertest')
const expect = require('chai').expect



describe('Express.js res.links methods', () => {
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
	it('should set Link header field', function (done) {
		service.get('/links/', (req,res) => {
			res.links({
				next: 'http://api.example.com/users?page=2',
				last: 'http://api.example.com/users?page=5'
			});
			res.end();
		})
		request(server)
      		.get('/links/')
      		.expect('Link', '<http://api.example.com/users?page=2>; rel="next", <http://api.example.com/users?page=5>; rel="last"')
      		.expect(200, done);
	})

	it('should set Link header field for multiple calls', function (done) {
		service.use(function (req, res) {
			res.links({
			  next: 'http://api.example.com/users?page=2',
			  last: 'http://api.example.com/users?page=5'
			});
	
			res.links({
			  prev: 'http://api.example.com/users?page=1'
			});
	
			res.end();
		  });
	
		  request(server)
		  .get('/')
		  .expect('Link', '<http://api.example.com/users?page=2>; rel="next", <http://api.example.com/users?page=5>; rel="last", <http://api.example.com/users?page=1>; rel="prev"')
		  .expect(200, done);
	})


	it('should successfully terminate the service', async () => {
		await service.close()
	})

	

})