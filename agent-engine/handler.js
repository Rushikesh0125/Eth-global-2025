const serverless = require('serverless-http');
const app = require("./index.js");

const handler = serverless(app)
module.exports = handler