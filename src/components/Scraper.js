const cheerio = require('cheerio')
const $logger = require('./Logger')
const $httpClient = require('./HttpClient.js')
const scraperRepository = require('../repositories/scrapperRepository.js')

const Ad = require('./Ad.js');

let page = 1
let maxPrice = 0
let minPrice = 99999999
let sumPrices = 0
let validAds = 0
let adsFound = 0
let nextPage = true
let seenIds = new Set()

// OLX serves at most 100 pages: past that it replays the last one
const MAX_PAGES = 100

const scraper = async (url) => {
    page = 1
    maxPrice = 0
    minPrice = 99999999
    sumPrices = 0
    adsFound = 0
    validAds = 0
    nextPage = true
    seenIds = new Set()

    const parsedUrl = new URL(url)
    const searchTerm = parsedUrl.searchParams.get('q') || ''
    const notify = await urlAlreadySearched(url)
    $logger.info(`Will notify: ${notify}`)

    do {
        const currentUrl = setUrlParam(url, 'o', page)
        let response
        try {
            response        = await $httpClient(currentUrl)
            const $         = cheerio.load(response)
            nextPage        = await scrapePage($, searchTerm, notify, url)
        } catch (error) {
            $logger.error(error)
            return
        }
        page++

    } while (nextPage && page <= MAX_PAGES);

    if (page > MAX_PAGES) {
        $logger.info('Reached the last page OLX will serve (' + MAX_PAGES + ')')
    }

    $logger.info('Valid ads: ' + validAds)

    if (validAds) {
        const averagePrice = sumPrices / validAds;

        $logger.info('Maximum price: ' + maxPrice)
        $logger.info('Minimum price: ' + minPrice)
        $logger.info('Average price: ' + sumPrices / validAds)

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
        let adList

        if (script) {
            adList = JSON.parse(script).props.pageProps.ads
        } else {
            const flightScript = $('script:not([src])').toArray()
                .map(element => $(element).text())
                .find(script => script.includes('listId'))

            // past the last page OLX serves a valid page with no ad payload
            if (!flightScript) {
                $logger.info('No ads on this page, stopping pagination')
                return false
            }

            const payload = JSON.parse(flightScript.match(/^self\.__next_f\.push\((.*)\)\s*$/s)[1])[1]
            adList = JSON.parse(payload.match(/"ads":(\[.*\]),"searchBoxProps":/s)[1])
        }

        if (!Array.isArray(adList) || !adList.length ) {
            return false
        }

        // a page without a single new ad means the results are exhausted
        adList = adList.filter(advert => !seenIds.has(advert.listId))

        if (!adList.length) {
            $logger.info('No new ads on this page, stopping pagination')
            return false
        }

        adList.forEach(advert => seenIds.add(advert.listId))

        adsFound += adList.length

        $logger.info(`Checking new ads for: ${searchTerm}`)
        $logger.info('Ads found: ' + adsFound)

        for (let i = 0; i < adList.length; i++) {

            $logger.debug('Checking ad: ' + (i + 1))

            const advert = adList[i]
            const title = advert.subject
            const id = advert.listId
            const url = advert.url
            const rawPrice = advert.price ?? advert.priceValue ?? '0'
            const price = parseInt(String(rawPrice).replace(/\D/g, '') || '0')

            const result = {
                id,
                url,
                title,
                searchTerm,
                price,
                notify
            }

            const ad = new Ad(result)
            await ad.process()

            if (ad.valid) {
                validAds++
                minPrice = checkMinPrice(ad.price, minPrice)
                maxPrice = checkMaxPrice(ad.price, maxPrice)
                sumPrices += ad.price
            }
        }

        return true
    } catch (error) {
        $logger.error(error);
        throw new Error('Scraping failed');
    }
}

const urlAlreadySearched = async (url) => {
    try {
        const ad = await scraperRepository.getLogsByUrl(url, 1)
        if (ad.length) {
            return true
        }
        $logger.info('First run, no notifications')
        return false
    } catch (error) {
        $logger.error(error)
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
