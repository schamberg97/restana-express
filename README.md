# Introduction

WARNING: this project is in its infancy, test hard before using in production

Restana-express is a partial Express compatibility layer for Restana, which implements most of the (req, res) additions over native node.js http(s) server made in Express. It may also work with other frameworks, but this is not guaranteed and may require slight modification. 

To achieve this, restana-express imports some methods and properties from Express (if possible) or reimplements them.

Restana-express-compatibility does not aim to offer a 100% compatibility with Express and offers only most of the methods and properties outlined on the following pages:

[Express Res](https://expressjs.com/en/4x/api.html#res)

[Express Req](https://expressjs.com/en/4x/api.html#req)


Despite this, testing is *mostly* done with modified Express tests
However, see the table in Compatibility section

# Version & Changes

### 1.2.1, 1.2.2 (current)

* Documentation updates

### 1.2.0

* Numerous bugfixes
* req methods and properties tests rewritten
* Methods and properties can be disabled on case-by-case basis to help you increase performance
* Req properties can be disabled and used as functions to increase performance (greatly)
* Res.send is now more modified to be more compatible with express
* Better etag support & ability to turn it off

### 1.0.1

* Initial (very buggy) release

# License

MIT License

# Usage


## Installation

```
npm i --save restana-express-compatibility
```

## Setting up the restana and middleware

```js
	const restana = require('restana')
	let restanaExpressCompatibilityMod = require('restana-express-compatibility')
	let compatibilityLayerSettings = {
		res: {
			toUse: ['all'], // you can specify which res components you want. However, do take note that you may run into issues, if the component you use depends on another one, which you haven't specified. Check dependencies table in Observations and known problems
			toDisable: [], // Array of methods and properties to disable. Overrides 'toUse'
			render: {  // res.render was completely reimplemented and is now setup differently
				viewsDir: path.resolve(__dirname + "/views/"),
				renderExt: '.pug',
				renderEngine: 'pug',
				renderFunction: "__express"
			}
		},
		req: {
			toUse: ['all'], // you can specify which req components you want. However, do take note that you may run into issues, if the component you use depends on another one, which you haven't specified. Check dependencies table in Observations and known problems 
			toDisable: [], // Array of methods and properties to disable. Overrides 'toUse'
			proxyTrust: true, // express proxyTrust-related functions have been reimplemented, so it is setup here. Accepts Number, function, String or Array of IPs, Boolean (see Express proxy settings)
			queryParser: true, // true, "simple" uses restana's url query parser, "extended" or undefined enables Express's extended query parser (Check express docs for explanation)
			subdomainsOffset: 0, // defaults to 2
			// OR
			subdomainOffset: 0, // subdomainsOffset is still prioritized
			propertiesAsFunctions: true, // default - undefined. False to disable, true to enable
			etag: {
				type: 'tiny', // default - tiny, true enables Express's weak ETag, otherwise uses the same options as Express (see - https://expressjs.com/en/api.html#etag.options.table)
				seed: 01234567890, // Number, for use with Tiny ETag. Should be syncronised between all instances of your server on all machines, otherwise useless, since all ETags will be different. However, will generate a pseudo-random number by default instead.
				maxSize: 1000 // Used with Tiny ETag, size of internal cache (number of entries). 1000 is the default. You should probably set closer towards the number of resources available on your service. 
			}
		}
	}
	
	var app = restana();

	let restanaExpressCompatibility = new restanaExpressCompatibilityMod(compatibilityLayerSettings)

	app.use(restanaExpressCompatibility.middleware)

	app.get('/hi/', (req, res) => {
		res.send({
			msg: 'Hello World!',
			query: req.query,
			subdomains: req.subdomains,
			ip: req.ip,
		})
	})

	let server = app.start(3002, '0.0.0.0')
	  
```

# Compatibility 

## Res

### Properties

| Property or object | Implemented? | Notes |
| --- | --- | --- |
| locals | <span style="color:green"> Yes </span> | N/A |
| headersSent | <span style="color:green"> Native </span> | Doesn't need reimplementation |
| app | <span style="color:red"> No </span> | Probably not going to be implemented |

### Methods

| Method or object | Implemented? | Notes |
| --- | --- | --- |
| append | <span style="color:green"> Yes </span> | N/A |
| attachment | <span style="color:green"> Yes </span> | N/A |
| cookie | <span style="color:yellow"> Yes </span> | cookieParser required for signed cookies, check req.cookie entry in req properties |
| clearCookie | <span style="color:yellow"> Yes </span> | cookieParser required for signed cookies, check req.cookie entry in req properties |
| download | <span style="color:green"> Yes </span> | N/A |
| end | <span style="color:green"> Native </span> | Doesn't need reimplementation |
| get | <span style="color:green"> Yes </span> | N/A |
| json and jsonp | <span style="color:yellow"> Partial </span> | Reimplemented, but very crudely. It only JSON stringifies the object supplied. Needs to be rewritten |
| links | <span style="color:green"> Yes </span> | N/A |
| location | <span style="color:green"> Yes </span> | N/A |
| redirect | <span style="color:green"> Yes </span> | N/A |
| render | <span style="color:yellow"> Rewritten from scratch </span> | Rewritten from scratch, compatible with using only one render engine. Workarounds might be possible. Please read section on res.render |
| send | <span style="color:yellow"> Partial  </span> | Slightly modifies restana's res.send to make it respect change of http status code through res.status(code) or res.statusCode = code |
| sendFile | <span style="color:yellow"> Partial </span> | Not sufficiently covered by tests, not all Express tests are ported. Likely works just fine |
| sendStatus | <span style="color:green"> Yes </span> | N/A |
| set / header | <span style="color:green"> Yes </span> | N/A |
| status | <span style="color:green"> Yes </span> | N/A |
| type / contentType | <span style="color:green"> Yes </span> | N/A |
| vary | <span style="color:green"> Yes </span> | N/A |
| format | <span style="color:green"> Yes </span> | Not sufficiently covered by tests |


### res.render

restana-express does not import res.render, because it depends too much on express core. Therefore, this project partially reimplements the res.render itself.

#### Limitations

* Works only with one render engine, you can't specify many (workarounds might be possible by initializing this middleware several times differently in various places of your project)
* No express automagic :(

#### Settings

```js
let compatibilityLayerSettings = {
	res: {
		toUse: ['all'], // should either be an Array with 'all' or at least include 'render'
		render: {  // res.render was completely reimplemented and is now setup differently
			viewsDir: path.resolve(__dirname + "/views/"), // ESSENTIAL parameter, without it res.render will send an error
			renderExt: '.pug', // essential, if you use something besides Pug. Dot at the beginning is needed. Defaults to '.pug'
			renderEngine: 'pug', // name of engine. restana-express will require it. Defaults to 'pug'
			renderFunction: "__express" // Internal function that works with express. Usually you should leave it unchanged. Defaults to '__express'
		}
	},
	...
}
```

## Req

### Properties

| Property or object | Implemented? | Notes |
| --- | --- | --- |
| app | <span style="color:red"> No </span> | Probably not going to be implemented |
| baseUrl | <span style="color:red"> No </span> | Help is welcome |
| headersSent | <span style="color:green"> Native </span> | Doesn't need reimplementation |
| body | <span style="color:red"> No </span> | You may use body-parser middleware, since this is what express uses internally. You can app.use (or abuse :D) it either before or immediately after restana-express |
| cookies | <span style="color:red"> No, not in restana-express itself. Please, see notes </span> | You should use cookie-parser middleware, as this property is not implemented in Express itself. |
| fresh | <span style="color:green"> Yes </span> | N/A |
| hostname | <span style="color:green"> Yes </span> | N/A |
| ip | <span style="color:green"> Yes </span> | N/A |
| ips | <span style="color:green"> Yes </span> | N/A |
| method | <span style="color:green"> Native </span> | Does not need reimplementation |
| originalUrl | <span style="color:green"> Native </span> | Does not need reimplementation |
| path | <span style="color:green"> Native </span> | Does not need reimplementation |
| protocol | <span style="color:green"> Yes </span> | N/A |
| query | <span style="color:green"> Yes </span> | Set up the type of parser through compatibilityLayerSettings.req.queryParser, before initializing and app.use'ing the middleware. Accepts same values as express for this setting |
| hostname | <span style="color:green"> Yes </span> | N/A |
| route | <span style="color:red"> No </span> | Help is welcome |
| secure | <span style="color:green"> Yes </span> | N/A |
| signedCookies | <span style="color:red"> No, not in restana-express itself. Please, see notes </span> | Check entry in this table on req.cookies |
| stale | <span style="color:green"> Yes </span> | N/A |
| subdomains | <span style="color:green"> Yes </span> | subdomain offset is set either through compatibilityLayerSettings.req.subdomainsOffset OR compatibilityLayerSettings.req.subdomainOffset |
| xhr | <span style="color:green"> Yes </span> | N/A |


### Methods

| Method or object | Implemented? | Notes |
| --- | --- | --- |
| accepts | <span style="color:green"> Yes </span> | N/A |
| acceptsCharsets | <span style="color:green"> Yes </span> | N/A |
| acceptsEncodings | <span style="color:green"> Yes </span> | N/A |
| acceptsLanguages | <span style="color:green"> Yes </span> | N/A |
| get / header | <span style="color:green"> Yes </span> | N/A |
| is | <span style="color:green"> Yes </span> | N/A |
| param | <span style="color:green"> Yes </span> | <span style="color:yellow"> Deprecated by express. Please note that you need body-parser middleware </span> |
| range | <span style="color:green"> Yes </span> | N/A |


## Serve static

For serving static content, see this article: https://thejs701816742.wordpress.com/2019/07/12/restana-static-serving-the-frontend-with-node-js-beyond-nginx/

It is recommended that you limit these middleware to some routes, while restana-express-compatibility to other routes.

## Observations and known problems

### Tests

Tests currently cover only the default options, at which restana-express-compatibility is the most compatible with Express, but also the slowest. Help is welcome.

### Restana-express-compatibility and cookie- and body-parser

In order for this middleware to work correctly for routes or middleware that were designed for Express, you need to speicfy and app.use it before them. Do take note, though, that you need to enable cookie-parser middleware before restana-express, if you plan to use req.secureCookies and send secure cookies:

```js

var cookieParser = require('cookie-parser');

...
app.use(cookieParser(process.env.COOKIE_PARSER_SECRET || "wonderland"));
app.use(restanaExpressCompatibility.middleware)

```

The same applies to body-parser: 

```js

var cookieParser = require('cookie-parser');
const bodyParser = require('body-parser')


...
// parse application/json
app.use(bodyParser.json())
app.use(cookieParser(process.env.COOKIE_PARSER_SECRET || "wonderland"));
app.use(restanaExpressCompatibility.middleware)

```

### Performance

With the default settings, restana-express-compatibility is highly compatible with express. This compatibility comes at a great cost - the performance is higher than with express, but not THAT much higher (only by up to 60%, depending on task). In other words, restana-express-compatibility can handle 16-17k requests per second instead of 10-11k with express with /json/ route (see benchmarks section)

Here are the tips to increase performance:

#### Tip 1 - Disable req properties, if you don't use them [EASY]

Some express req properties are very convenient at times. These include:

```js 
	['protocol', 'ip', 'ips', 'hostname', 'subdomains', 'fresh', "stale", 'xhr', 'secure'] // the list is exhaustive
```

However, before continuing with your application logic, each of them has to be processed, EVEN IF you don't end up using them. Internally, there are functions, like req.protocolPropFn which is run in the middleware, before carrying on to your routes. In this example, req.protocolPropFn populates req.protocol. In the end, it means that middleware is forced to traverse through these functions and then run each one that is enabled.

As such, if performance is vital, you can either disable some properties (very modest performance increase) OR disable them altogether (great speed increase). Alternatively, you can turn them into functions instead:

```js
let compatibilityLayerSettings = {
	req: {
		propertiesAsFunctions: true,
	}
}
```

This way, whenever you need to know the protocol, instead of accessing req.protocol property, you'll need to call req.protocol() function. No arguments are required. This measure will boost restana-express-compatibility from handling 16-17k req/s to handling 21-23 req/s, which is a further 35% speed increase. You should be able to easily replace calls to req properties with calls to the new functions with your IDE or shell commands.

#### Tip 2 - Don't enable extended query parsing or weak or strong ETag [MEDIUM]

By default, restana-express-compatibility uses a different implementation of ETag, which should work just fine. Don't change the ETag setting, unless you know what you are doing.
The same applies to query parsing - by default, Express.JS extended query parsing is used for Express compatibility reasons. We advise you to disable it and use the simple parser, as it is built-in, unless you REALLY need the extended parser. But in any case, you should avoid passing data as a query due to its inherent limitations.

You can also consider benchmarking with ETag disabled on specific routes with 

#### Tip 3 - disable what you don't need [HARD]

By disabling things you don't need, you make the server use less RAM, which is beneficial in the long term. Additionally, the middleware merges the req and res objects with objects containing functions and properties taken from Express each time a route after compatibility middleware is requested by a client. This means that for every unnecessary method or property activated, the server spends more time merging the object with Object.assign.

For instance, with no methods or properties activated, the merge takes only ~5000 nanoseconds. However, with all methods or properties, it takes ~60000 nanoseconds. That is more than a third of the total middleware working time (with req.properties converted into functions). This means that keeping bare minimum of methods and properties you need will make the middleware work faster. Therefore, your own code will execute faster. 

For your convenience, there are dependency tables provided after the tips. Take note that number of dependencies may be reduced in the next minor release.

#### Tip 4 - gradually stop using this module [POSSIBLY HARD]

By disabling this module and finding alternatives for your needs (if possible), you are going to have a much faster application. It is highly likely you do not need all of the methods and properties offered by express and only need a subset. Find appropriate middleware for your needs or reimplement the required methods to suit your needs. Your app performance is gonna thank you. Moreover, you can limit the middleware only to specific routes, so that it is not run, where it is not needed.


#### Dependency tables

Please take note that these tables serve as an indication only. It is highly possible some mistakes could have been made, especially with Dependents column

##### Res properties

| Property or object | Can be disabled? | Dependencies |
| --- | --- | --- |
| locals | No | None |

##### Res methods

| Method or object | Can be disabled? | Dependencies | Dependents |
| --- | --- | --- | --- |
| send | No | None | Irrelevant |
| append | Yes | res.get, res.set | res.cookie |
| attachment | Yes | res.type, res.set | None |
| cookie | Yes | res.append, cookie-parse middleware (for signed cookies, see Compatibility and Observations and known problems sections ) | res.clearCookie |
| clearCookie | Yes | res.cookie and its dependencies | None |
| download | Yes | res.sendFile | None |
| end | No, native | None | Irrelevant |
| get | Yes | None | res.append, REQ.fresh, REQ.hostname |
| json and jsonp | Yes | None | res.render |
| links | Yes | res.set | None |
| location | Yes | REQ.get && res.set | res.redirect | 
| redirect | Yes | res.location, res.format, res.set | None |
| render | Yes | res.status, res.json, res.set | None |
| sendFile | Yes | None | None |
| sendStatus | Yes | None | None |
| set / header | Yes | None | res.append, res.attachment, res.links, res.location, res.redirect, res.render, res.type/res.contentType, res.format |
| status | Yes | None | res.render |
| type / contentType | Yes | res.set | res.attachment |
| vary | Yes | None | res.format |
| format | Yes | res.vary, res.set | res.redirect |

##### Req properties

| Property or object | Can be disabled? | Dependencies | Dependents |
| --- | --- | --- | --- |
| headersSent | No, Native | None | Irrelevant |
| fresh | Yes | RES.get | req.stale, RES.send (soft-fail, ETag functionality gets disabled) |
| ip | Yes | None | None |
| ips | Yes | None | None | 
| method | No, Native | None | Irrelevant |
| originalUrl | No, Native | None | Irrelevant |
| params | No, Native | None | Irrelevant |
| path | No, Native | None | Irrelevant |
| protocol | Yes | req.get | req.secure |
| query | No | None | Irrelevant |
| hostname | Yes | req.get | req.subdomains |
| secure | Yes | req.protocol | None |
| stale | Yes | req.fresh | None |
| subdomains | Yes | req.hostname | None |
| xhr | Yes | req.get | None |

#### Req methods

| Method or object | Can be disabled? | Dependencies | Dependents |
| --- | --- | --- | --- |
| accepts | Yes | None | None | 
| acceptsCharsets | Yes | None | None | 
| acceptsEncodings | Yes | None | None | 
| acceptsLanguages | Yes | None | None | 
| get / header | Yes | None | req.range, RES.location, req.protocol, req.hostname, req.xhr |
| is | Yes | None | None |
| param | Yes | req.params, req.body, req.query | None | 
| range | Yes | req.get | None |



# Benchmarks (not scientific)


## Route setup

The following route is used: 

```js

app.get('/hi/', async (req, res) => {
	res.send({
	  msg: 'Hello World!',
	  query: req.query

	})
})

```

For restana without restana-express, the following middleware is added:

```js

app.use((req,res,next) => {
	res.json = function(inp) {
		res.setHeader('Content-Type', 'application/json');
		if (inp == null) return res.send(null)
		return res.send(JSON.stringify(inp))
	}
	return next()
})

```

## Tool used

```
node ./performance/APP.js
sleep 5
wrk -t8 -c64 -d5s http://localhost:PORT/hi/

```

, where PORT and APP are changed to: 

* 3001 and restana for restana
* 3002 and restanaExpressHighPerf for restana + restana-express (performance conscious, query-parser set to simple, req.properties turned into methods)
* 3003 and restanaExpress for restana + restana-express (default)
* 3004 and express for express


## Hardware used

> MacBook Pro 2019, 2,4 GHz Intel Core i9, 64 GB 2667 MHz DDR4  

## Results

| Server | Result, req/s | Gains over express |
|---|---|---|
| Restana | 49886.07 | 319% |
| Restana + restana-express (performance conscious) | 22326.22 | 87% |
| restana + restana-express (default) | 18751.39 | 57% |
| Express | 11882.26 | 0% |