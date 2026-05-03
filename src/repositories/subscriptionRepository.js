const { db } = require('../database/database.js');
const $logger = require('../components/Logger.js');

const addSubscription = async (chatId, url, searchName, threadId = null, username = null) => {
    $logger.debug('subscriptionRepository: addSubscription');

    const query = `
        INSERT INTO subscriptions (chatId, url, searchName, threadId, username, created)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    const now = new Date().toISOString();
    const values = [String(chatId), url, searchName, threadId ? String(threadId) : null, username, now];

    return new Promise((resolve, reject) => {
        db.run(query, values, function (error) {
            if (error) {
                if (error.message.includes('UNIQUE constraint failed')) {
                    resolve(false);
                    return;
                }
                reject(error);
                return;
            }
            resolve(true);
        });
    });
};

const removeSubscription = async (chatId, url) => {
    $logger.debug('subscriptionRepository: removeSubscription');

    const query = `DELETE FROM subscriptions WHERE chatId = ? AND url = ?`;
    const values = [String(chatId), url];

    return new Promise((resolve, reject) => {
        db.run(query, values, function (error) {
            if (error) {
                reject(error);
                return;
            }
            resolve(this.changes > 0);
        });
    });
};

const getSubscriptionsByChat = async (chatId) => {
    $logger.debug('subscriptionRepository: getSubscriptionsByChat');

    const query = `SELECT * FROM subscriptions WHERE chatId = ? ORDER BY created DESC`;
    const values = [String(chatId)];

    return new Promise((resolve, reject) => {
        db.all(query, values, function (error, rows) {
            if (error) {
                reject(error);
                return;
            }
            resolve(rows || []);
        });
    });
};

/**
 * Returns an array of objects { chatId, threadId, username }
 */
const getChatsByUrl = async (url) => {
    $logger.debug('subscriptionRepository: getChatsByUrl');

    const query = `SELECT chatId, threadId, username FROM subscriptions WHERE url = ?`;
    const values = [url];

    return new Promise((resolve, reject) => {
        db.all(query, values, function (error, rows) {
            if (error) {
                reject(error);
                return;
            }
            resolve(rows || []);
        });
    });
};

const getAllDistinctUrls = async () => {
    $logger.debug('subscriptionRepository: getAllDistinctUrls');

    const query = `SELECT DISTINCT url FROM subscriptions`;

    return new Promise((resolve, reject) => {
        db.all(query, [], function (error, rows) {
            if (error) {
                reject(error);
                return;
            }
            resolve(rows ? rows.map(r => r.url) : []);
        });
    });
};

module.exports = {
    addSubscription,
    removeSubscription,
    getSubscriptionsByChat,
    getChatsByUrl,
    getAllDistinctUrls
};
