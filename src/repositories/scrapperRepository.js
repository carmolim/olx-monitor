const { db } = require('../database/database.js')
const $logger = require('../components/Logger.js')

const saveLog = async (data) => {
    $logger.debug('scrapperRepository: saveLog')

    const query = `
        INSERT INTO logs(
            url,
            adsFound,
            averagePrice,
            minPrice,
            maxPrice,
            medianPrice,
            modePrice,
            modalIntervalStart,
            modalIntervalEnd,
            modalIntervalWidth,
            modalIntervalCount,
            modalTop3BinsJson,
            goodPrice,
            goodPriceType,
            stdDevPrice,
            cvPrice,
            sampleSize,
            created
        )
        VALUES( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )
    `

    const now = new Date().toISOString()

    const values = [
        data.url,
        data.adsFound,
        data.averagePrice,
        data.minPrice,
        data.maxPrice,
        data.medianPrice ?? null,
        data.modePrice ?? null,
        data.modalIntervalStart ?? null,
        data.modalIntervalEnd ?? null,
        data.modalIntervalWidth ?? null,
        data.modalIntervalCount ?? null,
        data.modalTop3BinsJson ?? null,
        data.goodPrice ?? null,
        data.goodPriceType ?? null,
        data.stdDevPrice ?? null,
        data.cvPrice ?? null,
        data.sampleSize ?? null,
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

const getLatestLogBefore = async (url, beforeIso) => {
    $logger.debug('scrapperRepository: getLatestLogBefore')

    const query = `
        SELECT *
        FROM logs
        WHERE url = ? AND created <= ?
        ORDER BY created DESC
        LIMIT 1
    `
    const values = [url, beforeIso]

    return new Promise(function (resolve, reject) {
        db.get(query, values, function (error, row) {
            if (error) {
                reject(error)
                return
            }
            resolve(row || null)
        })
    })
}

const getLatestLog = async (url) => {
    $logger.debug('scrapperRepository: getLatestLog')

    const query = `
        SELECT *
        FROM logs
        WHERE url = ?
        ORDER BY created DESC
        LIMIT 1
    `
    const values = [url]

    return new Promise(function (resolve, reject) {
        db.get(query, values, function (error, row) {
            if (error) {
                reject(error)
                return
            }
            resolve(row || null)
        })
    })
}

const getLogsSince = async (url, sinceIso) => {
    $logger.debug('scrapperRepository: getLogsSince')

    const query = `
        SELECT created, medianPrice
        FROM logs
        WHERE url = ? AND created >= ? AND medianPrice IS NOT NULL
        ORDER BY created ASC
    `
    const values = [url, sinceIso]

    return new Promise(function (resolve, reject) {
        db.all(query, values, function (error, rows) {
            if (error) {
                reject(error)
                return
            }
            resolve(rows || [])
        })
    })
}

module.exports = {
    saveLog,
    getLogsByUrl,
    getLatestLogBefore,
    getLatestLog,
    getLogsSince
}
