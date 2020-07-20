'use strict'

// own submodules
var expRes_ = require('./lib/res.js')
var expReq_ = require('./lib/req.js')

var expRes
var expReq

var parseUrl = require('parseurl');

let reimplementedProperties = ['protocol', 'ip', 'ips', 'hostname', 'subdomains', 'fresh', "stale", 'xhr', 'secure']


function init(options) {
	if (!options) throw new Error('restana-express-compatibility requires options')
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


	this.etagFn = compileETag(options.res.etag)

	let parent = this

	this.middleware = async function (req, res, next) {
		let oldResSend = res.send
		

		res.sendRestana = oldResSend
		res.locals = res.locals || {}
		res.__restanaExpressResOptions = options.res
		req.__restanaExpressReqOptions = options.req

		req.res = res
		res.req = req	

		req.next = function(...err) {
			if (err.length) {
				return oldResSend(err)
			}
			else {
				oldResSend(404, 404)
			}
		} 

		res.__restanaExpressResOptions.etagFn = parent.etagFn
		
		res = Object.assign(res, expRes)
		req = Object.assign(req, expReq)
		

		if (req.query_) req.query = req.query_(parseUrl(req).query)
		if (!options.req.propertiesAsFunctions) {
			reimplementedProperties.forEach((name) => {
				if (req[name + "PropFn"]) {
					//req[name]=req[name + "PropFn"](req, res)
					defineGetter(req, name, function () {
						return req[name + "PropFn"](req, res)
					});
				}
			})
		}
		else {
			reimplementedProperties.forEach((name) => {
				if (req[name + "PropFn"]) {
					req[name] = req[name + "PropFn"]
				}
			})
		}

		res.send = function (inp, code = this.statusCode, headers, cb) {
			
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
			
			var etagFn = this.__restanaExpressResOptions.etagFn
			if (!res.locals.NO_ETAG && etagFn instanceof Function && typeof req.fresh !== 'undefined') {
				var generateETag = !this.getHeader('ETag')
				if (generateETag) {
					let etag = etagFn(inp.toString(), 'utf8')
					this.setHeader('ETag', etag);
				}
				if (( (req.fresh instanceof Function && req.fresh()) || req.fresh === true )) {
					code = this.statusCode = 304;
					this.removeHeader('Content-Type');
					this.removeHeader('Content-Length');
					this.removeHeader('Transfer-Encoding');
					inp = '';
					return oldResSend(inp, code, headers, cb)
				}
				else if (204 === this.statusCode || 304 === this.statusCode) {
					this.removeHeader('Content-Type');
					this.removeHeader('Content-Length');
					this.removeHeader('Transfer-Encoding');
					inp = '';
					return oldResSend(inp, code, headers, cb)
				}
			}
			
			return oldResSend(inp, code, headers, cb)
		}

		return next()
	}
	
}

function defineGetter(obj, name, getter) {
	Object.defineProperty(obj, name, {
		configurable: true,
		enumerable: true,
		get: getter
	});
}

//var expressETag = expressCreateETagGenerator({ weak: false })
//var weakExpressETag = expressCreateETagGenerator({ weak: true })

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