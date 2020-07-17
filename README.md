# Introduction

Restana-express is a partial Express compatibility layer for Restana, which implements most of the (req, res) additions over native node.js http(s) server made in Express. It may also work with other frameworks, but this is not guaranteed and may require slight modification. 

To achieve this, restana-express imports some methods and properties from Express (if possible) or reimplements them.

Restana-express does not aim to offer a 100% compatibility with Express and offers only most of the methods and properties outlined on the following pages:

*[Express Res](https://expressjs.com/en/4x/api.html#res)
*[Express Req](https://expressjs.com/en/4x/api.html#req)

Despite this, testing is *mostly* done with modified Express tests
However, see the table in Compatibility section


# License

MIT License

# Usage

## Installation

```
npm i --save restana-express
```

## Setting up the restana and middleware

```js
	const restana = require('restana')
	let restanaExpressCompatibilityMod = require('restana-express')
	let compatibilityLayerSettings = {
		res: {
			toUse: ['all'], // you can specify which res components you want. However, do take note that you may run into issues, if the component you use depends on another one, which you haven't specified
			render: {  // res.render was completely reimplemented and is now setup differently
				viewsDir: path.resolve(__dirname + "/views/"),
				renderExt: '.pug',
				renderEngine: 'pug',
				renderFunction: "__express"
			}
		},
		req: {
			toUse: ['all'], // you can specify which req components you want. However, do take note that you may run into issues, if the component you use depends on another one, which you haven't specified
			proxyTrust: true, // express proxyTrust-related functions have been reimplemented, so it is setup here. Accepts Number, function, String or Array of IPs, Boolean (see Express proxy settings)
			subdomainsOffset: 0 // defaults to 2
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

## Observations and known problems

What changes for you is that you need to enable a middleware before all other routes and middlewares. Do take note, though, that you need to enable cookie-parse middleware before restana-express, if you plan to use req.secureCookies and send secure cookies:

```js

var cookieParser = require('cookie-parser');

...
app.use(cookieParser(process.env.COOKIE_PARSER_SECRET || "wonderland"));
app.use(restanaExpressCompatibility.middleware)

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
| set | <span style="color:green"> Yes </span> | N/A |
| status | <span style="color:green"> Yes </span> | N/A |
| type | <span style="color:green"> Yes </span> | N/A |
| vary | <span style="color:green"> Yes </span> | N/A |

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
| cookies | <span style="color:red"> No </span> | You should use cookie-parser middleware, as this property is not implemented in Express itself. |
| fresh | <span style="color:green"> Yes </span> | N/A |
| hostname | <span style="color:green"> Yes </span> | N/A |
| ip | <span style="color:green"> Yes </span> | N/A |
| ips | <span style="color:green"> Yes </span> | N/A |
| method | <span style="color:green"> Native </span> | Does not need reimplementation |
| originalUrl | <span style="color:green"> Yes </span> | N/A |
| path | <span style="color:green"> Yes </span> | N/A |
| protocol | <span style="color:green"> Yes </span> | N/A |
| query | <span style="color:green"> Yes </span> | Set up the type of parser through compatibilityLayerSettings.req.queryParser, before initializing and app.use'ing the middleware. Accepts same values as express for this setting |
| hostname | <span style="color:green"> Yes </span> | N/A |
| route | <span style="color:red"> No </span> | Help is welcome |
| secure | <span style="color:green"> Yes </span> | N/A |
| signedCookies | <span style="color:red"> No </span> | Check entry in this table on req.cookies |
| stale | <span style="color:green"> Yes </span> | N/A |
| subdomains | <span style="color:green"> Yes </span> | subdomain offset is set through compatibilityLayerSettings.req.subdomainsOffset (note the 's' at the end of subdomains, might be fixed in the next release)|
| xhr | <span style="color:green"> Yes </span> | N/A |


### Methods

| Method or object | Implemented? | Notes |
| --- | --- | --- |
| accepts | <span style="color:green"> Yes </span> | N/A |
| acceptsCharsets | <span style="color:green"> Yes </span> | N/A |
| acceptsEncodings | <span style="color:green"> Yes </span> | N/A |
| acceptsLanguages | <span style="color:green"> Yes </span> | N/A |
| get | <span style="color:green"> Yes </span> | N/A |
| is | <span style="color:green"> Yes </span> | N/A |
| param | <span style="color:green"> Yes </span> | <span style="color:yellow"> Deprecated by express </span> |
| range | <span style="color:green"> Yes </span> | N/A |


# Benchmarks (not scientific)


## Route setup

The following route is used: 

```js

app.get('/json-only-query/', async (req,res) => {
	res.json({
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
* 3002 and restanaExpress for restana + restana-express
* 3003 and express for express


## Hardware used

> MacBook Pro 2019, 2,4 GHz Intel Core i9, 64 GB 2667 MHz DDR4  

## Results

| Server | Result, req/s | Gains over express |
|---|---|---|
| Restana | 41640.20 | 276% |
| Restana + restana-express | 25771.98 | 132% |
| Express | 11067.00 | 0% |

## Observations

Take note that req properties are probably going to be the largest hit on performance. Consider disabling them, if it helps. Additionally, you are likely to see little performance gains in res.render, but that you are still going to have significant performance wins with requests that do not involve rendering (such as with static data, or POST requests)