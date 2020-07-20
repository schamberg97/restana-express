const express = require('express')
var path = require('path')


var app = express();

app.set('query parser', 'simple')

app.get("/", function (req, res) {
	res.status(200).send('');
});

app.get('/json-only-query/', async (req,res) => {
	res.json({
		query: req.query
	})
})

app.get('/json/', (req,res) => {
	res.send({ip:req.ip, proto:req.protocol, fresh: req.fresh, 
		query: req.query
	})
})

app.get('/hi/', (req, res) => {
	res.send({
	  msg: 'Hello World!',
	  query: req.query,
	})
  })

app.get('/test/', (req,res) => {
	var fixtures = path.join(__dirname, '../test/fixtures');
	let filepath = path.resolve(fixtures, 'blog')
	res.sendFile(filepath);
})

let server = app.listen(3004, '0.0.0.0')
