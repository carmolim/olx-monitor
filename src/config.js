
let config = {}

// Interval in minutes between each scraping cycle
config.interval = 5; 
config.telegramToken = process.env.TELEGRAM_TOKEN
config.dbFile = '../data/ads.db'

config.logger={
    logFilePath: '../data/scrapper.log',
    timestampFormat:'YYYY-MM-DD HH:mm:ss'
}

module.exports = config