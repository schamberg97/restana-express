'use strict'

/* global describe, it */
const path = require('path')
const request = require('supertest')
const expect = require('chai').expect



describe('Express res.get', () => {
	let server
	const service = require('restana')()
	

	

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
	

	describe('.get(field)', function(){
		it('should start the service', async () => {
			server = await service.start(~~process.env.PORT)
		})
		it('should get the response header field', function (done) {
	
		  service.use(function (req, res) {
			res.setHeader('Content-Type', 'text/x-foo');
			res.send(res.get('Content-Type'));
		  });
	
		  request(server)
		  .get('/')
		  .expect(200, 'text/x-foo', done);
		})
		it('should successfully terminate the service', async () => {
			await service.close()
		})
	  })

	

	

})