const express = require('express')
var path = require('path')


var app = express();

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
	  query: req.query,
	  subdomains: req.subdomains,
	  ip: req.ip,
	})
  })

let server = app.listen(3003, '0.0.0.0')
