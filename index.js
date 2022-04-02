const config = require('./config')
const axios = require('axios')
const cheerio = require('cheerio')
const Database = require('sqlite-async')
const fs = require('fs')
const path = require('path')

const Ad = require('./components/Ad.js')

let firstTimeRunning = true

// checks for a log file was already created indicating that the program already ran
if ( fs.existsSync( path.join( __dirname, config.logPath ) ) ) {
    firstTimeRunning = false
}

// create a stdout and file logger
const log = require('simple-node-logger').createSimpleLogger( path.join( __dirname, config.logPath ) );

// check if the SQLite was already created
if ( !fs.existsSync( path.join( __dirname, config.dbPath ) ) ) {
    
    log.info( 'No database found' );

    // creates the database with the needed schema
    createdb()
}
else{
    log.info( 'Database found' );
}

let minPrice, maxPrice;

const main = async() =>{

    log.info('Program started');

    try {

        db = await Database.open( path.join( __dirname, config.dbPath ) );
        
    } catch (error) {

        log.error( error );
        throw Error('can not access sqlite database');
        
    }

    for( let i=0; i<config.urls.length; i++ ){

        try {

            await scrapper ( config.urls[i] )

        } catch (error) {

            throw Error('can not access sqlite database');

        }
    }

    log.info('Program ended');

}

main()


async function scrapper( url ){

    maxPrice = 0
    minPrice = 99999999

    try{

        const response = await axios( url )

        const html = response.data;
        const $ = cheerio.load(html)
        const $ads = $('#ad-list li')

        log.info( 'Cheking for new ads at: ' + url );
        log.info( $ads.length + ' ads found' );

        for( let i=0; i< $ads.length; i++ )
        {

            const element = $ads[i]

            const id      = $(element).children('a').attr('data-lurker_list_id');
            const url     = $(element).children('a').attr('href');
            const title   = $(element).find('h2').first().text().trim();
            const price   = parseInt( $(element).find('p').first().text().replace('R$ ', '').replace('.', '') );
            const created = new Date().getTime();

            // some elements found in the ads selection don't have an url
            // I supposed that OLX adds other content between the ads,
            // let's clean those empty ads
            if( url ){

                const result = {
                    id,
                    url,
                    title,
                    price,
                    created
                }
                
                try {
                    const ad = await new Ad( result, firstTimeRunning )

                } catch ( error ) {

                    log.error( 'Could not process this entry' );
                    throw Error( error );
                }
            }

        }

    } catch( error ){
        log.error( 'Could not fetch the url' + url );
        throw Error( error );
    }
}

async function createdb() {

    log.info( 'Creating a new database' );

    try {

        db = await Database.open( path.join( __dirname, config.dbPath ) );
        
    } catch ( error ) {

        log.error( 'Can not access sqlite database' );
        throw Error( error );
    }

    try {
        
        await db.run(`
            CREATE TABLE "ads" (
                "id"            INTEGER NOT NULL UNIQUE,
                "title"	        TEXT NOT NULL,
                "price"         INTEGER NOT NULL,
                "url"           TEXT NOT NULL,
                "created"       INTEGER NOT NULL,
                "lastUpdate"    INTEGER NOT NULL
            )`
        );    

    } catch ( error ) {

        log.error( 'Could not create table' );
        throw Error( error )

    }
}
