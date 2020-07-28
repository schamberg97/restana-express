'use strict';

var expressReq = {}
var proxyaddr = require('proxy-addr');
var fresh = require('fresh');
var accepts = require('accepts')
var typeis = require('type-is');
var parseRange = require('range-parser');
var isIP = require('net').isIP;
var deprecate = require('depd')('express');

let reimplementedProperties = ['protocol', 'ip', 'ips', 'hostname', 'subdomains', 'fresh', "stale", 'xhr', 'secure']
let importable = ['protocol', 'ip', 'ips', 'hostname', 'subdomains','fresh','stale', 'query', 'secure', 'xhr', 'get','header', 
	'accepts', 'acceptsCharsets', 'acceptsCharset', 'acceptsEncodings', 'acceptsEncoding', 'acceptsLanguages', 'acceptsLanguage', 'param', 'is', 'range']
	
expressReq.accepts = function(){
	var accept = accepts(this);
	return accept.types.apply(accept, arguments);
};
expressReq.range = function (size, options) {
	var range = this.get('Range');
	if (!range) return;
	return parseRange(size, range, options);
};
expressReq.get = expressReq.header = function (name) {
      if (!name) {
        throw new TypeError('name argument is required to req.get');
      }
  
      if (typeof name !== 'string') {
        throw new TypeError('name must be a string to req.get');
      }
  
      var lc = name.toLowerCase();
  
      switch (lc) {
        case 'referer':
        case 'referrer':
          return this.headers.referrer
            || this.headers.referer;
        default:
          return this.headers[lc];
      }
};
expressReq.is = function (types) {
	var arr = types;
  
	// support flattened arguments
	if (!Array.isArray(types)) {
	  arr = new Array(arguments.length);
	  for (var i = 0; i < arr.length; i++) {
		arr[i] = arguments[i];
	  }
	}
  
	return typeis(this, arr);
  };
expressReq.param = function (name, defaultValue) {
	var params = this.params || {};
	var body = this.body || {};
	var query = this.query || {};
  
	var args = arguments.length === 1
	  ? 'name'
	  : 'name, default';
	deprecate('req.param(' + args + '): Use req.params, req.body, or req.query instead');
  
	if (null != params[name] && params.hasOwnProperty(name)) return params[name];
	if (null != body[name]) return body[name];
	if (null != query[name]) return query[name];
  
	return defaultValue;
};
expressReq.acceptsEncodings = function(){
	var accept = accepts(this);
	return accept.encodings.apply(accept, arguments);
  };
expressReq.acceptsEncoding = deprecate.function(expressReq.acceptsEncodings,
	'req.acceptsEncoding: Use acceptsEncodings instead');

expressReq.acceptsCharsets = function(){
	var accept = accepts(this);
	return accept.charsets.apply(accept, arguments);
};
expressReq.acceptsCharset = deprecate.function(expressReq.acceptsCharsets,
	'req.acceptsCharset: Use acceptsCharsets instead');

expressReq.acceptsLanguages = function(){
	var accept = accepts(this);
	return accept.languages.apply(accept, arguments);
  };
expressReq.acceptsLanguage = deprecate.function(expressReq.acceptsLanguages,
	'req.acceptsLanguage: Use acceptsLanguages instead');

expressReq.xhrPropFn = function() {
	var val = this.get('X-Requested-With') || '';
	return val.toLowerCase() === 'xmlhttprequest';
}
expressReq.protocolPropFn = function() {
	
	var proto = this.connection.encrypted
		? 'https'
		: 'http';
	var trust = this.__proxyTrustFunction
	if (!trust(this.connection.remoteAddress, 0)) {
		return proto;
	}
	
	// Note: X-Forwarded-Proto is normally only ever a
	  // single value, but this is to be safe.
	var header = this.get('X-Forwarded-Proto') || proto
	var index = header.indexOf(',')
	return index !== -1
		? header.substring(0, index).trim()
		: header.trim()
}
expressReq.freshPropFn = function() {
	var res = this.res
	var method = this.method;
	var status = res.statusCode
  
	// GET or HEAD for weak freshness validation only
	if ('GET' !== method && 'HEAD' !== method) return false;
	// 2xx or 304 as per rfc2616 14.26
	if ((status >= 200 && status < 300) || 304 === status) {
	  let z = fresh(this.headers, {
		'etag': res.get('ETag'),
		'last-modified': res.get('Last-Modified')
	  })
	  return z
	}
  
	return false;
}


