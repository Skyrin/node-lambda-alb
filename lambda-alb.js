const http = require('http')
const url = require('url')

handler = (server, randomSocketLength) => {
	return (event, context) => {
		const srv = newServer(server, randomSocketLength)

		return new Promise((resolve,reject) => {
			srv.on('listening', () => {
				handleEvent(srv, event, context).then( (res) => {
					resolve(res)
					srv.close()
				}, (err) => {
					reject(err)
					srv.close()
				})
			})
			srv.listen(srv._socketPath)
		})
	}
}

handleEvent = (srv, event, context) => {
	return new Promise((resolve, reject) => {
		opts = parseEvent(srv, event)
		handleRequest(opts,context).then((response) => {
			resolve(response)
		}, (err) => {
			reject(err)
		})
	})
}


handleRequest = (options, context) => {
	return new Promise((resolve, reject) => {
		const req = http.request(options, (httpResponse) => {
			handleResponse(httpResponse, context).then((response)=>{
				resolve(response)
			},(err) => {
				reject(err)
			})
		})

		if (opts.body) {
			// TODO: check if base64encoded
			req.write(Buffer.from(opts.body, 'utf8'))
		}

		req.on('error', (error) => {
			console.error('[handleRequest.1]',error)
			reject({
				statusCode: 500,
				body: 'Unknown Internal Server Error',
				headers: {}
			})
		}).on('end', () => {
			resolve(response)
		}).end()
	})
}

handleResponse = (response, context) => {
	const buf = []
	return new Promise((resolve, reject) => {
		response.on('data', (chunk) => {
			buf.push(chunk)
		}).on('error', (err) => {
			reject(err)
		}).on('end', () => {
			resolve({
				statusCode: response.statusCode,
				// TODO: check/support if base64 encoded (files/non-standard requests)
				body: Buffer.concat(buf).toString('base64'),
				headers: response.headers,
				// TODO: support multiValueHeaders
//				multiValueHeaders: response.multiValueHeaders,
				isBase64Encoded: true
			})
		})
	})
}

// parseEvent converts the lambda+alb event to an http request
parseEvent = (srv, event) => {
	return {
		method: event.httpMethod,
		path: url.format({pathname: event.path, query: event.queryStringParameters }),
		headers: event.headers,
		socketPath: srv._socketPath,
		body: Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8'),
	}
}

newServer = (listener, randomSocketLength) => {
	const srv = http.createServer(listener)

	srv._socketPath = newSocketPath(randomSocketLength)
	srv._binaryTypes = [
		'application/javascript',
		'application/json',
		'application/octet-stream',
		'application/xml',
		'font/eot',
		'font/opentype',
		'font/otf',
		'image/jpeg',
		'image/png',
		'image/svg+xml',
		'text/comma-separated-values',
		'text/css',
		'text/html',
		'text/javascript',
		'text/plain',
		'text/text',
		'text/xml'
	]

	srv.on('listening', () => {
		srv._isListening = true
	}).on('close', () => {
		srv._isListening = false
	}).on('error', (err) => {
		console.error('[newServer.3]',err)
	})

	return srv
}

newSocketPath = (len) => {
	const s = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
	r = ''
	for (let i=0;i < len; i++) {
		r += s[Math.random()*62|0]
	}

	return '/tmp/server-'+r+'.sock'
}

exports.handler = handler