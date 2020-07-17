'use strict'

/* global describe, it */
const path = require('path')
const request = require('supertest')
const expect = require('chai').expect



describe('Express.js res.json and res.status enabled and nothing more', () => {
	let server
	const service = require('restana')()
	it('should start the service', async () => {
		server = await service.start(~~process.env.PORT)
	})



	let compatibilityLayerPath = path.resolve('./index.js')
	let restanaExpressCompatibilityMod = require(compatibilityLayerPath)
	let restanaExpressCompatibility = new restanaExpressCompatibilityMod({
		res: {
			toUse: ['json', 'status'],
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

	service.get('/resFormat/', (req, res) => {
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

	it('should fail on resFormat', async () => {
		await request(server)
			.get('/resFormat/')
			.then((response) => {
				expect(response.text).to.equal("hey")
			})
	})

	it('should successfully terminate the service', async () => {
		await service.close()
	})
	

})