expressReq.stalePropFn = function() {
	let val
	this.fresh instanceof Function ? val = this.freshPropFn() : val = !this.fresh
	return val
}
expressReq.securePropFn = function() {
	let val
	this.protocol instanceof Function ? val = this.protocolPropFn() : val = this.protocol === 'https'
	return val
}
expressReq.ipPropFn = function() {
	return proxyaddr(this, this.__proxyTrustFunction);
}
expressReq.ipsPropFn = function() {
	var addrs = proxyaddr.all(this, this.__proxyTrustFunction);
  
	// reverse the order (to farthest -> closest)
	// and remove socket address
	addrs.reverse().pop()
  
	return addrs
}
expressReq.hostnamePropFn = function() {
	var trust = this.__proxyTrustFunction
	var host = this.get('X-Forwarded-Host');
	if (!host || !trust(this.connection.remoteAddress)) {
	  host = this.get('Host');
	} else if (host.indexOf(',') !== -1) {
	  // Note: X-Forwarded-Host is normally only ever a
	  //       single value, but this is to be safe.
	  host = host.substring(0, host.indexOf(',')).trimRight()
	}
  
	if (!host) return;
  
	// IPv6 literal support
	var offset = host[0] === '['
	  ? host.indexOf(']') + 1
	  : 0;
	var index = host.indexOf(':', offset);
  
	return index !== -1
	  ? host.substring(0, index)
	  : host;
}
expressReq.subdomainsPropFn = function(){
	var hostname = this.hostname instanceof Function ? this.hostname() : this.hostname
	if (!hostname) return [];
	
	var offset = [this.__restanaExpressReqOptions.subdomainOffset, this.__restanaExpressReqOptions.subdomainsOffset, 2].find(el => el !== undefined);
	if (isNaN(offset)) offset = 2

	var subdomains = !isIP(hostname)
	  ? hostname.split('.').reverse()
	  : [hostname];
  
	return subdomains.slice(offset);
}

function init(reqToUse, reqToDisable, reqOptions) {
	if (!Array.isArray(reqToUse)) {
		reqToUse = [reqToUse]
	}
	let expressReqFinal = {
	}
	
	if (reqToUse.includes('all')) {
		reqToUse = importable
	}
	reqToUse.forEach(name => {
		let oldName = name
		if (reqToDisable.includes(name)) {
			
			return
		}
		if (reimplementedProperties.includes(name)) {
			name = name + "PropFn"
		}
		let index = importable.indexOf(oldName)
		if (index !== -1) {
			if (name.includes('query')) {
				expressReqFinal.queryFn = compileQueryParser(reqOptions.queryParser)
				if (expressReqFinal.queryFn === "no-need") delete expressReqFinal.queryFn
				return
			}
			expressReqFinal[name] = expressReq[name]
			return
		}
	})
	
	expressReqFinal.__proxyTrustFunction = compileTrust(reqOptions.proxyTrust)

	this.expReq = expressReqFinal
}

function compileTrust (val) {
	if (typeof val === 'function') return val;
  
	if (val === true || val === "all") {
	  // Support plain true/false
	  return function(){ return true };
	}
  
	if (typeof val === 'number') {
	  // Support trusting hop count
	  return function(a, i){ return i < val };
	}
  
	if (typeof val === 'string') {
	  // Support comma-separated values
	  val = val.split(/ *, */);
	}
  
	return proxyaddr.compile(val || []);
}

function compileQueryParser(val) {
	var fn;
	if (typeof val === 'function') {
	  return val;
	}
  
	switch (val) {
		case true:
		  fn = 'no-need';
		  break;
		case false:
		  fn = function() {return{}};
		  break;
		case null:
		case undefined:
			fn = parseExtendedQueryString;
			break;
		case 'extended':
		  fn = parseExtendedQueryString;
		  break;
		case 'simple':
		  fn = 'no-need';
		  break;
		default:
			throw new TypeError('unknown value for query parser function: ' + val);
	  }
  
	return fn;
}

function parseExtendedQueryString(str) {
	
	return require('qs').parse(str, {
	  allowPrototypes: true
	});
}

module.exports = init


