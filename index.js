const config = require('./config')
const fs = require('fs')
const path = require('path')
const cron = require('node-cron')
const log = require('simple-node-logger').createSimpleLogger(path.join(__dirname, config.logFile))

const { scraper } = require('./components/Scraper')
const { createTables } = require('./database/database.js')

const runScraper = () => {
    for (let i = 0; i < config.urls.length; i++) {
        try {
            scraper(config.urls[i])
        } catch (error) {
            log.error(error)
        }
    }
}

const main = async () => {
    log.info('Program started')
    await createTables()
    runScraper()
}

main()

cron.schedule(config.interval, () => {
    runScraper()
})
