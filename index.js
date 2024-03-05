const config = require('./config')
const cron = require('node-cron')
const $logger = require('./components/Logger')

const { scraper } = require('./components/Scraper')
const { createTables } = require('./database/database.js')

const runScraper = () => {

    for (var chatID in config.urls) {
        if (config.urls.hasOwnProperty(chatID)) {
            var urlsArray = config.urls[chatID];
    
            // Percorrendo todas as URLs dentro do array
            for (var i = 0; i < urlsArray.length; i++) {
                try {
                    scraper(urlsArray[i], chatID)
                } catch (error) {
                    $logger.error(error)
                }
            }
        }
    }
}

const main = async () => {
    $logger.info('Program started')
    await createTables()
    runScraper()
}

main()

cron.schedule(config.interval, () => {
    runScraper()
})
