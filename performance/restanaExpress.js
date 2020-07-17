const express = require('restana')
var path = require('path')
let compatibilityLayerPath = path.resolve('./index.js')

let restanaExpressCompatibilityMod = require(compatibilityLayerPath)
let compatibilityLayerSettings = {
	res: {
		toUse: ['all'],
		render: {
			viewsDir: path.resolve(__dirname + "/views/"),
			renderExt: '.pug',
			renderEngine: 'pug',
			//renderFunction: "__express"
		}
	},
	req: {
		toUse: 'all',
		proxy: true,
		proxyTrust: 'all',
	}
}

var app = express();

let restanaExpressCompatibility = new restanaExpressCompatibilityMod(compatibilityLayerSettings)

app.use(restanaExpressCompatibility.middleware)


app.get("/", function (req, res) {
	res.status(200).send('');
});

app.get('/json-only-query/', async (req,res) => {
	
	res.json({
		query: req.query
	})
})

app.get('/json/', (req,res) => {
	res.json({ip:req.ip, proto:req.protocol, fresh: req.fresh, 
		query: req.query
	})
})

app.get('/hi/', (req, res) => {
	res.send({
	  msg: 'Hello World!',
	  query: req.query

	})
  })

let server = app.start(3002, '0.0.0.0')
