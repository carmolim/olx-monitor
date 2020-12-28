require('dotenv').config()

let config = {};

config.urls = [
	'https://sp.olx.com.br/sao-paulo-e-regiao/autos-e-pecas/carros-vans-e-utilitarios/renault/duster?ot=1&me=60000&q=duster',
]

config.telegramChatID = process.env.TELEGRAM_CHAT_ID
config.telegramToken = process.env.TELEGRAM_TOKEN
config.logPath = 'scrapper.log'
config.dbPath = 'ads.db'


module.exports = config;