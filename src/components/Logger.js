const fs = require('fs');
const path = require('path');
const config = require('../config');

class Logger {
    constructor() {
        this.logFile = config.logger?.logFilePath 
            ? path.resolve(__dirname, '..', config.logger.logFilePath)
            : null;
        // Ativa debug se a variável de ambiente DEBUG for 'true' ou se estiver na config
        this.isDebugEnabled = process.env.DEBUG === 'true' || config.debug === true;
    }

    _formatMessage(level, message) {
        const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
        return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    }

    _log(level, message) {
        if (level === 'debug' && !this.isDebugEnabled) return;

        const formattedMessage = this._formatMessage(level, message);
        
        if (level === 'error') {
            console.error(formattedMessage);
        } else {
            console.log(formattedMessage);
        }

        if (this.logFile) {
            try {
                fs.appendFileSync(this.logFile, formattedMessage + '\n');
            } catch (err) {
                console.error(`Failed to write to log file: ${err.message}`);
            }
        }
    }

    info(msg) { this._log('info', msg); }
    error(msg) { this._log('error', msg); }
    debug(msg) { this._log('debug', msg); }
    warn(msg) { this._log('warn', msg); }
}

module.exports = new Logger();
