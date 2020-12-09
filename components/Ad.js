'use strict';

const path = require( 'path' )
const config = require( '../config' )
const Database = require( 'sqlite-async' )
const notifier = require( './Notifier' )


class Ad{
    
    constructor( ad ){
        this.id      = ad.id
        this.url     = ad.url
        this.title   = ad.title
        this.price   = ad.price
        this.created = ad.created
        this.db;

        this.process()
    }

    process = async () => {

        try {

            this.db = await Database.open( path.resolve( '.', config.dbPath ) );

        } catch (error) {

            console.log( error )
            throw Error('can not access sqlite database');

        }
        
        try{

            // check if this entry was already added to DB
            if( await this.alreadySaved() ){
                return await this.checkPriceChange()
            }
    
            else{
                // create a new entry in the database
                return await this.addToDataBase()
            }
    
        } catch( error ){

            console.log(error)
            throw Error( error );

        }
    }

    alreadySaved = async () => {
        return await this.db.get(`SELECT id FROM ads WHERE id = ?`, this.id );
    }

    addToDataBase = async () => {

        // log.info('Saving new ad: ' + this.url );
    
        try {
    
            const insertString = `INSERT INTO ads( id, url, title, price, created, lastUpdate ) VALUES( ?, ?, ?, ?, ?, ? )`;
            await this.db.run(insertString, this.id, this.url, this.title, this.price, this.created, new Date().getTime() );
    
        }
    
        catch ( error )  {
    
            // log.error('Could not insert new entry');
            throw Error(error);
    
        }
    }

    updatePrice = async () => {

        try {

            const sql = `UPDATE ads SET price = ?, lastUpdate = ?  WHERE id = ?`;
            return await this.db.run( sql, this.price, this.id, new Date().getTime() );
    
        } catch ( error ) {
            
            // log.error('Erro ao atualizar um anúncio no banco de dados' );
            throw Error(  error );
        }
    }

    checkPriceChange = async () => {

        const savedEntry = await this.db.get(`SELECT price FROM ads WHERE id = ?`, this.id );
    
        if( this.price !== savedEntry.price ){
    
            await this.updatePrice()
    
            // just send a notification if the price dropped
            if( this.price < savedEntry.price ){

                // log.info('This ad had a price reduction: ' + this.url );

                const msg =
                `Price drop found!
                From R$${savedEntry.price} to R$ ${this.price}
                ${this.title}
                ${this.url}`

                return await notifier.sendNotification( msg )
    
            }
        }
    }
}

module.exports = Ad;