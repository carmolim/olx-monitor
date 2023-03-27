require('dotenv').config()

let config = {}

config.urls = [
    'url1',
    'url2'
]

// this tool can help you create the interval string:
// https://tool.crontap.com/cronjob-debugger

config.interval = '*/5 * * * *' 
config.telegramChatID = process.env.TELEGRAM_CHAT_ID
config.telegramToken = process.env.TELEGRAM_TOKEN
config.logFile = 'scrapper.log'
config.dbFile = 'ads.db'

module.exports = config