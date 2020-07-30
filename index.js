'use strict'

// own submodules
var expRes_ = require('./lib/res.js')
var expReq_ = require('./lib/req.js')

var expRes = {}
var expReq = {}

function init(options) {

	let reimplementedProperties = ['protocol', 'ip', 'ips', 'hostname', 'subdomains', 'fresh', "stale", 'xhr', 'secure', 'query']
	this.reimplementedPropertiesGetterList = {}
	if (!options || typeof options !== 'object') throw new Error('restana-express-compatibility requires options')

	if (options.res) {
		let resToUse = options.res.toUse
		let resToDisable = Array.isArray(options.res.toDisable) ? options.res.toDisable : []
		options.res.render = Object.assign({}, options.res.render)
		options.res.render.renderExt = options.res.render.renderExt || ".pug"
		options.res.render.renderFunction = options.res.render.renderFunction || "__express"
		options.res.render.renderEngine = options.res.render.renderEngine || "pug"
		options.res.etag = options.res.etag || {}
		expRes = new expRes_(resToUse, resToDisable).expRes

	}
	if (options.req) {
		let reqToUse = options.req.toUse
		let reqToDisable = Array.isArray(options.req.toDisable) ? options.req.toDisable : []
		expReq = new expReq_(reqToUse, reqToDisable, options.req).expReq
	}
	reimplementedProperties = reimplementedProperties.filter((item) => {
		let retain = false
		if (expReq[item+"PropFn"]) retain = true
		return retain
	})

	if (options.req.propertiesAsFunctions) {
		reimplementedProperties.forEach((name, index) => {
			if (expReq[name + "PropFn"] && name !== 'query') {
				expReq[name] = expReq[name + "PropFn"]
				delete expReq[name + "PropFn"]
				if (index === reimplementedProperties.length - 1) reimplementedProperties = []
			}
			else if (name === "query") {
				this.reimplementedPropertiesGetterList[name] = {
					configurable: true,
					enumerable: true,
					get: expReq["queryPropFn"]
				}
			}
		})
	}
	else {
		reimplementedProperties.forEach((name, index) => {
			if (expReq[name + "PropFn"]) {
				this.reimplementedPropertiesGetterList[name] = {
					configurable: true,
					enumerable: true,
					get: expReq[name + "PropFn"]
				}
			}
		})
		
	}

	this.etagFn = compileETag(options.res.etag)
	if (typeof expReq.freshPropFn === "undefined" || !this.etagFn instanceof Function) {
		this.cacheBlockFn = function(req, res, inp, code, headers, cb) {
			if (304 === res.statusCode || 204 === res.statusCode) {
				res.removeHeader('Content-Type');
				res.removeHeader('Content-Length');
				res.removeHeader('Transfer-Encoding');
				return res.sendRestana(res.statusCode)
			}
			return res.sendRestana(inp, code, headers, cb)
		}
			
	}
	else {
				
		this.cacheBlockFn = function(req, res, inp, code, headers, cb) {
			if (!res.locals.NO_ETAG) {
				var generateETag = !res.getHeader('ETag')
				if (generateETag) {
					
					let etag = parent.etagFn(inp.toString(), 'utf8')
					res.setHeader('ETag', etag);
				}
			}
			if ( (req.fresh instanceof Function && req.fresh()) || req.fresh === true) {
				res.statusCode = 304
			}
			if (304 === res.statusCode || 204 === res.statusCode) {
				res.removeHeader('Content-Type');
				res.removeHeader('Content-Length');
				res.removeHeader('Transfer-Encoding');
				return res.sendRestana(res.statusCode)
			}
			return res.sendRestana(inp, code, headers, cb)
		}
	}

	let parent = this

	this.middleware = async function (req, res, next) {

		res = Object.assign(res, expRes)
		req = Object.assign(req, expReq)

		let oldResSend = res.send
		res.sendRestana = oldResSend

		res.locals = res.locals || {}

		res.__restanaExpressResOptions = options.res
		req.__restanaExpressReqOptions = options.req

		req.res = res
		res.req = req
		res.cacheBlockFn = parent.cacheBlockFn

		req.next = function(...args) {
			if (args.length) {
				if (process.env.NODE_ENV === "production" && typeof args[0] === "object") {
					if (args[0].statusCode === 404) {
						res.statusCode = 404;
						return res.end('404')
					}
					args[0].syspath = args[0].path
					args[0].path = req.path
					args[0] = {
						path: args[0].path,
						expose: args[0].expose,
						statusCode: args[0].statusCode,
						status: args[0].status,
					}
				}
				return oldResSend(args)
			}
			else {
				oldResSend(404, 404)
			}
		} 

		Object.defineProperties(req, parent.reimplementedPropertiesGetterList)

		res.send = function (inp, code = res.statusCode, headers, cb) {
			
			if (inp instanceof Error) return oldResSend(inp, code, headers, cb)

			switch (typeof inp) {
				case "string":
					if (!this.getHeader('Content-Type')) {
						this.setHeader('Content-Type', 'text/html');
					}
					break;
				case "boolean":
				case "number":
				case "object":
				default:
					if (!Buffer.isBuffer(inp)) {
						inp = JSON.stringify(inp)
						this.setHeader('Content-Type', 'application/json');
					}
					break
			}
			parent.cacheBlockFn(req, res, inp, code, headers, cb)
			
		}

		return next()
	}
	
}

function expressCreateETagGenerator (options) {
	var etag = require('@tinyhttp/etag');
	return function generateETag (body, encoding) {
	  var buf = !Buffer.isBuffer(body)
		? Buffer.from(body, encoding)
		: body
  
	  return etag(buf, options)
	}
}

function compileETag(etagSettings) {
	var fn;

	if (typeof etagSettings.type === 'function') {
		return etagSettings.type;
	}

	switch (etagSettings.type) {
		case "tiny":
		case undefined:
			let maxCache = etagSettings.maxSize || 1000;
			const cryptoRandomString = require('crypto-random-string');
			const seed = etagSettings.seed || cryptoRandomString({length: 10, type: 'numeric'});
			fn = expressCreateETagGenerator({ weak: true });
			let etag = require("tiny-etag")({cacheSize: maxCache, seed: seed});
			fn = function(inp) { return etag.create(inp) }
			break;
		case true:
			fn = expressCreateETagGenerator({ weak: true });
			break;
		case false:
			break;
		case 'strong':
			fn = expressCreateETagGenerator({ weak: false })
			break;
		case 'weak':
			fn = expressCreateETagGenerator({ weak: true });
			break;
		default:
			throw new TypeError('unknown value for etag function: ' + etagSettings.type);
	}

	return fn;
}

module.exports = init