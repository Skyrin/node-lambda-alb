# node-lambda-alb
A simple lambda handler for requests coming from an AWS application load balancer

Currently requires using express

### Usage
####package.json
    "node-lambda-alb": "skyrin/node-lambda-alb",

####server.js/index.js
const http = require('http')
const https = require('https')
const express = require('express')
const compression = require('compression')
const app = express()
const manifest = require('./.client/manifest.json')
const expressStaticGzip = require('express-static-gzip')
const document = require('./document')

const lambdaALB = require('node-lambda-alb')

/*
	The 'dist' directory is where the JS bundles get outputted to
	Webpack has been setup to name each file after a hash of it's contents.
	Because the file is named after the content hash, the browser never needs to check for staleness on these files.
	The immutable directive will instruct the client not to make a conditional request for the duration of the maxAge.
*/
app.use(
	'/dist',
	expressStaticGzip('.client', {
		index: false,
		immutable: true,
		maxAge: '365d',
		enableBrotli: true,
		orderPreference: ['br'],
	})
)

app.use(compression())

app.use('/', express.static('public'))

app.get('/*', (req, res) => {
	res.setHeader('Cache-Control', 'no-cache')
	res.send(document(manifest))
})

// If running from AWS lambda environment
if(process.env.IS_LAMBDA == 'true') {
	exports.handler = lambdaALB.handler(app)
} else {
	//HTTP SERVER configuration
	const port = process.env.PORT || 3000
	const httpServer = http.createServer(app)
	httpServer.listen(port, function () {
		console.log(`Listening on ${port}`)
	})

	process.on('unhandledRejection', (reason) => {
		console.log('Unhandled Rejection at:', reason.stack || reason)
	})
}
