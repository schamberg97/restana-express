'use strict'

/* global describe, it */
const path = require('path')

var request = require('supertest');
var after = require('after');
var assert = require('assert');
var Buffer = require('safe-buffer').Buffer


describe('Express.js res.clearCookie methods', () => {
	let server
	const app = require('restana')()
	it('should start the app', async () => {
		server = await app.start(~~process.env.PORT)
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
	app.use(restanaExpressCompatibility.middleware)

	describe('res', function () {
		describe('.clearCookie(name)', function () {
			it('should set a cookie passed expiry', function (done) {

				app.get('/clearCookie/1/', function (req, res) {
					res.clearCookie('sid').end();
				});

				request(server)
					.get('/clearCookie/1/')
					.expect('Set-Cookie', 'sid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT')
					.expect(200, done)
			})
		})

		describe('.clearCookie(name, options)', function () {
			it('should set the given params', function (done) {

				app.get('/clearCookie/2/', function (req, res) {
					res.clearCookie('sid', { path: '/admin' }).end();
				});

				request(server)
					.get('/clearCookie/2/')
					.expect('Set-Cookie', 'sid=; Path=/admin; Expires=Thu, 01 Jan 1970 00:00:00 GMT')
					.expect(200, done)
			})
		})
	})


	it('should successfully terminate the app', async () => {
		await app.close()
	})

})