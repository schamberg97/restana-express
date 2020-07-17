'use strict'

/* global describe, it */
var path = require('path')
const request = require('supertest')
const expect = require('chai').expect

var viewsDir = path.resolve("./test/views/")
let rECMSettings = {
	res: {
		toUse: 'all',
		render: {
			viewsDir: viewsDir,
			renderExt: '.pug',
			renderEngine: 'pug',
			renderFunction: "__express"
		}
	},
	req: {
		toUse: 'all',
		proxy: true,
		proxyTrust: 'all'
	}
}

let compatibilityLayerPath = path.resolve('./index.js')
let restanaExpressCompatibilityMod = require(compatibilityLayerPath)


describe('Express.js res.render copy - normal setup', () => {
	let server
	let service = require('restana')()
	it('should start the service', async () => {
		server = await service.start(~~process.env.PORT)
	})

	
	let restanaExpressCompatibility = new restanaExpressCompatibilityMod(rECMSettings)
	service.use(restanaExpressCompatibility.middleware)

	service.get('/render/:name/', (req, res) => {
		res.locals.name = req.params.name
		res.render("index")
	})

	service.get('/render-error/:name/', (req, res) => {
		res.locals.name = req.params.name
		res.render("no-such-page")
	})

	service.get('/render-error-500/', (req, res) => {
		res.render("error-500")
	})

	it('should render a page, taking req.params and res.locals into account', async () => {
		await request(server)
			.get('/render/William/')
			.expect(200)
			.then((response) => {
				expect(response.text).to.equal("<p>William's Pug source code!</p>")
			})
	})

	it('should fail to render a page, because it doesn\'t exist and return 404', async () => {
		await request(server)
			.get('/render-error/Mike/')
			.expect(404)
	})

	it('should fail to render a page and give error 500', async () => {
		await request(server)
			.get('/render-error-500/')
			.expect(500)
	})


	it('should successfully terminate the service', async () => {
		await service.close()
	})
	it('should create a new server, then fail rendering due to not providing views directory, then close the server', async () => {
		let service = require('restana')()
		let server = await service.start(~~process.env.PORT)

		let rECMSettings2 = Object.assign({}, rECMSettings)
		delete rECMSettings2.res.render.viewsDir
		let restanaExpressCompatibility = new restanaExpressCompatibilityMod(rECMSettings2)
		service.use(restanaExpressCompatibility.middleware)

		service.get('/render/:name/', (req, res) => {
			res.locals.name = req.params.name
			res.render("index")
		})

		await request(server)
			.get('/render/James/')
			.expect(500)
			.then(async (response) => {
				expect(response.body.message).to.equal("Could not render index, because res.render is not configured correctly in restana-express middleware")
				await service.close()
			})
		
	})

})