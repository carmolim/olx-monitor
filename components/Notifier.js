'use strict';

const config = require( '../config' )
const axios = require('axios')

exports.sendNotification = async ( msg ) => {
    
    msg = encodeURI( msg )

    const MAX_RETRIES = 5;

    for (let i = 0; i <= MAX_RETRIES; i++) {
        try {
            return await axios.get('https://api.telegram.org/bot' + config.telegramToken + '/sendMessage?chat_id=' + config.telegramChatID + '&text=' + msg )
        } catch (err) {
            const timeout = Math.pow(2, i)
            console.log('Waiting', timeout, 'ms')
            await wait(timeout)
            console.log('Retrying', err.message, i)
        }
    }
}

function wait (timeout) {
    return new Promise((resolve) => {
        setTimeout(() => {
        resolve()
        }, timeout);
    })
}