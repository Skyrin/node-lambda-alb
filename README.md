# node-lambda-alb
A simple lambda handler for requests coming from an AWS application load balancer

Currently requires using express

### Usage
const express = require('express')
const lambdaALB = require('lambda-alb')
const app = express()

// Add app specific routing logic here

exports.handler(lambdaALB.handler(app)
