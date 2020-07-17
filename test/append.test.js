'use strict'

/* global describe, it */
const path = require('path')
const request = require('supertest')
const should = require('should')
const expect = require('chai').expect



describe('Express.js res.append methods', () => {
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

	it('should append multiple headers', function (done) {
		app.get('/append/1/', (req,res,next) => {
			res.append('Link', '<http://localhost/>')
			return next()
		})
		app.get('/append/1/', (req,res) => {
			res.append('Link', '<http://localhost:80/>')
			res.end()
		})
		request(server)
      	.get('/append/1/')
      	.expect('Link', '<http://localhost/>, <http://localhost:80/>', done)
	})

	it('should accept array of values', function (done) {
		app.get('/append/2/', function (req, res, next) {
			res.append('Set-Cookie', ['foo=bar', 'fizz=buzz'])
			res.end()
		})
		request(server)
    	.get('/append/2/')
    	.expect(function (res) {
        	should(res.headers['set-cookie']).eql(['foo=bar', 'fizz=buzz'])
    	})
    	.expect(200, done)
	})
	it('should get reset by res.set(field, val)', function (done) {
		app.get('/append/3/', function (req, res, next) {
    	    res.append('Link', '<http://localhost/>')
    	    res.append('Link', '<http://localhost:80/>')
    	    next()
		})

		app.get('/append/3/', function (req, res, next) {
			res.set('Link', '<http://127.0.0.1/>')
    	    res.end()
		})
		request(server)
      		.get('/append/3/')
      		.expect('Link', '<http://127.0.0.1/>', done)
	})

	it('should work with res.set(field, val) first', function (done) {
  
		app.get('/append/4/', function (req, res, next) {
		  res.set('Link', '<http://localhost/>')
		  next()
		})
  
		app.get('/append/4/', function (req, res, next) {
		  res.append('Link', '<http://localhost:80/>')
		  res.end()
		})
  
		request(server)
		.get('/append/4/')
		.expect('Link', '<http://localhost/>, <http://localhost:80/>', done)
	  })

	  it('should work with cookies', function (done) {
		
  
		app.get('/append/5/', function (req, res, next) {
		  res.cookie('foo', 'bar')
		  next()
		})
  
		app.get('/append/5/', function (req, res, next) {
		  res.append('Set-Cookie', 'bar=baz')
		  res.end()
		})
  
		request(server)
		.get('/append/5/')
		.expect(function (res) {
		  should(res.headers['set-cookie']).eql(['foo=bar; Path=/', 'bar=baz'])
		})
		.expect(200, done)
	  })

	it('should successfully terminate the app', async () => {
		await app.close()
	})

})