'use strict'

/* global describe, it */
const path = require('path')

var Buffer = require('safe-buffer').Buffer
const request = require('supertest')
const should = require('should')
const expect = require('chai').expect



describe('Express.js res.attachment methods', () => {
	describe('res', function () {
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

		describe('.attachment()', function () {
			it('should Content-Disposition to attachment', function (done) {


				app.get('/1/', function (req, res) {
					res.attachment().send('foo');
				});

				request(server)
					.get('/1/')
					.expect('Content-Disposition', 'attachment', done);
			})
		})

		describe('.attachment(filename)', function () {
			it('should add the filename param', function (done) {


				app.get('/2/', function (req, res) {
					res.attachment('/path/to/image.png');
					res.send('foo');
				});

				request(server)
					.get('/2/')
					.expect('Content-Disposition', 'attachment; filename="image.png"', done);
			})

			it('should set the Content-Type', function (done) {

				app.get('/3/', function (req, res) {
					res.attachment('/path/to/image.png');
					res.send(Buffer.alloc(4, '.'))
				});

				request(server)
					.get('/3/')
					.expect('Content-Type', 'image/png', done);
			})
		})

		describe('.attachment(utf8filename)', function () {
			it('should add the filename and filename* params', function (done) {

				app.use(function (req, res) {
					res.attachment('/locales/日本語.txt');
					res.send('japanese');
				});

				request(server)
					.get('/')
					.expect('Content-Disposition', 'attachment; filename="???.txt"; filename*=UTF-8\'\'%E6%97%A5%E6%9C%AC%E8%AA%9E.txt')
					.expect(200, done);
			})

			it('should set the Content-Type', function (done) {

				request(server)
					.get('/')
					.expect('Content-Type', 'text/plain; charset=utf-8', done);
			})
		})

		it('should successfully terminate the app', async () => {
			await app.close()
		})
	})
})