const config = require('../config')
const path = require('path')
const axios = require('axios')
const cheerio = require('cheerio')
const log = require('simple-node-logger').createSimpleLogger( path.join( __dirname, '../', config.logFile ) );

const adRepository = require('../repositories/adRepositorie.js')
const Ad = require('./Ad.js')

let page = 1
let maxPrice = 0
let minPrice = 99999999
let sumPrices = 0
let validAds = 0
let nextPage = 0

const scraper = async (url) => {

    console.log('scraper');

    page = 1
    maxPrice = 0
    minPrice = 99999999
    sumPrices = 0
    validAds = 0
    nextPage = 0


    let searchTerm = new URL(url)
    searchTerm = searchTerm.searchParams.get('q')

    const notify = !termAlreadySearched(searchTerm, 1)

    do {
        url = setUrlParam(url, 'o', page)
        console.log(url);

        const response  = await axios( url )
        const html      = response.data;
        const $         = cheerio.load(html)
        nextPage        = $('[data-lurker-detail="next_page"]').length

        scrapePage(url, searchTerm, notify)

        page++

    } while (nextPage);
}

const scrapePage = async (url, searchTerm, notify) => {

    try{

        const response  = await axios( url )
        const html      = response.data;
        const $         = cheerio.load(html)
        const $ads      = $('ul#ad-list li')
        const nextPage  = $('[data-lurker-detail="next_page"]')

        log.info( `Checking new ads for: ${searchTerm}` )
        log.info( 'Ads found: ' + $ads.length )

        for( let i = 0; i < $ads.length; i++ ){

            log.debug( 'Checking ad: ' + (i+1))
        
            const element   = $ads[i]
            const title     = $(element).find('h2').first().text().trim()
            const id        = $(element).find('a').first().attr('data-lurker_list_id')
            const url       = $(element).find('a').first().attr('href')
            const price     = parseInt( $(element).find('span[aria-label^="Preço"]').first().text().replace('R$ ', '').replace('.', '') || '0' )

            const result = {
                id,
                url,
                title,
                searchTerm,
                price,
                notify
            }
            
            try {
                const ad = new Ad( result )
                await ad.process()

                if(ad.valid){
                    validAds++
                    minPrice = checkMinPrice(ad.price, minPrice)
                    maxPrice = checkMaxPrice(ad.price, maxPrice)
                    sumPrices += ad.price
                }

            } catch ( error ) {
                log.error( error )
            }
        }
        
        log.info( 'Valid ads: ' + validAds )
        log.info( 'Maximum price: ' + maxPrice)
        log.info( 'Minimum price: ' + minPrice)
        log.info( 'Average price: ' + sumPrices / validAds)

    } catch( error ){
        log.error( error );
        log.error( 'Could not fetch the url ' + url )
    }

}

const termAlreadySearched = async (term, limit) => {
    try {
        await adRepository.getAdsBySearchTerm(term, limit)
        return true
    } catch (error) {
        log.error( error )
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
    if(price < minPrice) return price
    else return minPrice
}

const checkMaxPrice = (price, maxPrice) => {
    if(price > maxPrice) return price
    else return maxPrice
}

module.exports = {
    scraper
}