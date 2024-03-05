require('dotenv').config()

let config = {}

config.urls = {
    'chatID1': [
        'url1',
        'url2',
    ],
    'chatID2': [
        'url1',
    ]
}

/* 
Exemplo (ids ficticios):

config.urls = {
    '-12981921412': [ // enviará para um grupo
        'https://www.olx.com.br/informatica/notebooks/estado-sp?pe=500&ps=10&q=notebook&na=1&na=2&na=4&nme=1&nme=3&nme=5',
        'https://www.olx.com.br/informatica/notebooks/estado-sp/regiao-de-sorocaba?pe=500&ps=10&q=notebook&na=1&na=2&na=4&nme=1&nme=3&nme=5',
    ],
    '-12981921412&reply_to_message_id=140': [ // enviará para o mesmo grupo, mas em um tópico (chamado iphones, por exemplo)
        'https://www.olx.com.br/informatica/notebooks/estado-sp/regiao-de-sorocaba?pe=500&ps=10&q=iphone&na=1&na=2&na=4&nme=1&nme=3&nme=5',
    ]
}
 */

// this tool can help you create the interval string:
// https://tool.crontap.com/cronjob-debugger

config.interval = '*/5 * * * *' 
config.telegramToken = process.env.TELEGRAM_TOKEN
config.dbFile = 'ads.db'

config.logger={
    logFilePath: 'scrapper.log',
    timestampFormat:'YYYY-MM-DD HH:mm:ss'
}

module.exports = config