const puppeteer = require('puppeteer-extra') 
// add stealth plugin and use defaults (all evasion techniques) 
const StealthPlugin = require('puppeteer-extra-plugin-stealth') 
puppeteer.use(StealthPlugin()) 

const cheerio = require('cheerio')



// puppeteer usage as normal 
puppeteer.launch({ headless: true}).then(async browser => { 
	const page = await browser.newPage() 
	await page.goto('https://www.olx.com.br/brasil?q=funko') 
	await page.waitForTimeout(2000) 
    const data = await page.evaluate(() => document.querySelector('*').outerHTML);
    const $ = cheerio.load(data)
    const script = $('script[id="__NEXT_DATA__"]').text()
    const adList = JSON.parse(script).props.pageProps.ads
    console.log(adList);
	await browser.close() 
});


// (async function main() {
// try {
//     const browser = await puppeteer.launch();
//     const [page] = await browser.pages();

//     await page.goto('https://www.olx.com.br/brasil?q=funko', { waitUntil: 'networkidle0' });
//     const data = await page.evaluate(() => document.querySelector('*').outerHTML);

//     console.log(data);

//     await browser.close();
//   } catch (err) {
//     console.error(err);
//   }
// })();