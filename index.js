const config = require('./config')
const cron = require('node-cron')
const $logger = require('./components/Logger')

const { scraper } = require('./components/Scraper')
const { createTables } = require('./database/database.js')

const runScraper = () => {
    for (let i = 0; i < config.urls.length; i++) {
        try {
            scraper(config.urls[i])
        } catch (error) {
            $logger.error(error)
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
