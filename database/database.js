const path = require( 'path' )
const config = require( '../config' )
const sqlite = require("sqlite3").verbose()
const db = new sqlite.Database(
    path.join( __dirname, '../', config.dbFile )
)

const createTables = async () => {

    const query = `
        CREATE TABLE IF NOT EXISTS "ads" (
            "id"            INTEGER NOT NULL UNIQUE,
            "searchTerm"    TEXT NOT NULL,
            "title"	        TEXT NOT NULL,
            "price"         INTEGER NOT NULL,
            "url"           TEXT NOT NULL,
            "created"       INTEGER NOT NULL,
            "lastUpdate"    INTEGER NOT NULL
        )
    `

    return new Promise(function(resolve, reject){
        db.run(query, function(error){

            if(error){
                reject(error)
                return
            }

            resolve(true)
        })
    })
}

module.exports = {
    db,
    createTables
}