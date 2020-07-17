const express = require('restana')
var path = require('path')

var app = express();

app.use((req,res,next) => {
	res.json = function(inp) {
		res.setHeader('Content-Type', 'application/json');
		if (inp == null) return res.send(null)
		return res.send(JSON.stringify(inp))
	}
	return next()
})

app.get("/", function (req, res) {
	res.send(200);
});

app.get('/json-only-query/', async (req,res) => {
	res.json({
		query: req.query
	})
})

app.get('/hi/', (req, res) => {
	res.send({
	  msg: 'Hello World!',
	  query: req.query
	})
  })

let server = app.start(3001, '0.0.0.0')
