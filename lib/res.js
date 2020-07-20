'use strict';

var expressRes = {}
var expressRes_ = require('express/lib/response.js')
var contentDisposition = require('content-disposition');
var statuses = require('statuses')
var path = require('path');
var resolve = path.resolve;


let methods = ['append', 'attachment', 'cookie', 'clearCookie', 'download', 'format', 'get',
	'json', 'links', 'location', 'redirect', 'render', 'sendFile', 'sendfile', 'sendStatus', 'set',
	'status', 'type', 'contentType', 'vary'//, 'send'
]

expressRes_.download = function download(path, filename, options, callback) {
	var done = callback;
	var name = filename;
	var opts = options || null

	// support function as second or third arg
	if (typeof filename === 'function') {
		done = filename;
		name = null;
		opts = null
	} else if (typeof options === 'function') {
		done = options
		opts = null
	}

	// set Content-Disposition when file is sent
	var headers = {
		'Content-Disposition': contentDisposition(name || path)
	};

	// merge user-provided headers
	if (opts && opts.headers) {
		var keys = Object.keys(opts.headers)
		for (var i = 0; i < keys.length; i++) {
			var key = keys[i]
			if (key.toLowerCase() !== 'content-disposition') {
				headers[key] = opts.headers[key]
			}
		}
	}

	// merge user-provided options
	opts = Object.create(opts)
	opts.headers = headers

	// Resolve the full path for sendFile
	var fullPath = resolve(path);

	// send file
	return this.sendFile(fullPath, opts, done)
};

expressRes_.status = function (code) {
	this.statusCode = code
	return this
}

expressRes_.sendStatus = function (statusCode) {
	var body = statuses.message[statusCode] || String(statusCode)
	
	this.statusCode = statusCode
	this.type('txt');
  
	return this.send(body);
};

expressRes_.json = expressRes_.jsonp = function (inp) {
	this.setHeader('Content-Type', 'application/json');
	if (inp == null) return this.send(null)
	return this.send(JSON.stringify(inp))
}
		
expressRes_.render = function (inp, options, callback) {

	if (!this.__restanaExpressResOptions.render.viewsDir) {
		let json = {code:500, message: `Could not render ${inp}, because res.render is not configured correctly in restana-express middleware`}
		if (process.env.NODE_ENV !== "production") {
			json.settings = this.__restanaExpressResOptions.render
		}
		return this.status(500).sendRestana(json)
	}
	let done = callback;
	let opts = options || {};
	if (typeof options === 'function') {
		done = options;
		opts = {};
	}
	if (Object.keys(this.locals).length) Object.assign(opts, this.locals)
	// merge res.locals
	let res = this
	done = done || function (err, str) {
		if (err) {
			
			if (process.env.NODE_ENV !== "production") {
				console.error(err)
				let status = err.code === "ENOENT" ? 404 : 500
				err = err.toString()
				return res.status(status).sendRestana({code:status, message:err})
			}
			throw new Error(`Rendering error with page ${res.req.url}`)
		}
		res.set("Content-Type", "text/html; charset=UTF-8")
		res.send(str)
	};
	let renderOptionsDef = {
		filename: inp + this.__restanaExpressResOptions.render.renderExt,
		basedir: this.__restanaExpressResOptions.render.viewsDir,
		cache: process.env.NODE_ENV === "production" ? true : false,
	}
	let renderOptions = this.__restanaExpressResOptions.render.options || renderOptionsDef
	Object.assign(renderOptions, opts)
	return require(this.__restanaExpressResOptions.render.renderEngine)[this.__restanaExpressResOptions.render.renderFunction](`${this.__restanaExpressResOptions.render.viewsDir}/${inp}${this.__restanaExpressResOptions.render.renderExt}`, renderOptions, done)
}
	

function init(resToUse, resToDisable) {
		
	if (!Array.isArray(resToUse)) {
		resToUse = [resToUse]
	}

	if (resToUse.includes('all')) {
		resToUse = methods
	}
	
	resToUse.forEach((name) => {
		let index = methods.indexOf(name)
		if (index !== -1 && !resToDisable.includes(name)) {
			expressRes[name] = expressRes_[name]
		}
	})
	

	this.expRes = expressRes
}

module.exports = init