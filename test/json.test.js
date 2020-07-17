'use strict'

/* global describe, it */
const path = require('path')
const request = require('supertest')
const expect = require('chai').expect



describe('Express.js res.json, format & status methods', () => {
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

	service.get('/json/', (req, res) => {
		res.status(222).send({ hello: 'world' })
	})

	service.get('/2/', (req, res) => {
		res.format({
			'text/plain': function () {
				res.send('hey')
			},

			'text/html': function () {
				res.send('<p>hey</p>')
			},

			'application/json': function () {
				res.send({ message: 'hey' })
			},

			default: function () {
				// log the request and respond with 406
				res.status(406).send('Not Acceptable')
			}
		})
	})




	it('should return 222 status on /json/', async () => {
		await request(server)
			.get('/json/')
			.expect(222)
			.then((response) => {
				expect(response.body.hello).to.equal("world")
			})
	})

	it('should return hey on /2/ (res.format)', async () => {
		await request(server)
			.get('/2/')
			.then((response) => {
				expect(response.text).to.equal("hey")
			})
	})

	it('should return {"message":"hey"} on /2/', async () => {
		await request(server)
			.get('/2/')
			.set('Accept', 'text/html; q=.5, application/json, */*; q=.1')
			.then((response) => {
				expect(response.body.message).to.equal("hey")
			})
	})


	it('406 not acceptable when res.format couldn\'t match', function (done) {
		request(server)
			.get('/2/')
			.set('Accept', 'boogie/woogie')
			.expect(406, done)
	})


	it('should successfully terminate the service', async () => {
		await service.close()
	})
	

})