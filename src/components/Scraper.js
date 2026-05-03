'use strict';

const $logger = require('./Logger');
const $httpClient = require('./HttpClient.js');
const scraperRepository = require('../repositories/scrapperRepository.js');
const PriceAnalyzer = require('./PriceAnalyzer');
const Ad = require('./Ad.js');

/**
 * Main Scraper function
 */
const scraper = async (url) => {
    const state = {
        page: 1,
        validAds: 0,
        adsFound: 0,
        nextPage: true,
        prices: [],
        searchName: ''
    };

    try {
        const parsedUrl = new URL(url);
        state.searchName = parsedUrl.searchParams.get('q') || parsedUrl.pathname || 'search';
        
        const notify = await urlAlreadySearched(url);
        $logger.info(`Scraping "${state.searchName}". Notify: ${notify}`);

        do {
            const currentUrl = setUrlParam(url, 'o', state.page);
            const response = await $httpClient(currentUrl);
            
            if (!response) {
                $logger.error(`No response for ${currentUrl}`);
                break;
            }

            // PERFORMANCE: Extract JSON without loading full Cheerio DOM
            const adList = extractAdsFromJson(response);
            
            if (!adList || adList.length === 0) {
                state.nextPage = false;
            } else {
                state.nextPage = await processAds(adList, notify, url, state);
                state.page++;
            }

        } while (state.nextPage && state.page <= 10);

        await finalizeScraping(url, state);

    } catch (error) {
        $logger.error(`Scraper failed for ${url}: ${error.message}`);
    }
};

/**
 * High performance JSON extraction from HTML
 */
const extractAdsFromJson = (html) => {
    try {
        const token = '<script id="__NEXT_DATA__" type="application/json">';
        const start = html.indexOf(token);
        if (start === -1) return null;
        
        const jsonStart = start + token.length;
        const end = html.indexOf('</script>', jsonStart);
        if (end === -1) return null;
        
        const jsonStr = html.substring(jsonStart, end);
        const data = JSON.parse(jsonStr);
        return data.props?.pageProps?.ads || null;
    } catch (e) {
        $logger.debug(`JSON extraction failed: ${e.message}`);
        return null;
    }
};

const processAds = async (adList, notify, searchUrl, state) => {
    state.adsFound += adList.length;

    // Process ads in sequence to be safe with database/notifications
    for (const advert of adList) {
        const price = parseInt(advert.price?.replace('R$ ', '')?.replace(/\./g, '') || '0');
        
        const ad = new Ad({
            id: advert.listId,
            url: advert.url,
            title: advert.subject,
            searchTerm: state.searchName,
            searchUrl,
            price,
            notify
        });

        await ad.process();

        if (ad.valid) {
            state.validAds++;
            if (ad.price > 0) state.prices.push(ad.price);
        }
    }

    return true;
};

const finalizeScraping = async (url, state) => {
    if (state.prices.length === 0) {
        $logger.info(`No priced ads found for ${state.searchName}`);
        return;
    }

    const stats = PriceAnalyzer.calculateStats(state.prices);
    
    $logger.info(`--- Statistics for: ${state.searchName} ---`);
    $logger.info(`Pages: ${state.page - 1} | Ads Found: ${state.validAds}`);
    $logger.info(`Max Price: R$ ${stats.maxPriceFiltered} | Min Price: R$ ${stats.minPriceFiltered}`);
    $logger.info(`Average: R$ ${Math.round(stats.average)} | Median: R$ ${stats.median}`);
    
    if (stats.mode) $logger.info(`Mode: R$ ${stats.mode}`);
    if (stats.modalInterval) $logger.info(`Modal Interval: ${stats.modalInterval.label} (${stats.modalInterval.count} ads)`);
    
    $logger.info(`Recommended: ${stats.recommended} | Good Price (P45): R$ ${stats.goodPrice}`);
    $logger.info(`--------------------------------------------`);

    const logData = {
        url,
        adsFound: state.validAds,
        averagePrice: stats.average,
        minPrice: stats.minPriceFiltered,
        maxPrice: stats.maxPriceFiltered,
        medianPrice: stats.median,
        modePrice: stats.mode,
        modalIntervalStart: stats.modalInterval?.start ?? null,
        modalIntervalEnd: stats.modalInterval?.end ?? null,
        modalIntervalWidth: stats.modalInterval?.width ?? null,
        modalIntervalCount: stats.modalInterval?.count ?? null,
        modalTop3BinsJson: stats.modalTop3BinsJson,
        goodPrice: stats.goodPrice,
        goodPriceType: stats.goodPriceType,
        stdDevPrice: stats.stdDev,
        cvPrice: stats.cv,
        sampleSize: stats.count,
    };

    await scraperRepository.saveLog(logData);
    await logTrend(url, stats.median);
};

const logTrend = async (url, currentMedian) => {
    try {
        const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const prev = await scraperRepository.getLatestLogBefore(url, cutoff);
        
        if (prev?.medianPrice && currentMedian) {
            const deltaPct = ((currentMedian - prev.medianPrice) / prev.medianPrice) * 100;
            $logger.info(`Trend (7d+): median ${prev.medianPrice} -> ${currentMedian} (${deltaPct.toFixed(1)}%)`);
        }
    } catch (e) {
        $logger.error(`Trend log failed: ${e.message}`);
    }
};

const urlAlreadySearched = async (url) => {
    try {
        const logs = await scraperRepository.getLogsByUrl(url, 1);
        return logs.length > 0;
    } catch (e) {
        return false;
    }
};

const setUrlParam = (url, param, value) => {
    const newUrl = new URL(url);
    newUrl.searchParams.set(param, value);
    return newUrl.toString();
};

module.exports = { scraper };
