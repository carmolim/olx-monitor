
const config = require('./config');
const axios = require('axios');
const cheerio = require('cheerio')
const Database = require('sqlite-async')
const fs = require('fs'); // Or `import fs from "fs";` with ESM


let firstTimeRunning = true

// checks for a log file was already created indicating that the program already ran
if ( fs.existsSync( config.logPath ) ) {
	firstTimeRunning = false
}

// create a stdout and file logger
const log = require('simple-node-logger').createSimpleLogger( config.logPath );

// check if the SQLite was already created
if ( !fs.existsSync( config.dbPath ) ) {
	
	log.info( 'No database found' );

	// creates the database with the needed schema
	createdb()
}


let minPrice, maxPrice;


const main = async() =>{

	log.info('Program started');

	try {
	    db = await Database.open( config.dbPath );
	} catch (error) {
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

	    		let result = {
	    			id,
		    		url,
		    		title,
		    		price,
		    		created
	    		}

				try {
					await processEntry( result )
			    } catch (error) {
					log.error( 'Could not process this entry' );
			        throw Error( 'Could not process this entry' );
			    }
	    	}

	    }

	} catch(err){
		log.error( 'Could not fetch the url' + url );
		throw Error( 'Could not fetch the url' + url );
	}
}


async function processEntry( entry ){

	switch ( true ) {
		case ( entry.price > maxPrice ) :
			maxPrice = entry.price
			break;
		case ( entry.price < minPrice ) :
			minPrice = entry.price
		break;
	}

	try{

		// check if this entry was already added to DB
		if( await adAlreadyAdded( entry ) ){
			return await compareExistingEntry( entry )
		}

		else{
			// create a new entry in the database
			return await addEntry( entry )
		}

	}catch(err){
		console.log(err)
	}

}

async function adAlreadyAdded( entry ){
	return await db.get(`SELECT id FROM ads WHERE id = ?`, entry.id );
}

async function addEntry( entry ){
	
	log.info('Saving new ad: ' + entry.url );

	// if is the firs time running don't send the Telegram notifications
	// because in the firs run all the ads are new
	if( !firstTimeRunning ){
		await sendNotification( 'New ad found \n' + entry.title + ' - R$' + entry.price + ' \n ' + entry.url )
	}

	try {

        const insertString = `INSERT INTO ads(id, url, title, price, created) VALUES(?, ?, ?, ?, ?)`;
        await db.run(insertString, entry.id, entry.url, entry.title, entry.price, entry.created );

    }

    catch (error) {

		log.error('Could not insert new entry');
        throw Error('Could not insert new entry');

    }

}

async function sendNotification( msg ) {

	msg = encodeURI(msg)

	try {
		return await axios.get('https://api.telegram.org/bot' + config.telegramToken + '/sendMessage?chat_id=' + config.telegramChatID + '&text=' + msg )
	} catch (error) {
		log.error('Error sending the Telegram message');
		console.error(error)
	}
}

async function compareExistingEntry( entry ){

	const savedEntry = await db.get(`SELECT price FROM ads WHERE id = ?`, entry.id );

	if( entry.price !== savedEntry.price ){

		await updateEntry( entry )

		// just send a notification if the price dropped
		if( entry.price < savedEntry.price ){

			log.info('This ad had a price reduction: ' + entry.url );
			return await sendNotification( 'Price drop found! \n From R$ ' + savedEntry.price + ' to R$ ' + entry.price + ' \n' + entry.title + ' \n ' + entry.url )

		}
	}
}

async function updateEntry( entry ){

	try {
        const sql = `UPDATE ads SET price = ? WHERE id = ?`;
        return await db.run(sql,  entry.price, entry.id );

    } catch (error) {
    	console.log(error)
		log.error('Erro ao atualizar um anúncio no banco de dados' );
        throw Error('Could not update this entry');
    }
}


async function createdb() {

	log.info( 'Creating a new database' );

	try {
	    db = await Database.open( config.dbPath );
	} catch (error) {
		log.error( 'Can not access sqlite database' );
	    throw Error( 'Can not access sqlite database' );
	}

	try {
		
        await db.run(`
	        CREATE TABLE "ads" (
				"id"	INTEGER NOT NULL UNIQUE,
				"title"	TEXT NOT NULL,
				"price"	INTEGER NOT NULL,
				"url"	TEXT NOT NULL,
				"created"	INTEGER NOT NULL
			)`
		);    

    } catch (error) {
		log.error( 'Could not create table' );
        throw Error( 'Could not create table')

    }
}
