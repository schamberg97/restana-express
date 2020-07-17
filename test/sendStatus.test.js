'use strict'

/* global describe, it */
const path = require('path')
const request = require('supertest')
const expect = require('chai').expect
var cookieParser = require('cookie-parser')
var cookie = require('cookie')



describe('res.sendStatus', () => {
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
	
	service.get('/201/', (req,res) => {
		res.sendStatus(201)
	})

	service.get('/599/', (req,res) => {
		res.sendStatus(599)
	})

	it('should send the status code and message as body', function (done) {
  
		request(server)
		.get('/201/')
		.expect(201, 'Created', done);
	  })
  
	  it('should work with unknown code', function (done) {
  
		request(server)
		.get('/599/')
		.expect(599, '599', done);
	  })

	it('should successfully terminate the service', async () => {
		await service.close()
	})
	

})