const { db } = require('../database/database.js')
const $logger = require('../components/Logger.js')

const getAd = async (id) => {
    $logger.debug('adRepositorie: getAd')

    const query = `SELECT * FROM ads WHERE id = ?`
    const values = [id]

    return new Promise(function (resolve, reject) {
        db.get(query, values, function (error, row) {

            if (error) {
                reject(error)
                return
            }

            if (!row) {
                reject('No ad with this ID was found')
                return
            }

            resolve(row)
        })
    })
}


const getAdsBySearchTerm = async (term, limit) => {
    $logger.debug('adRepositorie: getAd')

    const query = `SELECT * FROM ads WHERE searchTerm = ? LIMIT ?`
    const values = [term, limit]

    return new Promise(function (resolve, reject) {
        db.all(query, values, function (error, rows) {

            if (error) {
                reject(error)
                return
            }

            if (!rows) {
                reject('No ad with this term was found')
                return
            }

            resolve(rows)
        })
    })
}


const getAdsBySearchId = async (id, limit) => {
    $logger.debug('adRepositorie: getAd')

    const query = `SELECT * FROM ads WHERE searchId = ? LIMIT ?`
    const values = [id, limit]

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


const createAd = async (ad) => {
    $logger.debug('adRepositorie: createAd')

    const query = `
        INSERT INTO ads( id, url, title, searchTerm, price, created, lastUpdate )
        VALUES( ?, ?, ?, ?, ?, ?, ? )
    `

    const now = new Date().toISOString()

    const values = [
        ad.id,
        ad.url,
        ad.title,
        ad.searchTerm,
        ad.price,
        now,
        now
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

const updateAd = async (ad) => {
    $logger.debug('adRepositorie: updateAd')

    const query = `UPDATE ads SET price = ?, lastUpdate = ?  WHERE id = ?`
    const values = [ad.price, new Date().toISOString(), ad.id]

    return new Promise(function (resolve, reject) {
        db.run(query, values, function (error) {

            if (error) {
                reject(error)
                return
            }

            resolve(true)
        })
    })
}

module.exports = {
    getAd,
    getAdsBySearchTerm,
    getAdsBySearchId,
    createAd,
    updateAd
}
