require('dotenv').config()

let config = {};

config.urls = ['url1','url2']

config.telegramChatID = process.env.TELEGRAM_CHAT_ID
config.telegramToken = process.env.TELEGRAM_TOKEN
config.logPath = 'scrapper.log'
config.dbPath = 'ads.db'


module.exports = config;