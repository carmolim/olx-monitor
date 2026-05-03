'use strict';

const config = require('../config');
const $logger = require('./Logger');
const subscriptionRepository = require('../repositories/subscriptionRepository');
const notifier = require('./Notifier');

class TelegramBot {
    constructor() {
        this.token = config.telegramToken;
        this.apiUrl = `https://api.telegram.org/bot${this.token}`;
        this.offset = 0;
        this.isRunning = false;
    }

    async start() {
        if (!this.token) {
            $logger.warn('Telegram token is missing. Bot cannot start.');
            return;
        }
        
        $logger.info('Telegram Bot Listener started. Ready for commands.');
        this.isRunning = true;
        this.poll();
    }

    stop() {
        this.isRunning = false;
        $logger.info('Telegram Bot Listener stopped.');
    }

    async poll() {
        if (!this.isRunning) return;

        try {
            const response = await fetch(`${this.apiUrl}/getUpdates?offset=${this.offset}&timeout=30`);
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.ok && data.result.length > 0) {
                    for (const update of data.result) {
                        this.offset = update.update_id + 1;
                        
                        if (update.message && update.message.text) {
                            await this.handleMessage(update.message);
                        }
                        
                        if (update.callback_query) {
                            await this.handleCallbackQuery(update.callback_query);
                        }
                    }
                }
            } else {
                $logger.error(`Telegram API Error (Polling): ${response.status}`);
                await this._sleep(5000);
            }
        } catch (e) {
            if (e.name !== 'AbortError' && e.code !== 'ECONNRESET') {
                $logger.error(`Polling error: ${e.message}`);
                await this._sleep(5000);
            }
        }

        if (this.isRunning) {
            setTimeout(() => this.poll(), 0);
        }
    }

    async handleMessage(message) {
        const chatId = message.chat.id;
        const text = message.text.trim();
        const threadId = message.message_thread_id || null;
        const username = message.from?.username || null;

        $logger.debug(`Message from ${chatId} (User: ${username}, Thread: ${threadId}): ${text}`);

        if (text.startsWith('/start')) {
            await this.handleStart(chatId, threadId);
        } else if (text.startsWith('/add ')) {
            await this.handleAdd(chatId, text, threadId, username);
        } else if (text.startsWith('/remove')) {
            await this.handleRemove(chatId, text, threadId);
        } else if (text.startsWith('/list')) {
            await this.handleList(chatId, threadId);
        }
    }

    async handleCallbackQuery(query) {
        const chatId = query.message.chat.id;
        const messageId = query.message.message_id;
        const threadId = query.message.message_thread_id || null;
        const data = query.data;

        if (data.startsWith('rem_')) {
            const subId = parseInt(data.replace('rem_', ''));
            const subs = await subscriptionRepository.getSubscriptionsByChat(chatId);
            const subToDelete = subs.find(s => s.id === subId);

            if (subToDelete) {
                await subscriptionRepository.removeSubscription(chatId, subToDelete.url);
                await fetch(`${this.apiUrl}/answerCallbackQuery?callback_query_id=${query.id}&text=Removido!`);
                
                await fetch(`${this.apiUrl}/editMessageText`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        message_id: messageId,
                        message_thread_id: threadId,
                        text: `✅ <b>Removido:</b> ${subToDelete.searchName}`,
                        parse_mode: 'HTML'
                    })
                });
            }
        }
    }

    async handleStart(chatId, threadId) {
        const msg = `👋 <b>OLX Monitor</b>\n\n` +
                    `➕ <code>/add [LINK] [NOME]</code>\n` +
                    `➖ <code>/remove</code>\n` +
                    `📋 <code>/list</code>`;
        await notifier.sendNotification(chatId, msg, { threadId });
    }

    async handleAdd(chatId, text, threadId, username) {
        const match = text.match(/\/add\s+(https?:\/\/[^\s]+)(?:\s+(.+))?/);
        
        if (!match) {
            await notifier.sendNotification(chatId, '❌ Use: <code>/add [LINK] [NOME_OPCIONAL]</code>', { threadId });
            return;
        }

        const url = match[1];
        let searchName = match[2] ? match[2].trim() : null;

        try {
            new URL(url); // Valida se é uma URL real
            
            if (!searchName) {
                const parsedUrl = new URL(url);
                searchName = parsedUrl.searchParams.get('q') || parsedUrl.pathname.split('/').pop() || 'Busca';
            }

            const success = await subscriptionRepository.addSubscription(chatId, url, searchName, threadId, username);
            
            if (success) {
                await notifier.sendNotification(chatId, `✅ <b>Monitorando:</b> <a href="${url}">${searchName}</a>`, { threadId });
            } else {
                await notifier.sendNotification(chatId, `⚠️ Já estou monitorando este link.`, { threadId });
            }
        } catch (e) {
            if (e instanceof TypeError) {
                await notifier.sendNotification(chatId, `❌ URL inválida. Certifique-se de que o link começa com http/https.`, { threadId });
            } else {
                $logger.error(`Add Subscription error: ${e.message}`);
                await notifier.sendNotification(chatId, `❌ Erro interno ao salvar a busca.`, { threadId });
            }
        }
    }

    async handleRemove(chatId, text, threadId) {
        const subs = await subscriptionRepository.getSubscriptionsByChat(chatId);
        if (subs.length === 0) {
            await notifier.sendNotification(chatId, '📭 Nenhuma busca ativa.', { threadId });
            return;
        }

        const buttons = subs.map(sub => ([{
            text: `❌ ${sub.searchName}`,
            callback_data: `rem_${sub.id}`
        }]));

        await notifier.sendNotification(chatId, '🗑️ <b>Remover busca:</b>', {
            threadId,
            reply_markup: { inline_keyboard: buttons }
        });
    }

    async handleList(chatId, threadId) {
        const subs = await subscriptionRepository.getSubscriptionsByChat(chatId);
        if (subs.length === 0) {
            await notifier.sendNotification(chatId, `📭 <b>Nenhuma busca ativa.</b>`, { threadId });
            return;
        }

        let msg = '';
        subs.forEach((sub, i) => {
            msg += `${i + 1}. <a href="${sub.url}">${sub.searchName}</a>\n`;
        });

        await notifier.sendNotification(chatId, msg, { threadId });
    }

    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new TelegramBot();
