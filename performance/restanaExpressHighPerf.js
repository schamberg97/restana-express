const express = require('restana')
var path = require('path')
let compatibilityLayerPath = path.resolve('./index.js')

let restanaExpressCompatibilityMod = require(compatibilityLayerPath)
let compatibilityLayerSettings = {
	res: {
		toUse: ['all'],
		toDisable: [],
		render: {
			viewsDir: path.resolve(__dirname + "/views/"),
			renderExt: '.pug',
			renderEngine: 'pug',
			//renderFunction: "__express"
		},
		etag: {
			
		}
	},
	req: {
		toUse: ['all'],
		propertiesAsFunctions: true,
		proxyTrust: 'all',
		queryParser: "simple",
		toDisable: []
	}
}

var app = express();

let restanaExpressCompatibility = new restanaExpressCompatibilityMod(compatibilityLayerSettings)
app.use(restanaExpressCompatibility.middleware)

app.get("/", function (req, res) {
	res.locals.buffalo = true
	res.send('');
});

app.get('/json-only-query/', async (req,res) => {
	
	res.json({
		query: req.query
	})
})

app.get('/json/', (req,res) => {
	res.json({ip:req.ip(), proto:req.protocol(), fresh: req.fresh(), 
		query: req.query
	})
})

app.get('/hi/', async (req, res) => {
	res.json({
	  msg: 'Hello World!',
	  query: req.query

	})
  })

let server = app.start(3002, '0.0.0.0')
