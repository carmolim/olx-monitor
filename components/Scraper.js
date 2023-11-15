const config = require('../config')
const path = require('path')
const $httpClient = require('./HttpClient.js')
const cheerio = require('cheerio')
const log = require('simple-node-logger').createSimpleLogger(path.join(__dirname, '../', config.logFile));

const scraperRepository = require('../repositories/scrapperRepository.js')

const Ad = require('./Ad.js')

let page = 1
let maxPrice = 0
let minPrice = 99999999
let sumPrices = 0
let validAds = 0
let adsFound = 0
let nextPage = true

const scraper = async (url) => {
    page = 1
    maxPrice = 0
    minPrice = 99999999
    sumPrices = 0
    adsFound = 0
    validAds = 0
    nextPage = true

    const parsedUrl = new URL(url)
    const searchTerm = parsedUrl.searchParams.get('q') || ''
    const notify = await urlAlreadySearched(url)

    do {
        currentUrl = setUrlParam(url, 'o', page)
        try {
            const response  = await $httpClient(currentUrl)
            const html      = response.data;
            const $         = cheerio.load(html)
            nextPage        = await scrapePage($, searchTerm, notify, url)
        } catch (error) {
            log.error(error);
            return
        }

        page++

    } while (nextPage);

    log.info('Valid ads: ' + validAds)

    if (validAds) {
        const averagePrice = sumPrices / validAds;

        log.info('Maximum price: ' + maxPrice)
        log.info('Minimum price: ' + minPrice)
        log.info('Average price: ' + sumPrices / validAds)

        const scrapperLog = {
            url,
            adsFound: validAds,
            averagePrice,
            minPrice,
            maxPrice,
        }

        await scraperRepository.saveLog(scrapperLog)
    }
}

const scrapePage = async ($, searchTerm, notify) => {
    try {
        const script = $('script[id="__NEXT_DATA__"]').text()
        const adList = JSON.parse(script).props.pageProps.ads

        if (!adList.length) {
            return false
        }

        adsFound += adList.length

        log.info(`Checking new ads for: ${searchTerm}`)
        log.info('Ads found: ' + adsFound)

        for (let i = 0; i < adList.length; i++) {

            log.debug('Checking ad: ' + (i + 1))

            const advert = adList[i]
            const title = advert.subject
            const id = advert.listId
            const url = advert.url
            const price = parseInt(advert.price?.replace('R$ ', '')?.replace('.', '') || '0')

            const result = {
                id,
                url,
                title,
                searchTerm,
                price,
                notify
            }

            const ad = new Ad(result)
            ad.process()

            if (ad.valid) {
                validAds++
                minPrice = checkMinPrice(ad.price, minPrice)
                maxPrice = checkMaxPrice(ad.price, maxPrice)
                sumPrices += ad.price
            }
        }

        return true
    } catch (error) {
        log.error(error);
        throw new Error('Scraping failed');
    }
}

const urlAlreadySearched = async (url) => {
    try {
        const ad = await scraperRepository.getLogsByUrl(url, 1)
        if (ad.length) {
            return true
        }
        return false
    } catch (error) {
        log.error(error)
        return false
    }
}

const setUrlParam = (url, param, value) => {
    const newUrl = new URL(url)
    let searchParams = newUrl.searchParams;
    searchParams.set(param, value);
    newUrl.search = searchParams.toString();
    return newUrl.toString();
}

const checkMinPrice = (price, minPrice) => {
    if (price < minPrice) return price
    else return minPrice
}

const checkMaxPrice = (price, maxPrice) => {
    if (price > maxPrice) return price
    else return maxPrice
}

module.exports = {
    scraper
}
