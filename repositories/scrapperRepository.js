const { db } = require('../database/database.js')
const $logger = require('../components/Logger.js')

const saveLog = async (data) => {
    $logger.debug('scrapperRepository: saveLog')

    const query = `
        INSERT INTO logs(  url, adsFound, averagePrice, minPrice, maxPrice, created )
        VALUES( ?, ?, ?, ?, ?, ? )
    `

    const now = new Date().toISOString()

    const values = [
        data.url,
        data.adsFound,
        data.averagePrice,
        data.minPrice,
        data.maxPrice,
        now,
    ]

    return new Promise(function (resolve, reject) {
        db.run(query, values, function (error, rows) {

            if (error) {
                reject(error)
                return
            }

            resolve(rows)
        })
    })
}

const getLogsByUrl = async (url, limit) => {
    $logger.debug('scrapperRepository: getLogsByUrld')

    const query = `SELECT * FROM logs WHERE url = ? LIMIT ?`
    const values = [url, limit]

    return new Promise(function (resolve, reject) {
        db.all(query, values, function (error, rows) {

            if (error) {
                reject(error)
                return
            }

            if (!rows) {
                reject('No ad with this id was found')
                return
            }

            resolve(rows)
        })
    })
}

module.exports = {
    saveLog,
    getLogsByUrl
}
