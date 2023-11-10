const config = require('../config')
const SimpleNodeLogger = require('simple-node-logger'),
logger = SimpleNodeLogger.createSimpleLogger( config.logger );

module.exports = logger
