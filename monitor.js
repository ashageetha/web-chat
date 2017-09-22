'use strict'

const express = require('express')
const Prometheus = require('prom-client')

const app = express()
//const port = process.env.PORT || 3001
const metricsInterval = Prometheus.collectDefaultMetrics()
const checkoutsTotal = new Prometheus.Counter({
  name: 'checkouts_total',
  help: 'Total number of checkouts',
  labelNames: ['payment_method']
})
const httpRequestDurationMicroseconds = new Prometheus.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.10, 5, 15, 50, 100, 200, 300, 400, 500]  // buckets for response time from 0.1ms to 500ms
})

// Runs before each requests
app.use((req, res, next) => {
  res.locals.startEpoch = Date.now()
  next()
})

/*app.get('/', (req, res, next) => {
  setTimeout(() => {
    res.json({ message: 'Hello World!' })
    next()
  }, Math.round(Math.random() * 200))
})
*/
app.get('/bad', (req, res, next) => {
  next(new Error('My Error'))
})

app.get('/checkout', (req, res, next) => {
  const paymentMethod = Math.round(Math.random()) === 0 ? 'stripe' : 'paypal'

  checkoutsTotal.inc({
    payment_method: paymentMethod
  })

  res.json({ status: 'ok' })
  next()
})

app.get('/metrics', (req, res) => {
  res.set('Content-Type', Prometheus.register.contentType)
  res.end(Prometheus.register.metrics())
})

// Error handler
app.use((err, req, res, next) => {
  res.statusCode = 500
  // Do not expose your error in production
  res.json({ error: err.message })
  next()
})

// Runs after each requests
/*app.use((req, res, next) => {
  const responseTimeInMs = Date.now() - res.locals.startEpoch

  httpRequestDurationMicroseconds
    .labels(req.method, req.route.path, res.statusCode)
    .observe(responseTimeInMs)

  next()
})
*/
//client.listen(9095);

//var express = require('express'),
  //      app = express();

// This is needed if the app is run on heroku:

var port = process.env.PORT || 8080;

// Initialize a new socket.io object. It is bound to
// the express app, which allows them to coexist.

//app.get("/metrics",Prometheus.register.metrics());
var io = require('socket.io').listen(app.listen(port));

// Require the configuration and the routes files, and pass
// the app and io as arguments to the returned functions.

require('./config')(app, io);
require('./routes')(app, io);

console.log('Your application is running on http://localhost:' + port);

