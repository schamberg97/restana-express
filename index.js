'use strict'

var expRes_ = require('./lib/res.js')
var expReq_ = require('./lib/req.js')

var expRes
var expReq

var parseUrl = require('parseurl');

let reimplementedProperties = ['protocol', 'ip', 'ips', 'hostname', 'subdomains', 'fresh', "stale", 'xhr', 'param', 'query']


function init(options) {
	if (!options) throw new Error('restana-express-compatibility requires options')
	if (options.res) {
		let resToUse = options.res.toUse
		
		expRes = new expRes_(resToUse).expRes
		
	}
	if (options.req) {
		let reqToUse = options.req.toUse
		expReq = new expReq_(reqToUse, options.req).expReq
	}
	this.middleware = function (req,res,next) {
		res.locals = res.locals || {}
		res.__restanaExpressResOptions = options.res

		res.__restanaExpressResOptions.render.renderExt = res.__restanaExpressResOptions.render.renderExt || ".pug"
		res.__restanaExpressResOptions.render.renderFunction = res.__restanaExpressResOptions.render.renderFunction || "__express"
		res.__restanaExpressResOptions.render.renderEngine = res.__restanaExpressResOptions.render.renderEngine ||  "pug"
		
		let oldResSend = res.send
		
		res.send = function (inp, code, headers, cb) {      
			if (this.statusCode) code = this.statusCode
			oldResSend(inp, code, headers, cb)
		}
		//req.next = next
		req.res=res
		res.req=req
		
		res = Object.assign(res, expRes)
		req = Object.assign(req, expReq)
		
		if(req.query_) req.query = req.query_(parseUrl(req).query)

		reimplementedProperties.forEach((name) => {
			if (req[name+"PropFn"]) {
				defineGetter(req, name, function (){
					return req[name+"PropFn"](req,res)
				});
			}
		})

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

module.exports = init